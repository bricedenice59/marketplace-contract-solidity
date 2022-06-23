const web3Utils = require('../utils/web3Utils');
const GetETHExchangeRate = require('../utils/EthExchangeRate');
const Web3 = require("web3");

const addCourseOwnerToContract = async (web3, deployedContract, account, newCourseOwner) => {
    const gas = await web3.eth.getGasPrice();
    const method = deployedContract.methods.addCourseOwner(newCourseOwner.id, newCourseOwner.address, newCourseOwner.rewardPercentage);
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

const addCourseToContract = async (web3, deployedContract, account, newCourse) => {
    const gas = await web3.eth.getGasPrice();
    const method = deployedContract.methods.addCourse(newCourse.id, newCourse.title, newCourse.price, newCourse.courseOwner);
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

const activateCourse = async (web3, deployedContract, account, course, shouldActivate = true) => {
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

const purchaseCourse = async (web3, deployedContract, account, course) => {
    var ethExchangeRate = await GetETHExchangeRate(web3, process.env.PRICEFEED_RINKEBY);
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

module.exports.addCourseOwnerToContract = addCourseOwnerToContract;
module.exports.addCourseToContract = addCourseToContract;
module.exports.activateCourse = activateCourse;
module.exports.purchaseCourse = purchaseCourse;
module.exports.getCoursePrice = getCoursePrice;
module.exports.getUserBoughtCoursesIds = getUserBoughtCoursesIds;