module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, get } = deployments;

  try {
    const deployment = await get('XStakeBar')
    console.log(
        `XStakeBar already deployed to ${hre.network.name} at ${deployment.address}`
    )
    return
  } catch (e) {
    // not deployed yet
  }

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
module.exports.dependencies = ["ReactSwapFactory", "ReactToken"]
