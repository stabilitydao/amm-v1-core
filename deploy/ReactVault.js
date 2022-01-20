module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const react = await ethers.getContract("ReactToken")
  const syrup = await ethers.getContract("ReactSyrup")
  const farm = await ethers.getContract("ReactFarm")

  const { address } = await deploy("ReactVault", {
    from: deployer,
    args: [react.address, syrup.address, farm.address, dev, dev],
    log: true,
    deterministicDeployment: false
  })

  const reactVauilt = await ethers.getContract("ReactVault")
  if (await reactVauilt.owner() !== dev) {
    // Transfer ownership of ReactVault to dev
    console.log("Transfer ownership of ReactVault to dev")
    await (await reactVauilt.transferOwnership(dev)).wait()
  }
}

module.exports.tags = ["ReactVault"]
module.exports.dependencies = ["ReactFarm", "ReactToken", "ReactSyrup"]
