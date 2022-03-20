// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {IBridge} from "./IBridge.sol";

interface IInbox {
    function createRetryableTicket(
        address destAddr,
        uint256 arbTxCallValue,
        uint256 maxSubmissionCost,
        address submissionRefundAddress,
        address valueRefundAddress,
        uint256 maxGas,
        uint256 gasPriceBid,
        bytes calldata data
    ) external payable returns (uint256);

    function bridge() external view returns (IBridge);
}
