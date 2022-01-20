// SPDX-License-Identifier: MIT

pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ReactSyrup is ERC20, Ownable, ERC20Permit, ERC20Votes {
    using SafeMath for uint256;

    IERC20 public react;

    constructor(
        IERC20 _react
    ) ERC20("React Syrup", "rSYRUP") ERC20Permit("React Syrup") {
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

    // The following functions are overrides required by Solidity.

    function _afterTokenTransfer(address from, address to, uint256 amount)
    internal
    override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
    internal
    override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
    internal
    override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}