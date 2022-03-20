// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IArbitrumEnabledToken {
    /// @notice should return `0xa4b1` if token is enabled for arbitrum gateways
    function isArbitrumEnabled() external view returns (uint8);
}
