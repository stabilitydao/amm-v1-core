// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../amm/Pair.sol";

contract ReactSwapPairMock is Pair {
    constructor() Pair() {}
}
