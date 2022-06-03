const MarketplaceMigration = artifacts.require("Marketplace");

module.exports = function (deployer) {
  deployer.deploy(MarketplaceMigration);
};
