const Marketplace = artifacts.require("Marketplace");
const { v4: uuidv4 } = require('uuid');
const web3Utils = require('../utils/web3Utils');

generateCourse = async (course) => {
    var result = await instance.addNewCourse(course);
    return result;
}

function getRandomNumberBetween(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1) + min
    )
}

function generateRandomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

describe("Marketplace contract test", function () {
    var deployedMarketplace;
    var contractOwnerAccountAddress;
    var courseOwnerAccountAddress;
    var buyerAccountAddress;

    var courseOwnerId;
    var courseId;

    before(async function () {
        deployedMarketplace = await Marketplace.new();
        const accounts = await web3.eth.getAccounts();

        contractOwnerAccountAddress = accounts[0];
        courseOwnerAccountAddress = accounts[1];
        buyerAccountAddress = accounts[2];

        //generate a new course owner ID
        courseOwnerId = web3Utils.getKeccak256HexValueFromInput(courseOwnerAccountAddress);

        //generate a new course ID
        courseId = web3Utils.getKeccak256HexValueFromInput(uuidv4());
    });

    it('Add a new course owner and retrieves his address', async () => {
        const rewardPercentage = 85;

        var newCourseOwnerResult = await deployedMarketplace.addCourseOwner(
            courseOwnerId,
            courseOwnerAccountAddress,
            rewardPercentage,
            { from: contractOwnerAccountAddress }
        );

        const courseOwner = await deployedMarketplace.getCourseOwnerData(courseOwnerId);
        assert.equal(courseOwner[0], courseOwnerAccountAddress, `The course owner should be: ${courseOwnerAccountAddress}`)
    });

    it('Add a new course and retrieve its price', async () => {
        var price = getRandomNumberBetween(50, 240);
        var title = generateRandomString(getRandomNumberBetween(20, 70));

        var newCourseResult = await deployedMarketplace.addCourse(
            courseId,
            title,
            price,
            courseOwnerId,
            { from: contractOwnerAccountAddress }
        )

        const coursePrice = await deployedMarketplace.getCoursePrice(courseId);
        assert.equal(coursePrice.toNumber(), price, `The course owner should have a price of: ${price}`);
    });

    it('Purchase a course and check if both course owner and contract owner have received the money according the reward percentage previously negotiated', async () => {
        const coursePrice = await deployedMarketplace.getCoursePrice(courseId);
        const courseOwnerData = await deployedMarketplace.getCourseOwnerData(courseOwnerId);

        const courseOwnerDataAddr = courseOwnerData[0];
        const courseOwnerRewardPercentage = courseOwnerData[1];

        //calculation of funds to send
        var ethExchangeRate = 0.0008642427880341;
        var finalPriceEth = coursePrice.toNumber() * ethExchangeRate;
        var valueToSend = Web3.utils.toWei(finalPriceEth.toString(), 'ether');

        //split funds calculation
        const fundsValuetoBeSentToCourseOwner = ((valueToSend * courseOwnerRewardPercentage.toNumber()) / 100);
        const contractOwnerPercentage = (100 - courseOwnerRewardPercentage.toNumber());
        const fundsValuetoBeSentToContractOwner = ((valueToSend * contractOwnerPercentage) / 100);

        const courseOwnerBeforePurchaseBalance = await web3.eth.getBalance(courseOwnerDataAddr);
        const contractOwnerBeforePurchaseBalance = await web3.eth.getBalance(contractOwnerAccountAddress);

        var newCourseResult = await deployedMarketplace.purchaseCourse(courseId, { from: buyerAccountAddress, value: valueToSend });

        const coursePurchased = await deployedMarketplace.getUserBoughtCoursesIds(buyerAccountAddress);
        assert.equal(coursePurchased[0], courseId, `The course id that was purchased should be : ${courseId}`);

        const courseOwnerAfterBalance = BigInt(await web3.eth.getBalance(courseOwnerDataAddr)) / 100000n;
        const contractOwnerAfterBalance = BigInt(await web3.eth.getBalance(contractOwnerAccountAddress)) / 100000n;

        const expectedContractOwnerAfterBalance = (BigInt(contractOwnerBeforePurchaseBalance) + BigInt(fundsValuetoBeSentToContractOwner)) / 100000n;
        const expectedCourseOwnerAfterBalance = (BigInt(courseOwnerBeforePurchaseBalance) + BigInt(fundsValuetoBeSentToCourseOwner)) / 100000n;

        assert.equal(parseFloat(courseOwnerAfterBalance), parseFloat(expectedCourseOwnerAfterBalance),
            `${courseOwnerRewardPercentage}% of the sale should be credited to the course owner`);
        assert.equal(parseFloat(contractOwnerAfterBalance), parseFloat(expectedContractOwnerAfterBalance),
            `${contractOwnerPercentage}% of the sale should be credited to the marketplace.`
        );
    });
});