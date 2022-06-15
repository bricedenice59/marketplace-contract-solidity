class MarketplaceDbRepository {

    createSqlTableMarketPlaceContract = `CREATE TABLE IF NOT EXISTS MarketplaceContract (
            DeployedAddress	TEXT NOT NULL
        );`
    createSqlTableTransactions = `CREATE TABLE IF NOT EXISTS Transactions (
        Id	INTEGER NOT NULL,
        Tx	TEXT NOT NULL,
        PRIMARY KEY('Id' AUTOINCREMENT)
    );`
    createSqlTableCourses = `CREATE TABLE IF NOT EXISTS Courses (
        Id TEXT NOT NULL UNIQUE,
        Description	TEXT NOT NULL,
        Price	INTEGER NOT NULL,
        Status NUMERIC NOT NULL,
        TxCreationId INTEGER NOT NULL,
        PRIMARY KEY('Id'),
        FOREIGN KEY('TxCreationId') REFERENCES Transactions('Id')
    );`;

    constructor(dao) {
        this.dao = dao;
    }

    createDatabase() {
        return this.dao.run(this.createSqlTableMarketPlaceContract) && this.dao.run(this.createSqlTableTransactions) && this.dao.run(this.createSqlTableCourses);
    }

    insertIntoMarketplaceContract(deployedAddress) {
        return this.dao.runWithParams(
            'INSERT INTO MarketplaceContract (DeployedAddress) VALUES (?)',
            [deployedAddress])
    }

    closeDatabase() {
        this.dao.close();
    }
}

module.exports = MarketplaceDbRepository;