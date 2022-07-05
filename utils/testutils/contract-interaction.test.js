//Tests to interact with the contract
//It is assumed that the contract MUST be deployed before being run.
const ContractBase = require("./contract-base");
const instance = new ContractBase(process.env.CONTRACT_DEPLOYMENT_ADRESS);
const allOwners = instance.getAllOwnersFromJson();
const allCourses = instance.getAllCoursesFromJson();

describe("Contract interaction testing: Constructor", () => {
  it("should connect to infura and initialise correctly a contract", () => {
    expect(instance.web3).not.toBe(null);
    expect(instance.deployedContract).not.toBe(null);
  });
});

describe("Contract interaction testing: Add new course owner", () => {
  jest.setTimeout(600000);
  it("", async () => {
    for (let index = 0; index < allOwners.length; index++) {
      const owner = allOwners[index];
      const result = await instance.addNewCourseOwner(owner);
      expect(result.transactionHash).not.toBe(null);
      console.log(
        "course owner added " + owner.id + " tx: " + result.transactionHash
      );
    }
  });
});

describe("Contract interaction testing: Add new course", () => {
  jest.setTimeout(600000);
  it("", async () => {
    for (let index = 0; index < allCourses.length; index++) {
      const course = allCourses[index];
      var result = await instance.addNewCourse(course);
      expect(result.transactionHash).not.toBe(null);
      console.log(
        "new course added " + course.id + " tx: " + result.transactionHash
      );
    }
  });
});

describe("Contract interaction testing: get all courses prices", () => {
  jest.setTimeout(60000);
  it("courses price stored on blockchain must match the ones in input json file", async () => {
    for (let index = 0; index < allCourses.length; index++) {
      const course = allCourses[index];
      var result = await instance.getCoursesPricesFromContract(course);
      expect(result.toString()).toBe(course.price.toString());
    }
  });
});

describe("Contract interaction testing: Activate new course", () => {
  jest.setTimeout(600000);
  it("activate a newly created course from the provided json file to the contract", async () => {
    for (let index = 0; index < allCourses.length; index++) {
      const course = allCourses[index];
      var result = await instance.activateCourse(course);
      expect(result.transactionHash).not.toBe(null);
      console.log(
        "course activated " + course.id + " tx: " + result.transactionHash
      );
    }
  });
});

describe("Contract interaction testing: Purchase a course", () => {
  jest.setTimeout(600000);
  it("purchase a course from the provided json file to the contract", async () => {
    for (let index = 0; index < allCourses.length; index++) {
      const course = allCourses[index];
      var result = await instance.purchaseCourse(course);
      expect(result.transactionHash).not.toBe(null);
      console.log(
        "course purchased " + course.id + " tx: " + result.transactionHash
      );
    }
  });
});
