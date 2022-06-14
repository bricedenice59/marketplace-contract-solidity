const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const path = require('path');
const compileUtil = require("./compile");
const Web3 = require("web3");

const baseContractName = "Marketplace";
var baseContractSolidityFile = path.resolve("contracts", "MarketplaceContract.sol");
var baseContractFileName = path.basename(baseContractSolidityFile)

//compile contract and its dependencies
var contract = compileUtil.compileContracts(baseContractSolidityFile);

var myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

var web3 = null;
try {
    web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.INFURA_WS_NETWORK));
    console.log("Connection Successfull!");
}
catch (e) {
    console.log("Connection Error!", e);
}

// Deploy contract
const deploy = async (contract) => {
    web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
    const account = web3.eth.accounts.wallet[0].address;
    console.log('Attempting to deploy from account:', account);

    const incrementer = new web3.eth.Contract(contract.abi);
    const incrementerTx = incrementer.deploy({ data: "0x" + contract.evm.bytecode.object });

    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: account,
            data: incrementerTx.encodeABI(),
            gas: 3000000,
        },
        process.env.PRIVATE_KEY
    );
    console.log('Sending transaction... please wait.');
    const createReceipt = await web3.eth.sendSignedTransaction(
        createTransaction.rawTransaction
    );
    console.log('Contract deployed at address', createReceipt.contractAddress);
    return createReceipt.contractAddress;
};

if (web3) {
    try {
        (async () => {
            await deploy(contract.contracts[baseContractFileName][baseContractName]);
        })();
    }
    catch (e) {
        console.log("contract could not be loaded!", e);
    }
}

