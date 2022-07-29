const { v4: uuidv4 } = require("uuid");
const testUtils = require("../utils/testutils/common");
const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { utils } = require("ethers");

describe("Marketplace contract test", function () {
    var deployedMarketplace;
    var deployer;
    var courseOwnerAccount;
    var buyerAccount;
    var newcontractOwnerAccount;

    var courseId;
    before(async function () {
        deployer = (await getNamedAccounts()).deployer;

        await deployments.fixture();
        deployedMarketplace = await ethers.getContract("Marketplace", deployer);

        var accounts = await ethers.getSigners();
        courseOwnerAccount = accounts[1];
        buyerAccount = accounts[2];
        newcontractOwnerAccount = accounts[3];

        console.log(`Deployer address: ${deployer}`);
        console.log(`CourseOwner address: ${courseOwnerAccount.address}`);
        console.log(`Buyer address: ${buyerAccount.address}`);
        console.log(`NewContractOwner after ownership changes: ${newcontractOwnerAccount.address}`);

        //generate a new course ID
        courseId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
    });

    it("Add a new course author", async () => {
        const rewardPercentage = 90;

        await deployedMarketplace.addCourseAuthor(courseOwnerAccount.address, rewardPercentage);
    });

    it("Only the course owner can add HIS own new courses to the contract, it shoud fail if different", async () => {
        var price = testUtils.getRandomNumberBetween(2500, 4000);
        var title = utils.keccak256(
            utils.toUtf8Bytes(
                testUtils.generateRandomString(testUtils.getRandomNumberBetween(30, 70))
            )
        );

        await deployedMarketplace.connect(courseOwnerAccount).addCourse(courseId, title, price);

        const coursePrice = await deployedMarketplace.getCoursePrice(courseId);
        assert.equal(coursePrice.toNumber(), price, `The course should have a price of: ${price}`);

        var newCourseId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
        var price = testUtils.getRandomNumberBetween(2500, 4000);
        var title = utils.keccak256(
            utils.toUtf8Bytes(
                testUtils.generateRandomString(testUtils.getRandomNumberBetween(30, 70))
            )
        );

        await expect(
            deployedMarketplace.connect(buyerAccount).addCourse(newCourseId, title, price)
        ).to.be.revertedWith("Marketplace__OnlyCourseAuthor");
    });

    it("Retrieves correctly all courses published by a course author ", async () => {
        const rewardPercentage = 90;

        const accounts = await ethers.getSigners();
        const fakeAuthorAccount = accounts[5];
        await deployedMarketplace.addCourseAuthor(fakeAuthorAccount.address, rewardPercentage);

        //array of courses_id that are being published
        var allCoursesBeingPublished = [];
        const nbFakeCoursesToAdd = 10;
        //add multiples fake courses
        for (var i = 1; i <= nbFakeCoursesToAdd; i++) {
            const courseId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
            allCoursesBeingPublished.push(courseId);
            var price = testUtils.getRandomNumberBetween(100, 300);
            var title = utils.keccak256(
                utils.toUtf8Bytes(
                    testUtils.generateRandomString(testUtils.getRandomNumberBetween(30, 70))
                )
            );
            await deployedMarketplace.connect(fakeAuthorAccount).addCourse(courseId, title, price);
        }

        const allPublishedCoursesFromContract =
            await deployedMarketplace.getCourseAuthorPublishedCourses(fakeAuthorAccount.address);

        for (var i = 1; i <= nbFakeCoursesToAdd; i++) {
            assert.equal(allPublishedCoursesFromContract[i], allCoursesBeingPublished[i]);
        }
    });

    it("The contract owner cannot publish a course, it should fail with errror OnlyCourseOwner()", async () => {
        var price = testUtils.getRandomNumberBetween(50, 100);
        var title = utils.keccak256(
            utils.toUtf8Bytes(
                testUtils.generateRandomString(testUtils.getRandomNumberBetween(40, 90))
            )
        );

        await expect(
            deployedMarketplace.addCourse(
                utils.keccak256(utils.toUtf8Bytes(uuidv4().toString())),
                title,
                price,
                { from: deployer }
            )
        ).to.be.revertedWith("Marketplace__OnlyCourseAuthor");
    });

    it("Check if the course has already been bought by the buyer account, it should be FALSE", async () => {
        const hasCourseAlreadyBeenBought = await deployedMarketplace.hasCourseAlreadyBeenBought(
            buyerAccount.address,
            courseId
        );

        assert.equal(hasCourseAlreadyBeenBought, false);
    });

    it("Purchase a course and check if both course author and contract owner have received the money according the reward percentage previously negotiated", async () => {
        const coursePrice = await deployedMarketplace.getCoursePrice(courseId);
        const courseOwnerDataAddr = courseOwnerAccount.address;
        const courseOwnerRewardPercentage =
            await deployedMarketplace.getCourseAuthorRewardPercentage(courseOwnerAccount.address);

        //calculation of funds to send
        var ethExchangeRate = 0.0008642427880341;
        var finalPriceEth = coursePrice.toNumber() * ethExchangeRate;
        var valueToSend = ethers.utils.parseEther(finalPriceEth.toString());

        //split funds calculation
        const fundsValuetoBeSentToCourseOwner = valueToSend
            .mul(courseOwnerRewardPercentage)
            .div(100);

        const contractPercentage = 100 - Number(courseOwnerRewardPercentage);
        const fundsValuetoBeSentToContract = valueToSend.mul(contractPercentage).div(100);

        const courseOwnerBeforePurchaseBalance = await deployedMarketplace.provider.getBalance(
            courseOwnerDataAddr
        );
        const contractBeforePurchaseBalance = await deployedMarketplace.provider.getBalance(
            deployedMarketplace.address
        );

        //purchase course with a new connected buyer account
        await deployedMarketplace.connect(buyerAccount).purchaseCourse(courseId, {
            value: valueToSend,
        });

        //retrieve the course just purchased
        const coursePurchased = await deployedMarketplace
            .connect(buyerAccount)
            .getUserBoughtCoursesIds(buyerAccount.address);
        assert.equal(
            coursePurchased[0],
            courseId,
            `The course id that was purchased should be : ${courseId}`
        );

        //compare before/after balances
        const courseOwnerAfterBalance = await deployedMarketplace.provider.getBalance(
            courseOwnerDataAddr
        );
        const contractAfterBalance = await deployedMarketplace.provider.getBalance(
            deployedMarketplace.address
        );

        const expectedContractAfterBalance = contractBeforePurchaseBalance.add(
            fundsValuetoBeSentToContract
        );

        const expectedCourseOwnerAfterBalance = courseOwnerBeforePurchaseBalance.add(
            fundsValuetoBeSentToCourseOwner
        );

        assert(
            courseOwnerAfterBalance.eq(expectedCourseOwnerAfterBalance),
            `${courseOwnerRewardPercentage}% of the sale should be credited to the course author`
        );
        assert(
            contractAfterBalance.eq(expectedContractAfterBalance),
            `${contractPercentage}% of the sale should be credited to the contract owner`
        );
    });

    it("Try re-purchasing the same course from the same buyer account, it should fail with following error: CourseAlreadyBought()", async () => {
        const coursePrice = await deployedMarketplace.getCoursePrice(courseId);
        var ethExchangeRate = 0.0008642427880341;
        var finalPriceEth = coursePrice.toNumber() * ethExchangeRate;
        var valueToSend = ethers.utils.parseEther(finalPriceEth.toString());

        await expect(
            deployedMarketplace.connect(buyerAccount).purchaseCourse(courseId, {
                value: valueToSend,
            })
        ).to.be.revertedWith("Marketplace__CourseAlreadyBought");
    });

    it("Attempt to deactivate a course by the contract owner account should fail with error Marketplace__OnlyCourseAuthor()", async () => {
        await expect(deployedMarketplace.deactivateCourse(courseId)).to.be.revertedWith(
            "Marketplace__OnlyCourseAuthor"
        );
    });

    it("Attempt to deactivate a course by the course author account should be allowed and be successfull", async () => {
        await deployedMarketplace.connect(courseOwnerAccount).deactivateCourse(courseId);

        // from contract :
        // enum CourseAvailabilityEnum {
        //   Activated, => 0
        //   Deactivated => 1
        // }

        var getCourseStatusResult = await deployedMarketplace
            .connect(courseOwnerAccount)
            .getCourseStatus(courseId);

        assert.equal(
            getCourseStatusResult.toString(),
            "1",
            "Expected course status should be: Deactivated"
        );
    });

    it("Attempt to deactivate a course that is already deactivated should fail with error CourseIsAlreadyDeactivated()", async () => {
        await expect(
            deployedMarketplace.connect(courseOwnerAccount).deactivateCourse(courseId)
        ).to.be.revertedWith("Marketplace__CourseIsAlreadyDeactivated");
    });

    it("Try purchasing a deactivated course, it should fail with following error: CourseMustBeActivated()", async () => {
        const coursePrice = await deployedMarketplace.getCoursePrice(courseId);
        var ethExchangeRate = 0.0008642427880341;
        var finalPriceEth = coursePrice.toNumber() * ethExchangeRate;
        var valueToSend = ethers.utils.parseEther(finalPriceEth.toString());

        await expect(
            deployedMarketplace.connect(courseOwnerAccount).purchaseCourse(courseId, {
                value: valueToSend,
            })
        ).to.be.revertedWith("Marketplace__CourseMustBeActivated");
    });

    it("Only the contract owner can withdraw some or all funds from the marketplace", async () => {
        const fundstoWithdraw = ethers.utils.parseEther("0.02");

        await expect(
            deployedMarketplace
                .connect(courseOwnerAccount)
                .withdrawMarketplaceFunds(fundstoWithdraw)
        ).to.be.revertedWith("Marketplace__OnlyContractOwner");
    });

    it("Withdraw some of the marketplace funds", async () => {
        const fundstoWithdraw = ethers.utils.parseEther("0.02");
        const contractBeforeWithdrawBalance = await deployedMarketplace.provider.getBalance(
            deployedMarketplace.address
        );
        const contractOwnerBeforeWithdrawBalance = await deployedMarketplace.provider.getBalance(
            deployer
        );

        var withdrawResult = await deployedMarketplace.withdrawMarketplaceFunds(fundstoWithdraw);

        //calculate gas cost from transaction
        const transactionReceipt = await withdrawResult.wait(1);
        const { gasUsed, effectiveGasPrice } = transactionReceipt;
        const gasCost = gasUsed.mul(effectiveGasPrice);

        const contractAfterWithdrawBalance = await deployedMarketplace.provider.getBalance(
            deployedMarketplace.address
        );
        const contractOwnerAfterWithdrawBalance = await deployedMarketplace.provider.getBalance(
            deployer
        );

        const expectedContractAfterWithdrawBalance =
            contractBeforeWithdrawBalance.sub(fundstoWithdraw);
        const expectedContractOwnerAfterWithdrawBalance =
            contractOwnerBeforeWithdrawBalance.add(fundstoWithdraw);

        assert(
            contractAfterWithdrawBalance.eq(expectedContractAfterWithdrawBalance),
            `The expected contract balance after withdrawal should be: ${expectedContractAfterWithdrawBalance}`
        );

        assert(
            contractOwnerAfterWithdrawBalance
                .add(gasCost)
                .eq(expectedContractOwnerAfterWithdrawBalance),
            `The expected contract balance after withdrawal should be: ${expectedContractOwnerAfterWithdrawBalance}`
        );
    });

    it("Only a course author can change its recipient address with a new one", async () => {
        const accounts = await ethers.getSigners();
        const fakeAuthorAccount = accounts[6];

        const rewardPercentage = 90;
        await deployedMarketplace.addCourseAuthor(fakeAuthorAccount.address, rewardPercentage);

        const newfakeAuthorAccount = accounts[7];
        await expect(
            deployedMarketplace.changeCourseAuthorAddress(newfakeAuthorAccount.address)
        ).to.be.revertedWith("Marketplace__OnlyCourseAuthor()");
    });

    it("Change an author recipient address", async () => {
        const accounts = await ethers.getSigners();
        const fakeAuthorAccount = accounts[8];

        const rewardPercentage = 27;
        await deployedMarketplace.addCourseAuthor(fakeAuthorAccount.address, rewardPercentage);

        const newfakeAuthorAccount = accounts[9];
        deployedMarketplace
            .connect(fakeAuthorAccount)
            .changeCourseAuthorAddress(newfakeAuthorAccount.address);

        const courseOwnerRewardPercentage =
            await deployedMarketplace.getCourseAuthorRewardPercentage(newfakeAuthorAccount.address);

        assert.equal(courseOwnerRewardPercentage, rewardPercentage);
    });

    it("Transfer marketplace ownership", async () => {
        await deployedMarketplace.transferOwnership(newcontractOwnerAccount.address);

        var expectedNewContractOwner = await deployedMarketplace.getContractOwner();

        assert.equal(
            newcontractOwnerAccount.address,
            expectedNewContractOwner,
            `The expected contract owner should be: ${expectedNewContractOwner}`
        );
    });

    it("Try withdraw some of the marketplace funds with the old contract owner address; it should fail with error OnlyContractOwner()", async () => {
        const fundstoWithdraw = ethers.utils.parseEther("0.001");
        await expect(
            deployedMarketplace.withdrawMarketplaceFunds(fundstoWithdraw)
        ).to.be.revertedWith("Marketplace__OnlyContractOwner");
    });
});
