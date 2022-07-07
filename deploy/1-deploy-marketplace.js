require("dotenv").config();
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    const args = [];

    var deploymentResult = await deploy("Marketplace", {
        from: deployer,
        gasLimit: 4000000,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    //only verifies on testnets
    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        log("Verifing contract on Etherscan!");
        log("----------------------");
        await verify(deploymentResult.address, args);
        log("--------Verify Done--------------");
    }

    log("Marketplace deployed!");
    log("----------------------");
};
