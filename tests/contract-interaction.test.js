//Tests to interact with the contract
//It is assumed that the contract MUST be deployed before being run.
const web3Utils = require('../utils/web3Utils');
const CoursesFetcher = require('../content/courses/fetcher');
const ContractInteract = require('../contractInteractions/interact');

class ContractInteractionFunctions {
    web3 = null;
    deployedContract = null;
    fromAccount = null;
    contractOwnerAccount = null;

    constructor(_deployedContractTxAddress) {
        this.web3 = web3Utils.Create();
        console.log("Connection Successfull!");
        this.web3.eth.accounts.wallet.add(process.env.CONTRACT_DEPLOYER_PRIVATE_KEY);

        this.web3.eth.accounts.wallet.add(process.env.USER1_PRIVATE_KEY);
        this.web3.eth.accounts.wallet.add(process.env.USER2_PRIVATE_KEY);
        this.web3.eth.accounts.wallet.add(process.env.USER3_PRIVATE_KEY);

        this.deployedContract = web3Utils.getDeployedContract(this.web3, _deployedContractTxAddress);
        this.fromAccount = this.web3.eth.accounts.wallet[1];
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
        var purchaseResult = await ContractInteract.purchaseCourse(this.web3, this.deployedContract, this.fromAccount, course);
        return purchaseResult;
    }

    async addNewCourseOwner(owner) {
        var adNewCourseOwnerResult = await ContractInteract.addCourseOwnerToContract(this.web3, this.deployedContract, this.contractOwnerAccount, owner);
        return adNewCourseOwnerResult;
    }

    async addNewCourse(course) {
        console.log(course);
        var createCourseOwnerResult = await ContractInteract.addCourseToContract(this.web3, this.deployedContract, this.contractOwnerAccount, course);
        return createCourseOwnerResult;
    }

    async activateCourse(course) {
        console.log(course);
        var createCourseOwnerResult = await ContractInteract.activateCourse(this.web3, this.deployedContract, this.contractOwnerAccount, course);
        return createCourseOwnerResult;
    }

    async getCoursesPricesFromContract(course) {
        console.log(course);
        var coursePrice = await ContractInteract.getCoursePrice(this.deployedContract, this.fromAccount, course);
        return coursePrice;
    }

    async getAllCoursesBoughtFromUser() {
        var listOfCoursesPurchasedResult = await ContractInteract.getUserBoughtCoursesIds(this.deployedContract, this.fromAccount);
        return listOfCoursesPurchasedResult;
    }
}

const instance = new ContractInteractionFunctions(process.env.CONTRACT_DEPLOYMENT_ADRESS);
const allOwners = instance.getAllOwnersFromJson();
const allCourses = instance.getAllCoursesFromJson();

describe('Contract interaction testing: Constructor', () => {
    it('should connect to infura and initialise correctly a contract', () => {
        expect(instance.web3).not.toBe(null);
        expect(instance.deployedContract).not.toBe(null);
    });
});

describe('Contract interaction testing: Add new course owner', () => {
    jest.setTimeout(600000);
    it('', async () => {
        for (let index = 0; index < allOwners.length; index++) {
            const owner = allOwners[index];
            const result = await instance.addNewCourseOwner(owner);
            expect(result.transactionHash).not.toBe(null);
            console.log("course owner added " + owner.id + " tx: " + result.transactionHash);
        }
    });
});

describe('Contract interaction testing: Add new course', () => {
    jest.setTimeout(600000);
    it('', async () => {
        for (let index = 0; index < allCourses.length; index++) {
            const course = allCourses[index];
            var result = await instance.addNewCourse(course);
            expect(result.transactionHash).not.toBe(null);
            console.log("new course added " + course.id + " tx: " + result.transactionHash);
        }
    });
});

describe('Contract interaction testing: get all courses prices', () => {
    jest.setTimeout(60000);
    it('courses price stored on blockchain must match the ones in input json file', async () => {
        for (let index = 0; index < allCourses.length; index++) {
            const course = allCourses[index];
            var result = await instance.getCoursesPricesFromContract(course);
            expect(result.toString()).toBe(course.price.toString());
        }
    });
});

describe('Contract interaction testing: Activate new course', () => {
    jest.setTimeout(600000);
    it('activate a newly created course from the provided json file to the contract', async () => {
        for (let index = 0; index < allCourses.length; index++) {
            const course = allCourses[index];
            var result = await instance.activateCourse(course);
            expect(result.transactionHash).not.toBe(null);
            console.log("course activated " + course.id + " tx: " + result.transactionHash);
        }
    });
});


describe('Contract interaction testing: Purchase a course', () => {
    jest.setTimeout(600000);
    it('purchase a course from the provided json file to the contract', async () => {
        for (let index = 0; index < allCourses.length; index++) {
            const course = allCourses[index];
            var result = await instance.purchaseCourse(course);
            expect(result.transactionHash).not.toBe(null);
            console.log("course purchased " + course.id + " tx: " + result.transactionHash);
        }
    });
});