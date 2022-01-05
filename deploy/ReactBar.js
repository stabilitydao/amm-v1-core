module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const react = await deployments.get("ReactToken")

  await deploy("ReactBar", {
    from: deployer,
    args: [react.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["ReactBar"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "ReactToken"]
