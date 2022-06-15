const sqlite3 = require('sqlite3').verbose();
const Promise = require('bluebird')

class MarketplaceDAO {
    constructor(dbFilePath) {
        this.db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                throw err;
            }
        })
    }

    run(sql) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, function (err) {
                if (err) {
                    console.log('Error running sql ' + sql)
                    console.log(err)
                    reject(err)
                } else {
                    resolve({ id: this.lastID })
                }
            });
        });
    }

    runWithParams(sql, params = []) {
        console.log(sql);
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(sql);
            params.forEach((param) => {
                console.log(param);
                stmt.run(param, (err) => {
                    if (err) {
                        console.log('Error running sql ' + sql)
                        console.log(err)
                        reject(err)
                    } else {
                        resolve({ id: this.lastID })
                    }
                });
            });
            stmt.finalize();
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.log('Error closing database ')
                throw err;
            }
        });
    }
}

module.exports = MarketplaceDAO;