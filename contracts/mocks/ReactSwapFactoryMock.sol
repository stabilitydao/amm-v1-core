// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../amm/Factory.sol";

contract ReactSwapFactoryMock is Factory {
    constructor(address _feeToSetter) Factory(_feeToSetter) {}
}
