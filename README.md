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
* Stack upgrade 
  * Solidity 0.8
  * OpenZeppelin 4.4

## Deployments

AMM pair init code hash `edeccb88a4d2c30e6406944e3b3b22b0806f5aca2fa7edfd90e916bb34c10d43`

### Ropsten testnet

| Contract          | Address                                    |
|-------------------|--------------------------------------------|
| ReactToken        | 0x2280EC541a667bC94F86ca18e6F7179D56b058A6 |
| ReactSwapFactory  | 0xff6dca94678a420190aAee00485c5F2d1B6bae7e |
| Router  | 0x07A7d038EB2DC9aCCeeFBDf28cBef21Df68b1616 |
| Roll  | 0xD46a4Ea343d8aDe7503E1b95772c0365fE97e403 |
| XStakeBar  | 0x43A6d1ba67264be41628D4ca6a493946ad11A246 |
| XBarman  | 0xe2d76aF9338a2b129b9aD28e1E1265E98DED6722 |
| ReactSyrup  | 0x5b1295Cf4f69FDA49A830Bc6D467b58c97535893 |
| ReactFarm  | 0x04A19E4e546A6606E28419cf21B98dD724fbF8Ea |
| ReactVault  | 0x1cE263b6cc448E7c356f29a253602a5E0395FcBd |
| PoolFactory  | 0xaf19a89ff976f2ee54571dfcb43c478e4007fb87 |
