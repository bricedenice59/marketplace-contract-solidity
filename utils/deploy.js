const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const path = require('path');
const compileUtil = require("./compile");
const Web3 = require("web3");
const keccak256 = require('keccak256');
const CoursesFetcher = require('../content/courses/fetcher');

const baseContractName = "Marketplace";
const defaultGas = 5000000; // Rinkeby has a lower block limit than mainnet
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
    const gas = await web3.eth.getGasPrice();
    console.log('Attempting to deploy from account:', web3Account);

    const incrementer = new web3.eth.Contract(contract.abi);
    const incrementerTx = incrementer.deploy({ data: "0x" + contract.evm.bytecode.object });

    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: web3Account,
            data: incrementerTx.encodeABI(),
            gasPrice: gas,
            gas: defaultGas
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
    const gas = await web3.eth.getGasPrice();
    const method = deployedContract.methods.addCourse(course.id, course.title, course.price, course.courseOwner);
    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: web3Account,
            to: deployedContract._address,
            data: method.encodeABI(),
            gasPrice: gas,
            gas: defaultGas
        },
        process.env.PRIVATE_KEY
    );
    console.log('Sending transaction... please wait.');
    // Send Tx and Wait for Receipt
    const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    return createReceipt;
};

const activateCourse = async (deployedContract, course, shouldActivate = true) => {
    const gas = await web3.eth.getGasPrice();
    var method = shouldActivate ? deployedContract.methods.activateCourse(course.id) :
        deployedContract.methods.deactivateCourse(course.id);

    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: web3Account,
            to: deployedContract._address,
            data: method.encodeABI(),
            gasPrice: gas,
            gas: defaultGas
        },
        process.env.PRIVATE_KEY
    );
    console.log('Sending transaction... please wait.');
    // Send Tx and Wait for Receipt
    const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    return createReceipt;
};

const getCoursePrice = async (deployedContract, idCourse) => {
    var res = await deployedContract.methods.getCoursePrice(idCourse)
        .call({ from: web3Account }, function (err, result) {
            if (err) {
                console.log(`An error occured when trying to get course price for ${idCourse}`, err)
                return;
            }
            return result;
        });

    return res;
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
                    course.id = "0x" + keccak256(course.id).toString('hex');
                    try {
                        //add a course to the blockchain
                        console.log(`Add course to contract: ${course.id} : ${course.title}`);
                        var result = await addCourseToContract(deployedContract, course);
                        console.log(`Course successfully added with tx hash: ${result.transactionHash}`);

                        //activate a course
                        console.log(`Activate course: ${course.id} : ${course.title}`);
                        var result = await activateCourse(deployedContract, course, false);
                        console.log(`Course successfully activated with tx hash: ${result.transactionHash}`);
                    }
                    catch (e) {
                        if (e.reason)
                            console.log(e.reason);
                        else
                            console.log(e.message);
                    }
                }
            }
        })();
    }
    catch (e) {
        console.log("contract could not be loaded!", e);
    }
}

