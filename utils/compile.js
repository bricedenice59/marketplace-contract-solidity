const fs = require("fs");
const solc = require("solc");
var path = require('path');

const nodeModulesPath = path.resolve("node_modules");

// returns a contract object compiled using solc
const compileContracts = (baseContractFilePath) => {
    const source = fs.readFileSync(baseContractFilePath, 'utf8');
    const input = {
        language: 'Solidity',
        sources: {
            "MarketplaceContract.sol": {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };

    const output = solc.compile(JSON.stringify(input), { import: findImports });
    return JSON.parse(output);
};

function findImports(pathImport) {
    if (path.basename(pathImport) === 'SafeMath.sol') {
        var pathLibImport = path.join(nodeModulesPath, pathImport);
        fs.access(pathLibImport, fs.F_OK, (err) => {
            if (err) {
                return { error: 'File not found' };
            }
        });
        var sourceLibImport = fs.readFileSync(pathLibImport, 'utf8');
        return {
            contents:
                sourceLibImport
        };
    }

    else return { error: 'File not found' };
}

module.exports = {
    compileContracts,
};