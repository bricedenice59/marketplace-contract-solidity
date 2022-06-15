var path = require('path');
const sqlite3 = require('sqlite3').verbose();

const AppDAO = require('./database/MarketplaceDAO')
const MarketplaceDb = require('./database/MarketplaceDbRepository');
const { mainModule } = require('process');

var dbFilepath = path.resolve("../", "MarketplaceDatabase.db");
console.log(dbFilepath);
const dao = new AppDAO(dbFilepath);
const db = new MarketplaceDb(dao);


const contract_deployedTx = '0x1f064eeeeb2a1c7f18f621dd45125739380164e08426d2de117d983d68261a06';
db.createDatabase()
    .then(() => db.insertIntoMarketplaceContract(contract_deployedTx))
    .catch((err) => {
        console.log('Error: ')
        console.log(JSON.stringify(err))
    });
//db.closeDatabase();
