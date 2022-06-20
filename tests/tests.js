const GetETHExchangeRate = require('../utils/EthExchangeRate');
const web3Utils = require('../utils/web3Utils');
const Web3 = require("web3");
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const CoursesFetcher = require('../content/courses/fetcher');

var myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

var web3 = null;
var compiledContract = null;
try {
    web3 = web3Utils.Create();
    console.log("Connection Successfull!");

    web3.eth.accounts.wallet.add(process.env.USER1_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(process.env.USER2_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(process.env.USER3_PRIVATE_KEY);
}
catch (e) {
    console.log("Connection Error!", e);
}

const purchaseCourse = async (deployedContract, account, course) => {
    var ethExchangeRate = await GetETHExchangeRate();
    var finalPriceEth = course.price * ethExchangeRate;
    var valueToSend = Web3.utils.toWei(finalPriceEth.toString(), 'ether');

    const gas = await web3.eth.getGasPrice();
    const method = deployedContract.methods.purchaseCourse(course.id);
    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            from: account.address,
            to: deployedContract._address,
            value: valueToSend,
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

const getCoursePrice = async (deployedContract, account, course) => {
    var res = await deployedContract.methods.getCoursePrice(course.id)
        .call({ from: account.address }, function (err, result) {
            if (err) {
                console.log(`An error occured when trying to get course price for ${course.id}`, err)
                return;
            }
            return result;
        });

    return res;
};

const getUserBoughtCoursesIds = async (deployedContract, account) => {
    var res = await deployedContract.methods.getUserBoughtCoursesIds(account.address)
        .call(function (err, result) {
            if (err) {
                console.log(`An error occured when trying to get user purchases; address: ${account.address}`, err)
                return;
            }
            return result;
        });

    return res;
};

async function TestPurchase(fromAccount) {
    const deployedContract = web3Utils.getDeployedContract(web3, process.env.CONTRACT_DEPLOYMENT_ADRESS);

    const allCourses = CoursesFetcher.getAllParsedCoursesForContractUse().data;
    for (let index = 0; index < 3; index++) {
        const course = allCourses[index];
        course.id = web3Utils.getKeccak256HexValueFromInput(course.id);
        try {
            //purchase course
            console.log(`Purchase course : ${course.id} ; ${course.title}`);
            var result = await purchaseCourse(deployedContract, fromAccount, course);
            console.log(`Course successfully puchased with tx hash: ${result.transactionHash}`);
        }
        catch (e) {
            if (e.reason)
                console.log(e.reason);
            else
                console.log(e.message);
        }
    }
}

async function getCoursesPricesFromContract(fromAccount) {
    const deployedContract = web3Utils.getDeployedContract(web3, process.env.CONTRACT_DEPLOYMENT_ADRESS);

    const allCourses = CoursesFetcher.getAllParsedCoursesForContractUse().data;
    for (let index = 0; index < allCourses.length; index++) {
        const course = allCourses[index];
        course.id = web3Utils.getKeccak256HexValueFromInput(course.id);
        try {
            //purchase course
            console.log(`Get price for course : ${course.id} ; ${course.title}`);
            var coursePrice = await getCoursePrice(deployedContract, fromAccount, course);
            console.log(`Course price : ${coursePrice}`);

            if (coursePrice != course.price)
                throw new Error('Course preice retrieved from blockchain must be the same as the one from input json file');
        }
        catch (e) {
            if (e.reason)
                console.log(e.reason);
            else
                console.log(e.message);
        }
    }
}

async function getAllCoursesBoughtFromUser(fromAccount) {
    try {
        const deployedContract = web3Utils.getDeployedContract(web3, process.env.CONTRACT_DEPLOYMENT_ADRESS);

        var listOfCoursesPurchased = await getUserBoughtCoursesIds(deployedContract, fromAccount);
        console.log(`List of courses purchases for : ${fromAccount.address}`);
        console.log(listOfCoursesPurchased);
    }
    catch (e) {
        console.log(e);
    }
}

if (web3) {
    (async () => {
        const fromAccount = web3.eth.accounts.wallet[1];
        await TestPurchase(fromAccount);
        //await getCoursesPricesFromContract(fromAccount);
        await getAllCoursesBoughtFromUser(fromAccount);
    })();
}

