// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../amm-v1/Pair.sol";

contract ReactSwapPairMock is Pair {
    constructor() Pair() {}
}
