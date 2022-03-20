// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {IArbToken} from "./interfaces/IArbToken.sol";
import {DummyERC20Token} from "./DummyERC20Token.sol";

interface IERC20 {
    function decimals() external view returns (uint8);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);
}

contract CustomL2Token is IArbToken, DummyERC20Token {
    address public immutable override l1Address;
    address public immutable l2Gateway;

    constructor(
        address l2Gateway_,
        IERC20 l1TokenAddress_,
        string memory name,
        string memory symbol,
        uint8 decimals
    ) DummyERC20Token(name, symbol, decimals, 0) {
        l2Gateway = l2Gateway_;
        l1Address = address(l1TokenAddress_);
    }

    function bridgeMint(address account_, uint256 amount_)
        external
        override
        onlyL2Gateway
    {
        _mint(account_, amount_);
    }

    function bridgeBurn(address account_, uint256 amount_)
        external
        override
        onlyL2Gateway
    {
        _burn(account_, amount_);
    }

    modifier onlyL2Gateway() {
        require(msg.sender == l2Gateway, "NG");
        _;
    }
}
