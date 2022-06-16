const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const path = require('path');
const compileUtil = require("./compile");
const Web3 = require("web3");
const keccak256 = require('keccak256');
const CoursesFetcher = require('../content/courses/fetcher');

const baseContractName = "Marketplace";
var baseContractSolidityFile = path.resolve("contracts", "MarketplaceContract.sol");
var baseContractFileName = path.basename(baseContractSolidityFile);

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
    console.log('Attempting to deploy from account:', web3Account);

    const incrementer = new web3.eth.Contract(contract.abi);
    const incrementerTx = incrementer.deploy({ data: "0x" + contract.evm.bytecode.object });

    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: web3Account,
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

const addCourseToContract = async (deployedContract, course) => {
    const contractAddress = deployedContract._address;
    const idKeccac256 = "0x" + keccak256(course.id).toString('hex');
    const method = deployedContract.methods.addCourse(idKeccac256, course.title, course.price, course.courseOwner);

    // Sign Tx with PK
    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: web3Account,
            to: contractAddress,
            data: method.encodeABI(),
            gas: 3000000,
        },
        process.env.PRIVATE_KEY
    );
    console.log('Sending transaction... please wait.');
    // Send Tx and Wait for Receipt
    const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    console.log(`Tx successful with hash: ${createReceipt.transactionHash}`);
    return createReceipt.transactionHashl
};

let web3Account = null;
if (web3) {
    web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
    web3Account = web3.eth.accounts.wallet[0].address;

    try {
        (async () => {
            var contract_deployedTx = await deploy(contract.contracts[baseContractFileName][baseContractName]);
            if (contract_deployedTx) {
                const deployedContract = new web3.eth.Contract(contract.contracts[baseContractFileName][baseContractName].abi, contract_deployedTx);

                const allCourses = CoursesFetcher.getAllParsedCoursesForContractUse().data;
                for (let index = 0; index < allCourses.length; index++) {
                    const course = allCourses[index];
                    //add a course to the blockchain
                    await addCourseToContract(deployedContract, course);
                }
            }
        })();
    }
    catch (e) {
        console.log("contract could not be loaded!", e);
    }
}

