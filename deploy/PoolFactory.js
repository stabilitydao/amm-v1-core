module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, get } = deployments;

  try {
    const deployment = await get('PoolFactory')
    console.log(
        `PoolFactory already deployed to ${hre.network.name} at ${deployment.address}`
    )
    return
  } catch (e) {
    // not deployed yet
  }

  const { deployer } = await getNamedAccounts()

  await deploy("PoolFactory", {
    from: deployer,
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["PoolFactory"]
