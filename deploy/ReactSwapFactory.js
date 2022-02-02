module.exports = async function ({
  ethers,
  getNamedAccounts,
  deployments,
  getChainId,
}) {
  const { deploy, get } = deployments;

  try {
    const deployment = await get('ReactSwapFactory')
    console.log(
        `ReactSwapFactory already deployed to ${hre.network.name} at ${deployment.address}`
    )
    return
  } catch (e) {
    // not deployed yet
  }

  const { deployer, dev } = await getNamedAccounts();

  await deploy("ReactSwapFactory", {
/*    contract: {
      abi,
      bytecode,
    },*/
    from: deployer,
    args: [dev],
    log: true,
    deterministicDeployment: false,
  });
};

module.exports.tags = ["ReactSwapFactory", "AMM"];
