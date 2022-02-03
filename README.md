# ReactSwap V0

https://reactswap.com/

Changes from SushiSwap contracts:
* ReactToken (REACT <= SUSHI)
  * Role based access control
  * Flash minting
  * Upgradeable (UUPS-proxy)
* X-Stake Bar (xREACT <= XSUSHI)
  * ERC20Votes, ERC20Permit
* ReactFarm (was MasterChef)
  * `poolInfo[0]` - staking pool
  * `function updateStakingPool(uint256 divider) public onlyOwner`
  * `function updateBonusMultiplier(uint256 k) public onlyOwner`
* added PancakeSwap based contracts
  * ReactSyrup (SyrupBar)
    * ERC20Votes, ERC20Permit 
  * ReactVault (CakeVault)
  * PoolFactory (SmartChefFactory)
  * ReactPool (SmartChefInitializable)
  * ReactProfile (PancakeProfile)
* Stack upgrade 
  * Solidity 0.8
  * OpenZeppelin 4.4

## Deployments

AMM pair init code hash `cb54e91f48528688ead76d80df1d5639f715890a9d260928f22572e311dcfc26`

### Ropsten testnet

| Contract          | Address                                    |
|-------------------|--------------------------------------------|
| ReactToken        | 0x2280EC541a667bC94F86ca18e6F7179D56b058A6 |
| ReactSwapFactory  | 0xff6dca94678a420190aAee00485c5F2d1B6bae7e |
| Router  | 0xE30184E3957E6f02d2C57ee4AFBe9A789222E586 |
| Roll  | 0xa17787D5B5D5720048a808B6DE30272257E9d2F7 |
| ReactSyrup  | 0x74ce4292557bC5e7a86749F84117EAe8706C3D85 |
| ReactFarm  | 0x3EC9060E52b9B435Db7fDeC55CA33B8bcBaF2D2b |
| ReactProfile  | 0xe10Ec5809683239F00916Cc5770a98817dE8Be0E |
| ReactVault  | 0xD27fee7E1174f50fb63fb325af0475576ef8bD24 |
| PoolFactory  | 0xaf19a89ff976f2ee54571dfcb43c478e4007fb87 |
| XStakeBar  | 0x02208063DD630C4aeAFf090e31F60785790A7328 |
| XBarman  | 0xD6311dFa6859D9C5D63a281Ba3b2dFC45768Dccb |
