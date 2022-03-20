// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {IGatewayRouter} from "./interfaces/arbitrum/IGatewayRouter.sol";
import {ICustomGateway} from "./interfaces/arbitrum/ICustomGateway.sol";
import {IArbitrumEnabledToken} from "./interfaces/IArbitrumEnabledToken.sol";
import {DummyERC20Token} from "./DummyERC20Token.sol";

contract CustomL1Token is DummyERC20Token, IArbitrumEnabledToken {
    address private immutable BRIDGE;
    address private immutable ROUTER;
    bool private shouldRegisterGateway;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply_,
        address bridge,
        address router
    ) DummyERC20Token(name_, symbol_, decimals_, initialSupply_) {
        BRIDGE = bridge;
        ROUTER = router;
    }

    /// @dev we only set shouldRegisterGateway to true when in `registerTokenOnL2`
    function isArbitrumEnabled() external view override returns (uint8 res) {
        require(shouldRegisterGateway, "NA");
        return 177; // it's thre result of uint8(0xa4b1) in prev versions of Solidity
    }

    function registerTokenOnL2(
        address l2CustomTokenAddress,
        uint256 maxSubmissionCostForCustomBridge,
        uint256 maxSubmissionCostForRouter,
        uint256 maxGasForCustomBridge,
        uint256 maxGasForRouter,
        uint256 gasPriceBid,
        uint256 valueForGateway,
        uint256 valueForRouter,
        address creditBackAddress
    ) public payable {
        // we temporarily set `shouldRegisterGateway` to true for the callback in registerTokenToL2 to succeed
        bool prev = shouldRegisterGateway;
        shouldRegisterGateway = true;

        ICustomGateway(BRIDGE).registerTokenToL2{value: valueForGateway}(
            l2CustomTokenAddress,
            maxGasForCustomBridge,
            gasPriceBid,
            maxSubmissionCostForCustomBridge,
            creditBackAddress
        );

        IGatewayRouter(ROUTER).setGateway{value: valueForRouter}(
            BRIDGE,
            maxGasForRouter,
            gasPriceBid,
            maxSubmissionCostForRouter,
            creditBackAddress
        );

        shouldRegisterGateway = prev;
    }
}
