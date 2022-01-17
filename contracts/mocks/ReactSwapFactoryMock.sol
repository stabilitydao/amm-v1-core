// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../uniswapv2/UniswapV2Factory.sol";

contract ReactSwapFactoryMock is UniswapV2Factory {
    constructor(address _feeToSetter) UniswapV2Factory(_feeToSetter) {}
}
