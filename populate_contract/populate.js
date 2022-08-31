const { getNamedAccounts, network, ethers } = require("hardhat");
const { marketPlaceContractAddresses } = require("../contracts_constants/index");
const { getAllParsedCoursesForContractUse } = require("../content/courses/fetcher");

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
    var accounts = await ethers.getSigners();
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
        marketPlaceContractAddresses[chainId][0]
    );

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
