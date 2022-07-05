const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const Web3 = require("web3");
const keccak256 = require("keccak256");
const compileUtil = require("./compile");
const path = require("path");

var myEnv = dotenv.config();
dotenvExpand.expand(myEnv);

const baseContractName = "Marketplace";
const baseContractSolidityFile = path.resolve(
  "contracts",
  "MarketplaceContract.sol"
);
const rinkebyDefaultGas = 5000000; // Rinkeby has a lower block limit than mainnet

const CreateWeb3Connection = () => {
  return new Web3(
    new Web3.providers.WebsocketProvider(process.env.INFURA_WS_NETWORK)
  );
};

var compiledContract = null;

const getCompiledContract = () => {
  //compile contract and its dependencies
  if (compiledContract == null)
    compiledContract = compileUtil.compileContracts(baseContractSolidityFile);

  return compiledContract;
};

const getContractToDeploy = (web3) => {
  const baseContractFileName = path.basename(baseContractSolidityFile);
  var compiled = getCompiledContract();
  return compiled.contracts[baseContractFileName][baseContractName];
};

const getDeployedContract = (web3, deployedContractAddress) => {
  const baseContractFileName = path.basename(baseContractSolidityFile);
  return new web3.eth.Contract(
    getCompiledContract().contracts[baseContractFileName][baseContractName].abi,
    deployedContractAddress
  );
};

const getKeccak256HexValueFromInput = (value) => {
  return "0x" + keccak256(value).toString("hex");
};

const getSpeedupGasPrice = async (web3) => {
  var result = await web3.eth.getGasPrice();
  var valueFloat = parseFloat(result);
  gas = Math.floor(valueFloat + valueFloat * 0.5); //50% more than current gas price
  return gas.toString();
};

module.exports.defaultGas = rinkebyDefaultGas;
module.exports.Create = CreateWeb3Connection;
module.exports.getKeccak256HexValueFromInput = getKeccak256HexValueFromInput;
module.exports.getContractToDeploy = getContractToDeploy;
module.exports.getDeployedContract = getDeployedContract;
module.exports.getGas = getSpeedupGasPrice;
