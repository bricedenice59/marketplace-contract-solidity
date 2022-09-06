const fs = require("fs");
const { network, ethers } = require("hardhat");
const {
    addresses,
    ROOT_CONTRACTS_JSON,
} = require("marketplace-shared/lib/contracts/constants");
const {
    DB_SCHEMA_NAME,
    TABLE_COURSES,
    createTable,
    describeTable,
    dropTable,
    insertIntoTable,
    setDbConfig,
} = require("marketplace-shared/lib/database/harperDbUtils");
const { getAllCourses } = require("marketplace-shared/lib/frontend/courses/fetcher");

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = async function () {
    var accounts = await ethers.getSigners();
    const chainId = network.config.chainId;

    console.log("----------------------");
    console.log("Checking if a list of courses exist...");
    const courses = getAllCourses();

    if (courses.data.length === 0) {
        throw new Error(
            "No course were found, are you sure you have a list of courses available in frontend/courses/index.json?"
        );
    }

    console.log(`Found ${accounts.length} accounts`);
    for (let i = 0; i < accounts.length; i++) {
        const address = accounts[i].address;
        console.log(`Account ${i}: ${address}`);
    }

    console.log("----------------------");

    console.log("Checking if deployed address exists");

    const contractAddressesJsonFile = addresses();
    const fsRead = fs.readFileSync(contractAddressesJsonFile, "utf-8");
    const contractAddresses = JSON.parse(fsRead);
    const marketPlaceContractAddresse = contractAddresses[ROOT_CONTRACTS_JSON].find(
        (x) => x.contractname === "Marketplace" && x.chainId === chainId.toString()
    );
    if (!marketPlaceContractAddresse)
        throw new Error(
            `Marketplace contract address for chain=${chainId} could not be found`
        );

    console.log("Setting up db table...");

    setDbConfig(process.env.HARPERDB_CLOUD_ENPOINT, process.env.HARPERDB_AUTH_KEY);
    const tableExist = await describeTable(DB_SCHEMA_NAME, TABLE_COURSES);
    if (tableExist) await dropTable(DB_SCHEMA_NAME, TABLE_COURSES);

    const tableCreationSuccess = await createTable(DB_SCHEMA_NAME, TABLE_COURSES, "id");
    tableCreationSuccess
        ? console.log(`table ${TABLE_COURSES} created successfully`)
        : console.log(
              `An error occured when trying to create the table ${TABLE_COURSES}`
          );

    console.log("----------------------");
    console.log("Checks done...");

    console.log("----------------------");
    console.log("Populate marketplace contract with mock data");
    const deployedMarketplace = await ethers.getContractAt(
        "Marketplace",
        marketPlaceContractAddresse.contractAddress
    );

    console.log(
        "Add courses to marketplace contract with randomly chosen course author(s)..."
    );
    for (let i = 0; i < courses.data.length; i++) {
        const course = courses.data[i];
        const randomAccount = accounts[getRandomInt(1, accounts.length - 1)];
        console.log(
            `Adding course with id= ${course.id}; course author is ${randomAccount.address}`
        );
        const txAddCourse = await deployedMarketplace
            .connect(randomAccount)
            .addCourse(course.id);
        await txAddCourse.wait(network.config.blockConfirmationsForTransactions);
        console.log(`Course ${course.id} added!`);

        console.log("Adding course to database...");
        const recordInsertSuccess = await insertIntoTable(DB_SCHEMA_NAME, TABLE_COURSES, [
            course,
        ]);
        recordInsertSuccess
            ? console.log(`insert course ${course.id} created successfully`)
            : console.log("An error occured when trying to insert a row");
    }

    console.log("Marketplace contract and database are now populated!");
    console.log("----------------------");
};
