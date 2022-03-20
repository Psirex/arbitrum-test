// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface ICustomGateway {
    function registerTokenToL2(
        address _l2Address,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost,
        address creditBackAddress
    ) external payable returns (uint256);
}
