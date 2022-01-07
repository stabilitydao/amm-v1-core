const { WETH } = require("@sushiswap/sdk")


/*const REACT = {
  [ChainId.MATIC]: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a'
}*/

module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const chainId = await getChainId()

  let reactAddress;

  // if (chainId === '31337') {
    reactAddress = (await deployments.get("ReactToken")).address
  // } else if (chainId in REACT) {
  //   reactAddress = REACT[chainId]
  // } else {
  //   throw Error("No REACT!")
  // }

  await deploy("ReactMiniMasterV2", {
    from: deployer,
    args: [reactAddress],
    log: true,
    deterministicDeployment: false
  })

  const reactMiniMasterV2 = await ethers.getContract("ReactMiniMasterV2")
  if (await reactMiniMasterV2.owner() !== dev) {
    console.log("Transfer ownership of ReactMiniMasterV2 to dev")
    await (await reactMiniMasterV2.transferOwnership(dev, true, false)).wait()
  }
}

module.exports.tags = ["ReactMiniMasterV2"]
// module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
module.exports.dependencies = ["ReactToken"]
