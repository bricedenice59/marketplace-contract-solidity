const { v4: uuidv4 } = require("uuid");
const testUtils = require("../utils/testutils/common");
const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { utils } = require("ethers");

describe("Marketplace contract test", function () {
    var deployedMarketplace;
    var deployer;
    var courseAuthorAccount;
    var buyerAccount;
    var newcontractOwnerAccount;

    var courseId;
    var courseAuthorId;
    before(async function () {
        deployer = (await getNamedAccounts()).deployer;

        await deployments.fixture();

        deployedMarketplace = await ethers.getContract("Marketplace", deployer);

        var accounts = await ethers.getSigners();
        courseAuthorAccount = accounts[1];
        buyerAccount = accounts[2];
        newcontractOwnerAccount = accounts[3];

        console.log(`Deployer address: ${deployer}`);
        console.log(`CourseAuthor address: ${courseAuthorAccount.address}`);
        console.log(`Buyer address: ${buyerAccount.address}`);
        console.log(`NewContractOwner after ownership changes: ${newcontractOwnerAccount.address}`);

        //generate a new course ID
        courseId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
        //generate a new author ID
        courseAuthorId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
    });

    it("Add a new course author", async () => {
        const rewardPercentage = 90;

        await deployedMarketplace.addCourseAuthor(
            courseAuthorId,
            courseAuthorAccount.address,
            rewardPercentage
        );
    });

    it("Only the course owner can add his own new courses to the contract, it shoud fail if different", async () => {
        await deployedMarketplace.connect(courseAuthorAccount).addCourse(courseId);

        var newCourseId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));

        await expect(
            deployedMarketplace.connect(buyerAccount).addCourse(newCourseId)
        ).to.be.revertedWith("Marketplace__OnlyCourseAuthor");
    });

    it("Attempt to add a course that already exists, it shoud fail with error CourseDoesAlreadyExist()", async () => {
        await expect(
            deployedMarketplace.connect(courseAuthorAccount).addCourse(courseId)
        ).to.be.revertedWith("Marketplace__CourseDoesAlreadyExist");
    });

    it("Retrieves correctly all courses published by a course author ", async () => {
        const rewardPercentage = 90;

        const accounts = await ethers.getSigners();
        const fakeAuthorAccount = accounts[5];
        const fakeCourseOwnerId = utils.keccak256(fakeAuthorAccount.address);
        await deployedMarketplace.addCourseAuthor(
            fakeCourseOwnerId,
            fakeAuthorAccount.address,
            rewardPercentage
        );

        //array of courses_id that are being published
        var allCoursesBeingPublished = [];
        const nbFakeCoursesToAdd = 10;
        //add multiples fake courses
        for (var i = 1; i <= nbFakeCoursesToAdd; i++) {
            const courseId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
            await deployedMarketplace.connect(fakeAuthorAccount).addCourse(courseId);
            allCoursesBeingPublished.push(courseId);
        }

        const allPublishedCoursesFromContract =
            await deployedMarketplace.getCourseAuthorPublishedCourses(fakeAuthorAccount.address);

        for (var i = 0; i < nbFakeCoursesToAdd; i++) {
            assert.equal(allPublishedCoursesFromContract[i], allCoursesBeingPublished[i]);
        }
    });

    it("The contract owner cannot publish a course, it should fail with error OnlyCourseAuthor()", async () => {
        await expect(
            deployedMarketplace.addCourse(utils.keccak256(utils.toUtf8Bytes(uuidv4().toString())))
        ).to.be.revertedWith("Marketplace__OnlyCourseAuthor");
    });

    it("Check if the course has already been bought by the buyer account, it should be FALSE", async () => {
        const hasCourseAlreadyBeenBought = await deployedMarketplace.hasCourseAlreadyBeenBought(
            buyerAccount.address,
            courseId
        );

        assert.equal(hasCourseAlreadyBeenBought, false);
    });

    it("For a given course author, buying his/her own published course should fail with following error: CannotPurchaseOwnCourse()", async () => {
        const coursePrice = "70";

        //calculation of funds to send
        var ethExchangeRate = 0.0008642427880341;
        var finalPriceEth = Number(coursePrice) * ethExchangeRate;
        var valueToSend = ethers.utils.parseEther(finalPriceEth.toString());

        //purchase course with the author account
        await expect(
            deployedMarketplace.connect(courseAuthorAccount).purchaseCourse(courseId, {
                value: valueToSend,
            })
        ).to.be.revertedWith("Marketplace__CannotPurchaseOwnCourse");
    });

    it("Purchase a course and check if both course author and contract owner have received the money according the reward percentage previously negotiated", async () => {
        const coursePrice = "120";
        const courseAuthorDataAddr = courseAuthorAccount.address;
        const courseAuthorRewardPercentage = 90;

        //calculation of funds to send
        var ethExchangeRate = 0.0008642427880341;
        var finalPriceEth = Number(coursePrice) * ethExchangeRate;
        var valueToSend = ethers.utils.parseEther(finalPriceEth.toString());

        //split funds calculation
        const fundsValuetoBeSentToCourseAuthor = valueToSend
            .mul(courseAuthorRewardPercentage)
            .div(100);

        const contractPercentage = 100 - Number(courseAuthorRewardPercentage);
        const fundsValuetoBeSentToContract = valueToSend.mul(contractPercentage).div(100);

        const courseAuthorBeforePurchaseBalance = await deployedMarketplace.provider.getBalance(
            courseAuthorDataAddr
        );
        const contractBeforePurchaseBalance = await deployedMarketplace.provider.getBalance(
            deployedMarketplace.address
        );

        //purchase course with a new connected buyer account
        await deployedMarketplace.connect(buyerAccount).purchaseCourse(courseId, {
            value: valueToSend,
        });

        //compare before/after balances
        const courseAuthorAfterBalance = await deployedMarketplace.provider.getBalance(
            courseAuthorDataAddr
        );
        const contractAfterBalance = await deployedMarketplace.provider.getBalance(
            deployedMarketplace.address
        );

        const expectedContractAfterBalance = contractBeforePurchaseBalance.add(
            fundsValuetoBeSentToContract
        );

        const expectedCourseAuthorAfterBalance = courseAuthorBeforePurchaseBalance.add(
            fundsValuetoBeSentToCourseAuthor
        );

        assert(
            courseAuthorAfterBalance.eq(expectedCourseAuthorAfterBalance),
            `${courseAuthorRewardPercentage}% of the sale should be credited to the course author`
        );
        assert(
            contractAfterBalance.eq(expectedContractAfterBalance),
            `${contractPercentage}% of the sale should be credited to the contract owner`
        );
    });

    it("Try re-purchasing the same course from the same buyer account, it should fail with following error: CourseAlreadyBought()", async () => {
        const coursePrice = "120";
        var ethExchangeRate = 0.0008642427880341;
        var finalPriceEth = Number(coursePrice) * ethExchangeRate;
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
        await deployedMarketplace.connect(courseAuthorAccount).deactivateCourse(courseId);

        // from contract :
        // enum CourseAvailabilityEnum {
        //   Activated, => 0
        //   Deactivated => 1
        // }

        var getCourseStatusResult = await deployedMarketplace
            .connect(courseAuthorAccount)
            .getCourseStatus(courseId);

        assert.equal(
            getCourseStatusResult.toString(),
            "1",
            "Expected course status should be: Deactivated"
        );
    });

    it("Attempt to deactivate a course that is already deactivated should fail with error CourseIsAlreadyDeactivated()", async () => {
        await expect(
            deployedMarketplace.connect(courseAuthorAccount).deactivateCourse(courseId)
        ).to.be.revertedWith("Marketplace__CourseIsAlreadyDeactivated");
    });

    it("Attempt to deactivate a course that does not exist should fail with error CourseDoesNotExist()", async () => {
        var randomCourseId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
        await expect(
            deployedMarketplace.connect(courseAuthorAccount).deactivateCourse(randomCourseId)
        ).to.be.revertedWith("Marketplace__CourseDoesNotExist");
    });

    it("Try purchasing a deactivated course, it should fail with following error: CourseMustBeActivated()", async () => {
        const coursePrice = "120";
        var ethExchangeRate = 0.0008642427880341;
        var finalPriceEth = Number(coursePrice) * ethExchangeRate;
        var valueToSend = ethers.utils.parseEther(finalPriceEth.toString());

        await expect(
            deployedMarketplace.connect(buyerAccount).purchaseCourse(courseId, {
                value: valueToSend,
            })
        ).to.be.revertedWith("Marketplace__CourseMustBeActivated");
    });

    it("Only the contract owner can withdraw some or all funds from the marketplace", async () => {
        const fundstoWithdraw = ethers.utils.parseEther("0.02");

        await expect(
            deployedMarketplace
                .connect(courseAuthorAccount)
                .withdrawMarketplaceFunds(fundstoWithdraw)
        ).to.be.revertedWith("Marketplace__OnlyContractOwner");
    });

    it("Withdraw some of the marketplace funds", async () => {
        const fundstoWithdraw = ethers.utils.parseEther("0.01");
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
        const fakeCourseAuthorId = utils.keccak256(fakeAuthorAccount.address);
        const rewardPercentage = 90;
        await deployedMarketplace.addCourseAuthor(
            fakeCourseAuthorId,
            fakeAuthorAccount.address,
            rewardPercentage
        );

        const newfakeAuthorAccount = accounts[7];
        await expect(
            deployedMarketplace.changeCourseAuthorAddress(newfakeAuthorAccount.address)
        ).to.be.revertedWith("Marketplace__OnlyCourseAuthor()");
    });

    it("Change an author recipient address", async () => {
        const accounts = await ethers.getSigners();
        const fakeAuthorAccount = accounts[8];
        const fakeCourseAuthorId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
        const rewardPercentage = 27;

        await deployedMarketplace.addCourseAuthor(
            fakeCourseAuthorId,
            fakeAuthorAccount.address,
            rewardPercentage
        );

        const newfakeAuthorAccount = accounts[9];
        await deployedMarketplace
            .connect(fakeAuthorAccount)
            .changeCourseAuthorAddress(newfakeAuthorAccount.address);
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
