require("dotenv").config();
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

const CONTRACT_REWARD_PERCENTAGE = 10;
const MULTISIG_CONTRACT_ADDRESS = "0x952694E44E5d5c17C0A89e98A20A48c57092e6F4";

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    const args = [CONTRACT_REWARD_PERCENTAGE, MULTISIG_CONTRACT_ADDRESS];

    var deploymentResult = await deploy("Marketplace", {
        from: deployer,
        gasLimit: network.config.gasLimit,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmationsForContractVerification || 1,
    });

    console.log(deploymentResult.address);

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
