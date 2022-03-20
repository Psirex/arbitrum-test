//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {IERC20} from "./interfaces/IERC20.sol";
import {IInbox} from "./interfaces/arbitrum/IInbox.sol";
import {IBridge} from "./interfaces/arbitrum/IBridge.sol";
import {IOutbox} from "./interfaces/arbitrum/IOutbox.sol";
import {IArbSys} from "./interfaces/arbitrum/IArbSys.sol";

interface IMintableERC20 {
    function mint(address recipient, uint256 amount) external;

    function burn(address account, uint256 amount) external;
}

interface IL1TokensGateway {
    function releaseTokens(address account, uint256 amount) external;
}

library AddressAliasHelper {
    uint160 constant offset =
        uint160(0x1111000000000000000000000000000000001111);

    /// @notice Utility function that converts the address in the L1 that submitted a tx to
    /// the inbox to the msg.sender viewed in the L2
    /// @param l1Address the address in the L1 that triggered the tx to L2
    /// @return l2Address L2 address as viewed in msg.sender
    function applyL1ToL2Alias(address l1Address)
        internal
        pure
        returns (address l2Address)
    {
        l2Address = address(uint160(l1Address) + offset);
    }

    /// @notice Utility function that converts the msg.sender viewed in the L2 to the
    /// address in the L1 that submitted a tx to the inbox
    /// @param l2Address L2 address as viewed in msg.sender
    /// @return l1Address the address in the L1 that triggered the tx to L2
    function undoL1ToL2Alias(address l2Address)
        internal
        pure
        returns (address l1Address)
    {
        l1Address = address(uint160(l2Address) - offset);
    }
}

contract L2TokensGateway {
    IArbSys constant arbsys = IArbSys(address(100));
    address public l1TokensGateway;
    IMintableERC20 public immutable L2TOKEN;

    constructor(address l2Token) {
        L2TOKEN = IMintableERC20(l2Token);
    }

    function setL1TokensGateway(address l1TokensGateway_) external {
        if (l1TokensGateway != address(0)) {
            revert AlreadyInitialized();
        }
        l1TokensGateway = l1TokensGateway_;
    }

    function sendToL1(uint256 amount) external returns (uint256) {
        L2TOKEN.burn(msg.sender, amount);

        bytes memory data = abi.encodeWithSelector(
            IL1TokensGateway.releaseTokens.selector,
            msg.sender,
            amount
        );

        uint256 withdrawalId = arbsys.sendTxToL1(l1TokensGateway, data);
        emit TokensSent(withdrawalId);
        return withdrawalId;
    }

    /// @dev only L1TokensGateway can call this method
    function mintTokens(address recipient, uint256 amount) external {
        address expectedSender = AddressAliasHelper.applyL1ToL2Alias(
            l1TokensGateway
        );
        if (msg.sender != expectedSender) {
            revert NotL1TokensGateway();
        }
        L2TOKEN.mint(recipient, amount);
    }

    error NotL1TokensGateway();
    error AlreadyInitialized();

    event TokensSent(uint256 indexed withdrawalId);
}
