const { getNamedAccounts, network, ethers } = require("hardhat");
const { contractAddresses } = require("../contracts_constants/index");
const { getAllParsedCoursesForContractUse } = require("../content/courses/fetcher");
const { utils } = require("ethers");

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
    var accounts = await ethers.getSigners();
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    console.log("----------------------");
    console.log("Checking if a list of courses exist...");
    const courses = getAllParsedCoursesForContractUse();

    if (courses.data.length === 0) {
        throw new Error(
            "No course were found, are you sure you have a list of courses available in content/courses/index.json?"
        );
    }

    console.log(`Found ${accounts.length} accounts`);
    for (let i = 0; i < accounts.length; i++) {
        const address = accounts[i].address;
        console.log(`Account ${i}: ${address}`);
    }
    console.log("Checks done...");
    console.log("----------------------");

    console.log("----------------------");
    console.log("Populate marketplace contract");
    const deployedMarketplace = await ethers.getContractAt(
        "Marketplace",
        contractAddresses[chainId][0]
    );

    console.log("Add authors to marketplace contract...");
    for (let i = 1; i < accounts.length; i++) {
        //i = 1 because account 0 is the deployer and we don't want the deployer to addcourse, it will anyway ends up in a reverted tx
        const address = accounts[i].address;
        const courseAuthorId = utils.keccak256(utils.toUtf8Bytes(address));
        const rewardPercentage = getRandomInt(80, 95);
        console.log(
            `Adding course author ${address}; ${rewardPercentage}% funded to his/her account for every sold courses`
        );
        const txAddCourseAuthor = await deployedMarketplace.addCourseAuthor(
            courseAuthorId,
            address,
            rewardPercentage,
            { from: deployer }
        );
        await txAddCourseAuthor.wait(network.config.blockConfirmationsForTransactions);
        console.log(`Course author ${address} added!`);
    }

    console.log("Add courses to marketplace contract with randomly chosen course author(s)...");
    for (let i = 0; i < courses.data.length; i++) {
        const course = courses.data[i];
        const randomAccount = accounts[getRandomInt(1, accounts.length - 1)];
        console.log(
            `Adding course with id= ${course.id}; course author is ${randomAccount.address}`
        );
        const txAddCourse = await deployedMarketplace.connect(randomAccount).addCourse(course.id);
        await txAddCourse.wait(network.config.blockConfirmationsForTransactions);
        console.log(`Course ${course.id} added!`);
    }

    console.log("Marketplace populated!");
    console.log("----------------------");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
