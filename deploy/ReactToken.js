const { ethers, upgrades } = require('hardhat')

 module.exports = async function ({ /*getNamedAccounts, */deployments }) {
  const { /*deploy, */save/*, get*/ } = deployments

  // const { deployer } = await getNamedAccounts()

   const ReactToken = await ethers.getContractFactory('ReactToken')
   const react = await upgrades.deployProxy(ReactToken, {
     kind: 'uups',
   })

   await react.deployed()

   const artifact = await hre.artifacts.readArtifact('ReactToken')

   await save('ReactToken', {
     address: react.address,
     abi: artifact.abi,
   })

   let receipt = await react.deployTransaction.wait()
   console.log(
       `ReactToken proxy deployed at: ${receipt.address} (block: ${
           receipt.blockNumber
       }) with ${receipt.gasUsed.toNumber()} gas`
   )

/*  await deploy("ReactToken", {
    from: deployer,
    log: true,
    deterministicDeployment: false
  })*/
}

module.exports.tags = ["ReactToken"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
