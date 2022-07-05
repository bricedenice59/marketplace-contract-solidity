const web3Utils = require("../web3Utils");
const CoursesFetcher = require("../../content/courses/fetcher");
const ContractInteract = require("../../contractInteractions/interact");

module.exports = class ContractBase {
  web3 = null;
  deployedContract = null;
  fromAccount = null;
  contractOwnerAccount = null;

  constructor(_deployedContractTxAddress) {
    this.web3 = web3Utils.Create();
    console.log("Connection Successfull!");
    this.web3.eth.accounts.wallet.add(
      process.env.CONTRACT_DEPLOYER_PRIVATE_KEY
    );

    this.web3.eth.accounts.wallet.add(process.env.USER1_PRIVATE_KEY);
    this.web3.eth.accounts.wallet.add(process.env.USER2_PRIVATE_KEY);
    this.web3.eth.accounts.wallet.add(process.env.USER3_PRIVATE_KEY);

    this.deployedContract = web3Utils.getDeployedContract(
      this.web3,
      _deployedContractTxAddress
    );
    this.fromAccount = this.web3.eth.accounts.wallet[2];
    this.contractOwnerAccount = this.web3.eth.accounts.wallet[0];
  }

  getAllCoursesFromJson() {
    const allCourses = CoursesFetcher.getAllParsedCoursesForContractUse().data;
    for (let index = 0; index < allCourses.length; index++) {
      const course = allCourses[index];
      course.id = web3Utils.getKeccak256HexValueFromInput(course.id);
    }
    return allCourses;
  }

  getAllOwnersFromJson() {
    return CoursesFetcher.getAllCoursesOwnersForContractUse().data;
  }

  async purchaseCourse(course) {
    console.log(course);
    var purchaseResult = await ContractInteract.purchaseCourse(
      this.web3,
      this.deployedContract,
      this.fromAccount,
      course
    );
    return purchaseResult;
  }

  async addNewCourseOwner(owner) {
    var adNewCourseOwnerResult =
      await ContractInteract.addCourseOwnerToContract(
        this.web3,
        this.deployedContract,
        this.contractOwnerAccount,
        owner
      );
    return adNewCourseOwnerResult;
  }

  async addNewCourse(course) {
    console.log(course);
    var createCourseOwnerResult = await ContractInteract.addCourseToContract(
      this.web3,
      this.deployedContract,
      this.contractOwnerAccount,
      course
    );
    return createCourseOwnerResult;
  }

  async activateCourse(course) {
    console.log(course);
    var createCourseOwnerResult = await ContractInteract.activateCourse(
      this.web3,
      this.deployedContract,
      this.contractOwnerAccount,
      course
    );
    return createCourseOwnerResult;
  }

  async getCoursesPricesFromContract(course) {
    console.log(course);
    var coursePrice = await ContractInteract.getCoursePrice(
      this.deployedContract,
      this.fromAccount,
      course
    );
    return coursePrice;
  }

  async getAllCoursesBoughtFromUser() {
    var listOfCoursesPurchasedResult =
      await ContractInteract.getUserBoughtCoursesIds(
        this.deployedContract,
        this.fromAccount
      );
    return listOfCoursesPurchasedResult;
  }
};
