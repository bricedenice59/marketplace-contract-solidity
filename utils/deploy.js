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

const getKeccak256HexValueFromInput = (value) => {
    return "0x" + keccak256(value).toString('hex');
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

const addCourseOwnerToContract = async (deployedContract, user) => {
    const gas = await web3.eth.getGasPrice();
    const method = deployedContract.methods.addCourseOwner(user.id, user.address, user.rewardPercentage);
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

let web3Account = null;
if (web3) {
    web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
    web3Account = web3.eth.accounts.wallet[0].address;

    try {
        (async () => {
            var contract_deployedTx = await deploy(contract.contracts[baseContractFileName][baseContractName]);
            if (contract_deployedTx) {
                const deployedContract = new web3.eth.Contract(contract.contracts[baseContractFileName][baseContractName].abi, contract_deployedTx);

                const allCoursesOwners = CoursesFetcher.getAllCoursesOwnersForContractUse().data;
                for (let index = 0; index < allCoursesOwners.length; index++) {
                    const owner = allCoursesOwners[index];
                    console.log(`Add course owner :${owner.address}`);
                    var createCourseOwnerResult = await addCourseOwnerToContract(deployedContract, owner);
                    console.log(`Course owner successfully added with tx hash: ${createCourseOwnerResult.transactionHash}`);
                }

                const allCourses = CoursesFetcher.getAllParsedCoursesForContractUse().data;
                for (let index = 0; index < allCourses.length; index++) {
                    const course = allCourses[index];
                    course.id = getKeccak256HexValueFromInput(course.id);
                    try {
                        //add a course to the blockchain
                        console.log(`Add course : ${course.id} : ${course.title}`);
                        var result = await addCourseToContract(deployedContract, course);
                        console.log(`Course successfully added with tx hash: ${result.transactionHash}`);

                        //activate a course
                        console.log(`Activate course: ${course.id} : ${course.title}`);
                        var result = await activateCourse(deployedContract, course);
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

