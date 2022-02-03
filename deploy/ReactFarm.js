module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy, get } = deployments;

  try {
    const deployment = await get('ReactFarm')
    console.log(
        `ReactFarm already deployed to ${hre.network.name} at ${deployment.address}`
    )
    return
  } catch (e) {
    // not deployed yet
  }

  const { deployer, dev } = await getNamedAccounts()

  const react = await ethers.getContract("ReactToken")
  const syrup = await ethers.getContract("ReactSyrup")

  let startBlock = "0"
  let bonusEndBlock = "100000000"
  let reactPerBlock = "1000000000000000000"

  const { address } = await deploy("ReactFarm", {
    from: deployer,
    args: [react.address, syrup.address, dev, reactPerBlock, startBlock, bonusEndBlock],
    log: true,
    deterministicDeployment: false
  })

  const MINTER_ROLE = ethers.utils.id('MINTER_ROLE')
  let tx = await react.grantRole(MINTER_ROLE, address)
  process.stdout.write(
      `Grant ReactToken MINTER_ROLE to ReactFarm (tx: ${tx.hash})...: `
  )

  let receipt = await tx.wait()
  if (receipt.status) {
    console.log(
        `done (block: ${
            receipt.blockNumber
        }) with ${receipt.gasUsed.toNumber()} gas`
    )
  } else {
    console.log(`REVERTED!`)
  }

  const reactMaster = await ethers.getContract("ReactFarm")
  if (await reactMaster.owner() !== dev) {
    // Transfer ownership of ReactFarm to dev
    console.log("Transfer ownership of ReactFarm to dev")
    await (await reactMaster.transferOwnership(dev)).wait()
  }
}

module.exports.tags = ["ReactFarm"]
module.exports.dependencies = ["ReactToken", "ReactSyrup"]
