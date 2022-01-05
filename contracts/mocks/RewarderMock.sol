// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
import "../interfaces/IRewarder.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringMath.sol";


contract RewarderMock is IRewarder {
    using BoringMath for uint256;
    using BoringERC20 for IERC20;
    uint256 private immutable rewardMultiplier;
    IERC20 private immutable rewardToken;
    uint256 private constant REWARD_TOKEN_DIVISOR = 1e18;
    address private immutable REACTMASTER_V2;

    constructor (uint256 _rewardMultiplier, IERC20 _rewardToken, address _REACTMASTER_V2) public {
        rewardMultiplier = _rewardMultiplier;
        rewardToken = _rewardToken;
        REACTMASTER_V2 = _REACTMASTER_V2;
    }

    function onReactReward (uint256, address user, address to, uint256 reactAmount, uint256) onlyRMV2 override external {
        uint256 pendingReward = reactAmount.mul(rewardMultiplier) / REWARD_TOKEN_DIVISOR;
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        if (pendingReward > rewardBal) {
            rewardToken.safeTransfer(to, rewardBal);
        } else {
            rewardToken.safeTransfer(to, pendingReward);
        }
    }
    
    function pendingTokens(uint256 pid, address user, uint256 reactAmount) override external view returns (IERC20[] memory rewardTokens, uint256[] memory rewardAmounts) {
        IERC20[] memory _rewardTokens = new IERC20[](1);
        _rewardTokens[0] = (rewardToken);
        uint256[] memory _rewardAmounts = new uint256[](1);
        _rewardAmounts[0] = reactAmount.mul(rewardMultiplier) / REWARD_TOKEN_DIVISOR;
        return (_rewardTokens, _rewardAmounts);
    }

    modifier onlyRMV2 {
        require(
            msg.sender == REACTMASTER_V2,
            "Only RMV2 can call this function."
        );
        _;
    }
  
}
