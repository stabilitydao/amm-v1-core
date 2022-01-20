// SPDX-License-Identifier: MIT

pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// X-Stake Bar is the coolest bar in town. You come in with some React, and leave with more! The longer you stay, the more React you get.
//
// This contract handles swapping to and from xReact, ReactSwap's staking token.
contract XStakeBar is ERC20, ERC20Permit, ERC20Votes {
    using SafeMath for uint256;

    IERC20 public react;

    // Define the React token contract
    constructor(
        IERC20 _react
    ) ERC20("X-Stake Bar", "xREACT") ERC20Permit("X-Stake Bar")  {
        react = _react;
    }

    // Enter the bar. Pay some REACTs. Earn some shares.
    // Locks React and mints xReact
    function enter(uint256 _amount) public {
        // Gets the amount of React locked in the contract
        uint256 totalReact = react.balanceOf(address(this));
        // Gets the amount of xReact in existence
        uint256 totalShares = totalSupply();
        // If no xReact exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalReact == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xReact the React is worth. The ratio will change overtime, as xReact is burned/minted and React deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalReact);
            _mint(msg.sender, what);
        }
        // Lock the React in the contract
        react.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your REACTs.
    // Unlocks the staked + gained React and burns xReact
    function leave(uint256 _share) public {
        // Gets the amount of xReact in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of React the xReact is worth
        uint256 what = _share.mul(react.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        react.transfer(msg.sender, what);
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
