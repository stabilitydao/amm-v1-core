// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../uniswapv2/UniswapV2Pair.sol";

contract ReactSwapPairMock is UniswapV2Pair {
    constructor() UniswapV2Pair() {}
}
