// SPDX-License-Identifier: MIT

pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReactSyrup is ERC20, Ownable {
    using SafeMath for uint256;

    // The REACT TOKEN!
    IERC20 public react;

    constructor(
        IERC20 _react
    ) ERC20("React Syrup", "rSYRUP") {
        react = _react;
    }

    /// @notice Creates `_amount` token to `_to`. Must only be called by the owner (ReactMaster).
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    function burn(address _from ,uint256 _amount) public onlyOwner {
        _burn(_from, _amount);
    }

    // Safe react transfer function, just in case if rounding error causes pool to not have enough REACTs.
    function safeReactTransfer(address _to, uint256 _amount) public onlyOwner {
        uint256 reactBal = react.balanceOf(address(this));
        if (_amount > reactBal) {
            react.transfer(_to, reactBal);
        } else {
            react.transfer(_to, _amount);
        }
    }
}