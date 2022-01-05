 module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  await deploy("ReactToken", {
    from: deployer,
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["ReactToken"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
