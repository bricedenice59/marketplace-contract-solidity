const {
    DB_SCHEMA_NAME,
    TABLE_DEPLOYED_ADDRESSES_ABIS_NAME,
    createSchema,
    createTable,
    dropSchema,
    insertIntoTable,
    describeSchema,
    setDbConfig,
} = require("marketplace-shared/lib/database/harperDbUtils");
const { addresses, abis } = require("marketplace-shared/lib/contracts/constants");
const fs = require("fs");

module.exports = async function () {
    setDbConfig(process.env.HARPERDB_CLOUD_ENPOINT, process.env.HARPERDB_AUTH_KEY);
    const schemaExist = await describeSchema(DB_SCHEMA_NAME);
    if (schemaExist) await dropSchema(DB_SCHEMA_NAME);

    const schemaCreationSuccess = await createSchema(DB_SCHEMA_NAME);
    schemaCreationSuccess
        ? console.log(`schema ${DB_SCHEMA_NAME} created successfully`)
        : console.log("An error occured when trying to create the schema");

    const tableCreationSuccess = await createTable(
        DB_SCHEMA_NAME,
        TABLE_DEPLOYED_ADDRESSES_ABIS_NAME,
        "id"
    );
    tableCreationSuccess
        ? console.log(`table ${TABLE_DEPLOYED_ADDRESSES_ABIS_NAME} created successfully`)
        : console.log(
              `An error occured when trying to create the table ${TABLE_DEPLOYED_ADDRESSES_ABIS_NAME}`
          );

    const contractAbisJsonFile = abis();
    const fsReadAbis = fs.readFileSync(contractAbisJsonFile, "utf-8");
    const contractAbis = JSON.parse(fsReadAbis);

    const contractAddressesJsonFile = addresses();
    const fsReadContractAddresses = fs.readFileSync(contractAddressesJsonFile, "utf-8");
    const contractAddresses = JSON.parse(fsReadContractAddresses);

    for (
        let contractIndex = 0;
        contractIndex < contractAddresses.contracts.length;
        contractIndex++
    ) {
        const contract = contractAddresses.contracts[contractIndex];
        const _contractName = contract.contractname;
        const _contractChain = contract.chainId;
        const _contractAddress = contract.contractAddress;

        const contractAbiFound = contractAbis.abis.find(
            (x) => x.contractname === _contractName && x.chainId === _contractChain
        );
        if (!contractAbiFound)
            throw new Error(
                `Contract ABI for the contract name = ${contractName} could not be found`
            );

        const recordInsertSuccess = await insertIntoTable(
            DB_SCHEMA_NAME,
            TABLE_DEPLOYED_ADDRESSES_ABIS_NAME,
            (jsonContent = [
                {
                    contractname: _contractName,
                    chainId: _contractChain,
                    contractAddress: _contractAddress,
                    abi: contractAbiFound.contractAbi,
                },
            ])
        );
        recordInsertSuccess
            ? console.log(
                  `insert contract ${_contractName} with address ${_contractAddress} deployed on chain ${_contractChain} created successfully`
              )
            : console.log("An error occured when trying to insert a row");
    }
};
