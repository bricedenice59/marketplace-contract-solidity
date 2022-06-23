const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const web3Utils = require('../utils/web3Utils');

var myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

var web3 = null;
var account = null;
try {
    web3 = web3Utils.Create();
    console.log("Connection Successfull!");

    web3.eth.accounts.wallet.add(process.env.CONTRACT_DEPLOYER_PRIVATE_KEY);
    account = web3.eth.accounts.wallet[0];
}
catch (e) {
    console.log("Connection Error!", e);
}

// Deploy contract
const deploy = async (contract) => {
    const gas = await web3.eth.getGasPrice();
    console.log('Attempting to deploy from account:', account.address);

    const incrementer = new web3.eth.Contract(contract.abi);
    const incrementerTx = incrementer.deploy({ data: "0x" + contract.evm.bytecode.object });

    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: account.address,
            data: incrementerTx.encodeABI(),
            gasPrice: gas,
            gas: web3Utils.defaultGas
        },
        account.privateKey
    );
    console.log('Sending transaction... please wait.');
    const createReceipt = await web3.eth.sendSignedTransaction(
        createTransaction.rawTransaction
    );

    return createReceipt.contractAddress;
};

if (web3) {
    try {
        (async () => {
            try {
                var contract_deployedTx = await deploy(web3Utils.getContractToDeploy());
                console.log('Contract deployed at address', contract_deployedTx);
            }
            catch (e) {
                if (e.reason)
                    console.log(e.reason);
                else
                    console.log(e.message);
            }
        })();
    }
    catch (e) {
        console.log("contract could not be loaded!", e);
    }
}

