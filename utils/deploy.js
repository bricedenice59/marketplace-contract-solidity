const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const CoursesFetcher = require('../content/courses/fetcher');
const web3Utils = require('./web3Utils');
const path = require('path');

var myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

var web3 = null;
var account = null;
try {
    web3 = web3Utils.Create();
    console.log("Connection Successfull!");

    web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
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
    console.log('Contract deployed at address', createReceipt.contractAddress);
    return createReceipt.contractAddress;
};

const addCourseOwnerToContract = async (deployedContract, user) => {
    const gas = await web3.eth.getGasPrice();
    const method = deployedContract.methods.addCourseOwner(user.id, user.address, user.rewardPercentage);
    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: account.address,
            to: deployedContract._address,
            data: method.encodeABI(),
            gasPrice: gas,
            gas: web3Utils.defaultGas
        },
        account.privateKey
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
            from: account.address,
            to: deployedContract._address,
            data: method.encodeABI(),
            gasPrice: gas,
            gas: web3Utils.defaultGas
        },
        account.privateKey
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
            from: account.address,
            to: deployedContract._address,
            data: method.encodeABI(),
            gasPrice: gas,
            gas: web3Utils.defaultGas
        },
        account.privateKey
    );
    console.log('Sending transaction... please wait.');
    // Send Tx and Wait for Receipt
    const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    return createReceipt;
};

if (web3) {
    try {
        (async () => {
            var contract_deployedTx = await deploy(web3Utils.getContractToDeploy());
            if (contract_deployedTx) {
                const deployedContract = web3Utils.getDeployedContract(web3, contract_deployedTx);

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
                    course.id = web3Utils.getKeccak256HexValueFromInput(course.id);
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

