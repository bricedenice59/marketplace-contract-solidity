const config = require("dotenv").config();
const dotenvExpand = require("dotenv-expand");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");

dotenvExpand.expand(config);

const DEPLOYER_ACCOUNT = process.env.CONTRACT_DEPLOYER_PRIVATE_KEY;
const COURSE_OWNER_ACCOUNT = process.env.USER1_PRIVATE_KEY;
const BUYER_ACCOUNT = process.env.USER2_PRIVATE_KEY;
const NEWCONTRACT_OWNER_ACCOUNT = process.env.USER3_PRIVATE_KEY;

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL;
const REPORT_GAS = process.env.REPORT_GAS;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

module.exports = {
    solidity: "0.8.14",
    settings: {
        optimizer: {
            enabled: true,
            runs: 1000,
        },
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [
                DEPLOYER_ACCOUNT,
                COURSE_OWNER_ACCOUNT,
                BUYER_ACCOUNT,
                NEWCONTRACT_OWNER_ACCOUNT,
            ],
            chainId: 4,
            blockConfirmationsForTransactions: 2,
            blockConfirmationsForContractVerification: 6,
            gas: "auto",
            gasPrice: "auto",
            gasMultiplier: 2,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [
                DEPLOYER_ACCOUNT,
                COURSE_OWNER_ACCOUNT,
                BUYER_ACCOUNT,
                NEWCONTRACT_OWNER_ACCOUNT,
            ],
            chainId: 5,
            blockConfirmationsForTransactions: 2,
            blockConfirmationsForContractVerification: 6,
            gas: "auto",
            gasPrice: "auto",
            gasMultiplier: 2,
        },
    },
    gasReporter: {
        enabled: REPORT_GAS,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "BNB",
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        courseAuthor: {
            default: 1,
        },
        buyer: {
            default: 2,
        },
        newContractOwner: {
            default: 3,
        },
    },
    mocha: {
        timeout: 600000,
    },
};
