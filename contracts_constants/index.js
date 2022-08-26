const marketPlaceContractAddresses = require("./addresses.json");
const marketPlaceContractAbi = require("./abi.json");
const multiSigWalletContractAbi = require("./multiSig-wallet-abi.json");

const multiSigWalletAddress = process.env.NEXT_PUBLIC_MULTISIG_CONTRACT_ADDRESS;
module.exports = {
    marketPlaceContractAddresses,
    multiSigWalletAddress,
    marketPlaceContractAbi,
    multiSigWalletContractAbi,
};
