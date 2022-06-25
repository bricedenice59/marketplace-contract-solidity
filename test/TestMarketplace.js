const Marketplace = artifacts.require("Marketplace");
const { v4: uuidv4 } = require('uuid');
const web3Utils = require('../utils/web3Utils');
const testUtils = require('../utils/testutils/common');

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
        const rewardPercentage = 90;

        var newCourseOwnerResult = await deployedMarketplace.addCourseOwner(
            courseOwnerId,
            courseOwnerAccountAddress,
            rewardPercentage,
            { from: contractOwnerAccountAddress }
        );

        const courseOwner = await deployedMarketplace.getCourseOwnerData(courseOwnerId);
        assert.equal(courseOwner[0], courseOwnerAccountAddress, `The course owner should be: ${courseOwnerAccountAddress}`)
    });

    it('Only the course owner can add HIS own new courses to the contract, it shoud fail if different', async () => {
        var price = testUtils.getRandomNumberBetween(250, 400);
        var title = testUtils.generateRandomString(testUtils.getRandomNumberBetween(30, 70));

        var newCourseResult = await deployedMarketplace.addCourse(
            courseId,
            title,
            price,
            courseOwnerId,
            { from: courseOwnerAccountAddress }
        )

        const coursePrice = await deployedMarketplace.getCoursePrice(courseId);
        assert.equal(coursePrice.toNumber(), price, `The course should have a price of: ${price}`);

        try {
            var anotherCourseResult = await deployedMarketplace.addCourse(
                web3Utils.getKeccak256HexValueFromInput(uuidv4()),
                testUtils.generateRandomString(testUtils.getRandomNumberBetween(40, 90)),
                testUtils.getRandomNumberBetween(50, 100),
                courseOwnerId,
                { from: buyerAccountAddress }
            )
            throw ('Operation should have failed');
        } catch (e) {
            assert.match(e, /VM Exception while processing transaction: revert/, 'OnlyCourseOwner()')
        }
    });

    it('The contract owner cannot publish a course, it should fail', async () => {
        var price = testUtils.getRandomNumberBetween(50, 100);
        var title = testUtils.generateRandomString(testUtils.getRandomNumberBetween(40, 90));
        try {
            var newCourseResult = await deployedMarketplace.addCourse(
                web3Utils.getKeccak256HexValueFromInput(uuidv4()),
                title,
                price,
                courseOwnerId,
                { from: contractOwnerAccountAddress }
            );
            throw ('Operation should have failed');
        } catch (e) {
            assert.match(e, /VM Exception while processing transaction: revert/, 'Only the store front owner can edit the product')
        }
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
        const contractPercentage = (100 - courseOwnerRewardPercentage.toNumber());
        const fundsValuetoBeSentToContract = ((valueToSend * contractPercentage) / 100);

        const courseOwnerBeforePurchaseBalance = await web3.eth.getBalance(courseOwnerDataAddr);
        const contractBeforePurchaseBalance = await web3.eth.getBalance(deployedMarketplace.address);

        //purchase course
        var newCourseResult = await deployedMarketplace.purchaseCourse(courseId, { from: buyerAccountAddress, value: valueToSend });

        //retrieve the course just purchased
        const coursePurchased = await deployedMarketplace.getUserBoughtCoursesIds(buyerAccountAddress);
        assert.equal(coursePurchased[0], courseId, `The course id that was purchased should be : ${courseId}`);

        //compare before/after balances 
        const courseOwnerAfterBalance = BigInt(await web3.eth.getBalance(courseOwnerDataAddr)) / 100000n;
        const contractAfterBalance = BigInt(await web3.eth.getBalance(deployedMarketplace.address)) / 100000n;

        const expectedContractAfterBalance = (BigInt(contractBeforePurchaseBalance) + BigInt(fundsValuetoBeSentToContract)) / 100000n;
        const expectedCourseOwnerAfterBalance = (BigInt(courseOwnerBeforePurchaseBalance) + BigInt(fundsValuetoBeSentToCourseOwner)) / 100000n;

        assert.equal(parseFloat(courseOwnerAfterBalance), parseFloat(expectedCourseOwnerAfterBalance),
            `${courseOwnerRewardPercentage}% of the sale should be credited to the course owner`);
        assert.equal(parseFloat(contractAfterBalance), parseFloat(expectedContractAfterBalance),
            `${contractPercentage}% of the sale should be credited to the marketplace.`
        );
    });

    it('Only the contract owner can withdraw some or all funds from the marketplace', async () => {
        const fundstoWithdraw = Web3.utils.toWei(0.02.toString(), 'ether');
        try {
            var withdrawResult = await deployedMarketplace.withdrawMarketplaceFunds(
                fundstoWithdraw,
                { from: courseOwnerAccountAddress }
            );
            throw ('Operation should have failed');
        } catch (e) {
            assert.match(e, /VM Exception while processing transaction: revert/, 'OnlyContractOwner()')
        }
    });

    it('Withdraw some of the marketplace funds', async () => {
        const fundstoWithdraw = Web3.utils.toWei(0.02.toString(), 'ether');
        const contractBeforeWithdrawBalance = await web3.eth.getBalance(deployedMarketplace.address);
        const contractOwnerBeforeWithdrawBalance = await web3.eth.getBalance(contractOwnerAccountAddress);

        var withdrawResult = await deployedMarketplace.withdrawMarketplaceFunds(
            fundstoWithdraw,
            { from: contractOwnerAccountAddress }
        );

        const contractAfterWithdrawBalance = await web3.eth.getBalance(deployedMarketplace.address);
        const contractOwnerAfterWithdrawBalance = await web3.eth.getBalance(contractOwnerAccountAddress);

        const expectedContractAfterWithdrawBalance = (BigInt(contractBeforeWithdrawBalance) - BigInt(fundstoWithdraw));
        const expectedContractOwnerAfterWithdrawBalance = (BigInt(contractOwnerBeforeWithdrawBalance) + BigInt(fundstoWithdraw));

        assert.equal(parseFloat(contractAfterWithdrawBalance), parseFloat(expectedContractAfterWithdrawBalance),
            `The expected contract balance after withdrawal should be: ${parseFloat(expectedContractAfterWithdrawBalance)}`);
        assert.isAtMost(parseFloat(contractOwnerAfterWithdrawBalance), parseFloat(expectedContractOwnerAfterWithdrawBalance),
            `The expected contract owner balance after withdrawal should be: ${parseFloat(expectedContractOwnerAfterWithdrawBalance)}`);
    });
});