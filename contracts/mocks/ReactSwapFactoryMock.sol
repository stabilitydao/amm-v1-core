// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../amm-v1/ReactSwapFactory.sol";

contract ReactSwapFactoryMock is ReactSwapFactory {
    constructor(address _feeToSetter) ReactSwapFactory(_feeToSetter) {}
}
