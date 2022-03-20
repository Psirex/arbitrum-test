//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {IERC20} from "./interfaces/IERC20.sol";
import {IInbox} from "./interfaces/arbitrum/IInbox.sol";
import {IBridge} from "./interfaces/arbitrum/IBridge.sol";
import {IOutbox} from "./interfaces/arbitrum/IOutbox.sol";

interface MintableERC20 {
    function mint(address recipient, uint256 amount) external;
}

interface IL2TokensGateway {
    function sendToL1(uint256 amount) external;

    function mintTokens(address recipient, uint256 amount) external;
}

contract L1TokensGateway {
    IInbox public immutable INBOX;
    IERC20 public immutable L1TOKEN;
    IL2TokensGateway public immutable L2_TOKENS_GATEWAY;

    constructor(
        address inbox,
        address l1Token,
        address l2TokensGateway
    ) {
        INBOX = IInbox(inbox);
        L1TOKEN = IERC20(l1Token);
        L2_TOKENS_GATEWAY = IL2TokensGateway(l2TokensGateway);
    }

    // sends tx to Arbitrum to mint tokens
    function sendToL2(
        uint256 amount,
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    ) public payable returns (uint256) {
        bool success = L1TOKEN.transferFrom(msg.sender, address(this), amount);
        if (!success) {
            revert TokenTransferFailed();
        }
        bytes memory data = abi.encodeWithSelector(
            IL2TokensGateway.mintTokens.selector,
            msg.sender,
            amount
        );
        uint256 ticketId = INBOX.createRetryableTicket{value: msg.value}(
            address(L2_TOKENS_GATEWAY),
            0,
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            data
        );
        emit TokensSent(ticketId);
        return ticketId;
    }

    // Arbitrum calls this method on tokens withdrow
    function releaseTokens(address acount, uint256 amount) public {
        IBridge bridge = INBOX.bridge();

        // prevents reentrancies on L2 to L1 txs
        if (msg.sender != address(bridge)) {
            revert NotBridge();
        }
        IOutbox outbox = IOutbox(bridge.activeOutbox());
        address l2Sender = outbox.l2ToL1Sender();
        if (l2Sender != address(L2_TOKENS_GATEWAY)) {
            revert NotL2Token();
        }

        bool succeed = L1TOKEN.transfer(acount, amount);
        if (!succeed) {
            revert TokenTransferFailed();
        }
    }

    event TokensSent(uint256 indexed tickedId);

    error NotBridge();
    error NotL2Token();
    error TokenTransferFailed();
}
