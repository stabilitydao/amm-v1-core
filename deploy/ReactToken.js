const {ethers, upgrades} = require('hardhat')

module.exports = async function ({ /*getNamedAccounts, */deployments}) {
    const { /*deploy, */save, get} = deployments

    try {
        const deplpoyment = await get('ReactToken')
        console.log(
            `ReactToken already deployed to ${hre.network.name} at ${deplpoyment.address}`
        )
        return
    } catch (e) {
        // not deployed yet
    }

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
        `ReactToken proxy deployed at: ${react.address} (block: ${
            receipt.blockNumber
        }) with ${receipt.gasUsed.toNumber()} gas`
    )
}

module.exports.tags = ["ReactToken"]
