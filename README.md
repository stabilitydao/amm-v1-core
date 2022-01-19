# ReactSwap V0

https://reactswap.com/

Changes from SushiSwap contracts:
* ReactToken (REACT <= SUSHI)
  * Role based access control
  * Flash minting
  * Upgradeable (UUPS-proxy)
* ReactMaster (was MasterChef)
  * `poolInfo[0]` - staking pool (from PancakeSwap's MasterChef)
  * `function updateStakingPool(uint256 divider) public onlyOwner`
  * `function updateBonusMultiplier(uint256 k) public onlyOwner`
* ReactSyrup (rSYRUP <= SYRUP in PancakeSwap)
* Stack upgrade 
  * Solidity 0.8
  * OpenZeppelin 4.4
