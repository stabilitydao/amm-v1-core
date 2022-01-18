module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const react = await deployments.get("ReactToken")

  await deploy("XStakeBar", {
    from: deployer,
    args: [react.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["XStakeBar"]
module.exports.dependencies = ["Factory", "Router", "ReactToken"]
