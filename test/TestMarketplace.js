const { v4: uuidv4 } = require("uuid");
const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { utils } = require("ethers");

describe("Marketplace contract test", function () {
    var deployedMarketplace;
    var deployedMultiSigContract;
    var deployer;
    var deployerAccount;
    var courseAuthorAccount;
    var buyerAccount;
    var newcontractOwnerAccount;

    var multiSigOwner1, multiSigOwner2, multiSigOwner3;

    var courseId;
    var courseAuthorId;
    before(async function () {
        var accounts = await ethers.getSigners();
        deployerAccount = accounts[0];
        deployer = deployerAccount.address;
        courseAuthorAccount = accounts[1];
        buyerAccount = accounts[2];
        newcontractOwnerAccount = accounts[3];

        multiSigOwner1 = accounts[4];
        multiSigOwner2 = accounts[5];
        multiSigOwner3 = accounts[6];

        console.log("------------------------------------");
        console.log("Marketplace contract");
        console.log(`Deployer address: ${deployerAccount.address}`);
        console.log(`CourseAuthor address: ${courseAuthorAccount.address}`);
        console.log(`Buyer address: ${buyerAccount.address}`);
        console.log(
            `NewContractOwner after ownership changes: ${newcontractOwnerAccount.address}`
        );
        console.log("------------------------------------");
        console.log("MultiSig wallet contract");
        console.log(`MultiSig wallet owner1: ${multiSigOwner1.address}`);
        console.log(`MultiSig wallet owner2: ${multiSigOwner2.address}`);
        console.log(`MultiSig wallet owner3: ${multiSigOwner3.address}`);

        //deploys a multisig contract with 3 accounts; deployer is multiSigOwner1
        const multiSigContract = await ethers.getContractFactory("MultiSig");
        deployedMultiSigContract = await multiSigContract
            .connect(multiSigOwner1)
            .deploy([
                multiSigOwner1.address,
                multiSigOwner2.address,
                multiSigOwner3.address,
            ]);
        console.log(`deployed multisig contract at ${deployedMultiSigContract.address}`);

        //deploys a marketplace contract; deployer is deployerAccount
        const CONTRACT_REWARD_PERCENTAGE = 10;
        const marketPlaceContract = await ethers.getContractFactory("Marketplace");
        deployedMarketplace = await marketPlaceContract
            .connect(deployerAccount)
            .deploy(CONTRACT_REWARD_PERCENTAGE, deployedMultiSigContract.address);
        console.log(`deployed multisig contract at ${deployedMarketplace.address}`);

        //generate a new course ID
        courseId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
        //generate a new author ID
        courseAuthorId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
    });

    it("Add a new course", async () => {
        await deployedMarketplace.connect(courseAuthorAccount).addCourse(courseId);
        const courses = await deployedMarketplace.getCourseAuthorPublishedCourses(
            courseAuthorAccount.address
        );
        assert.equal(courses.length, 1);
        assert.equal(courses[0], courseId);
    });

    it("Attempt to add a course that already exists, it shoud fail with error CourseDoesAlreadyExist()", async () => {
        await expect(
            deployedMarketplace.connect(courseAuthorAccount).addCourse(courseId)
        ).to.be.revertedWith("Marketplace__CourseDoesAlreadyExist");
    });

    it("Retrieves correctly all courses published by a course author ", async () => {
        const rewardPercentage = 90;

        const accounts = await ethers.getSigners();
        const fakeAuthorAccount = accounts[10];

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
            await deployedMarketplace.getCourseAuthorPublishedCourses(
                fakeAuthorAccount.address
            );

        for (var i = 0; i < nbFakeCoursesToAdd; i++) {
            assert.equal(allPublishedCoursesFromContract[i], allCoursesBeingPublished[i]);
        }
    });

    it("The contract owner(s) cannot publish a course, it should fail with error OnlyCourseAuthor()", async () => {
        await expect(
            deployedMarketplace.addCourse(
                utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()))
            )
        ).to.be.revertedWith("Marketplace__OnlyCourseAuthor");
    });

    it("Check if the course has already been bought by the buyer account, it should be FALSE", async () => {
        const hasCourseAlreadyBeenBought =
            await deployedMarketplace.hasCourseAlreadyBeenBought(
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

        const courseAuthorBeforePurchaseBalance =
            await deployedMarketplace.provider.getBalance(courseAuthorDataAddr);
        const contractBeforePurchaseBalance =
            await deployedMarketplace.provider.getBalance(deployedMarketplace.address);

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
            deployedMarketplace
                .connect(courseAuthorAccount)
                .deactivateCourse(randomCourseId)
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

    it("Attempt to activate a course that was previously deactivated should be allowed and be successfull", async () => {
        await deployedMarketplace.connect(courseAuthorAccount).activateCourse(courseId);
    });

    it("Only the contract owner can withdraw some or all funds from the marketplace", async () => {
        const fundstoWithdraw = ethers.utils.parseEther("0.02");

        await expect(
            deployedMarketplace
                .connect(courseAuthorAccount)
                .withdrawMarketplaceFunds(courseAuthorAccount.address, fundstoWithdraw)
        ).to.be.revertedWith("Marketplace__OnlyMultiSigWalletsOwners");
    });

    it("Withdraw some of the marketplace funds", async () => {
        const fundstoWithdraw = ethers.utils.parseEther("0.01");
        const courseAuthorFundsBeforeWithdrawBalance =
            await deployedMarketplace.provider.getBalance(courseAuthorAccount.address);

        //we need to make a proposal first
        //prepare payload
        var abiFragmentFreezeUser = [
            "function withdrawMarketplaceFunds(address to, uint256 amount)",
        ];
        var iAddOwner = new ethers.utils.Interface(abiFragmentFreezeUser);
        const payloadWithdrawFunds = iAddOwner.encodeFunctionData(
            "withdrawMarketplaceFunds",
            [courseAuthorAccount.address, fundstoWithdraw]
        );

        //prepare tx submission to interact with marketplace contract
        await deployedMultiSigContract
            .connect(multiSigOwner1)
            .submitTx(deployedMarketplace.address, 0, payloadWithdrawFunds);

        const txNonce = await deployedMultiSigContract.getTransactionCount();

        //owners confirm proposal
        await deployedMultiSigContract.connect(multiSigOwner2).confirmTx(txNonce);
        await deployedMultiSigContract.connect(multiSigOwner3).confirmTx(txNonce);

        //finally executes the proposal
        await deployedMultiSigContract.connect(multiSigOwner3).executeTx(txNonce);

        const courseAuthorFundsAfterWithdrawBalance =
            await deployedMarketplace.provider.getBalance(courseAuthorAccount.address);

        const expectedAuthorFundsAfterWithdrawBalance =
            courseAuthorFundsBeforeWithdrawBalance.add(fundstoWithdraw);

        assert(
            courseAuthorFundsAfterWithdrawBalance.eq(
                expectedAuthorFundsAfterWithdrawBalance
            ),
            `The expected contract balance for the author after funds credit should be: ${courseAuthorFundsAfterWithdrawBalance}`
        );
    });

    it("Only a course author can change its recipient address with a new one", async () => {
        const accounts = await ethers.getSigners();
        const newfakeAuthorAccount = accounts[7];
        const anotherCourseId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
        await deployedMarketplace
            .connect(newfakeAuthorAccount)
            .addCourse(anotherCourseId);
        await expect(
            deployedMarketplace
                .connect(buyerAccount)
                .changeCourseAuthorAddress("0x000000000000000000000000000000000000dEaD")
        ).to.be.revertedWith("Marketplace__OnlyCourseAuthor()");
    });

    it("Change an author recipient address", async () => {
        const accounts = await ethers.getSigners();
        const newfakeAuthorAccount = accounts[7];

        await deployedMarketplace
            .connect(newfakeAuthorAccount)
            .changeCourseAuthorAddress("0x000000000000000000000000000000000000dEaD");
    });

    it("Only multisig wallet contract owners are allowed to freeze an author account otherwise it should fail with following error: OnlyContractOwner()", async () => {
        await expect(
            deployedMarketplace
                .connect(buyerAccount)
                .freezeAuthor(courseAuthorAccount.address)
        ).to.be.revertedWith("Marketplace__OnlyMultiSigWalletsOwners");
    });

    it("Freezes a given course author and try to add a new course from this one, it should fail with following error: AuthorBlacklisted()", async () => {
        //we need to make a proposal first
        //prepare payload
        var abiFragmentFreezeUser = ["function freezeAuthor(address authorAddress)"];
        var iAddOwner = new ethers.utils.Interface(abiFragmentFreezeUser);
        const payloadFreezeUser = iAddOwner.encodeFunctionData("freezeAuthor", [
            courseAuthorAccount.address,
        ]);

        //prepare tx submission to interact with marketplace contract
        await deployedMultiSigContract
            .connect(multiSigOwner1)
            .submitTx(deployedMarketplace.address, 0, payloadFreezeUser);

        const txNonce = await deployedMultiSigContract.getTransactionCount();

        //owners confirm proposal
        await deployedMultiSigContract.connect(multiSigOwner2).confirmTx(txNonce);
        await deployedMultiSigContract.connect(multiSigOwner3).confirmTx(txNonce);

        //finally executes the proposal
        await deployedMultiSigContract.connect(multiSigOwner3).executeTx(txNonce);

        const anotherCourseId = utils.keccak256(utils.toUtf8Bytes(uuidv4().toString()));
        await expect(
            deployedMarketplace.connect(courseAuthorAccount).addCourse(anotherCourseId)
        ).to.be.revertedWith("Marketplace__AuthorBlacklisted");
    });

    it("Tries to purchase a course from a blacklisted author account should fail with following error: AuthorBlacklisted()", async () => {
        const accounts = await ethers.getSigners();
        const anotherBuyerAccount = accounts[8];

        const coursePrice = "120";
        var ethExchangeRate = 0.0008642427880341;
        var finalPriceEth = Number(coursePrice) * ethExchangeRate;
        var valueToSend = ethers.utils.parseEther(finalPriceEth.toString());

        await expect(
            deployedMarketplace.connect(anotherBuyerAccount).purchaseCourse(courseId, {
                value: valueToSend,
            })
        ).to.be.revertedWith("Marketplace__AuthorBlacklisted");
    });

    it("Change an author recipient address while his/her account is frozen should fail with following error: AuthorBlacklisted()", async () => {
        await expect(
            deployedMarketplace
                .connect(courseAuthorAccount)
                .changeCourseAuthorAddress("0x000000000000000000000000000000000000dEaD")
        ).to.be.revertedWith("Marketplace__AuthorBlacklisted");
    });
});
