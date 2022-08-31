require("dotenv").config();
const fs = require("fs");
const { network } = require("hardhat");
const { verify } = require("../../marketplace/utils/verify");
const {
    addresses,
    ROOT_CONTRACTS_JSON,
} = require("../../marketplace/contracts_constants/index.js");
const CONTRACT_REWARD_PERCENTAGE = 10;

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    const contractAddressesJsonFile = addresses();
    const fsRead = fs.readFileSync(contractAddressesJsonFile, "utf-8");
    const contractAddresses = JSON.parse(fsRead);
    const multiSigContract = contractAddresses[ROOT_CONTRACTS_JSON].find(
        (x) => x.contractname === "MultiSig" && x.chainId === chainId.toString()
    );
    if (!multiSigContract)
        throw new Error("Contract address for the multisig wallet could not be found");

    const args = [CONTRACT_REWARD_PERCENTAGE, multiSigContract.contractAddress];

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
