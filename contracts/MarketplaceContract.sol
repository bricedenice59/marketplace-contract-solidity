// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;

// SafeMath
// The following version of SafeMath is used because this contract uses Solidity 0.8 or later (i.e. the compiler has built in overflow checks).
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeMath.sol
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Marketplace {
  // Library usage
  using SafeMath for uint256;

  // boolean to prevent reentrancy
  bool locked = false;

  address payable private contractOwner;

  enum PurchaseStatus {
    NotPurchased,
    Purchased
  }

  enum CourseAvailabilityEnum {
    Activated,
    Deactivated
  }

  struct CourseOwnerCoursesStatus {
    bytes32 id; //course id
    CourseAvailabilityEnum availability;
  }

  struct CourseOwner {
    bytes32 id;
    address _address; //A owner may (have to)/change account address
    uint8 rewardPercentage; //A course owner negotiates to earn a percentage of his course proposed price
  }

  //That course is gonna be stored on the storage
  struct Course {
    bytes32 id;
    bytes32 title;
    uint256 price;
    CourseOwner owner;
    PurchaseStatus purchaseStatus;
  }

  mapping(bytes32 => CourseOwnerCoursesStatus)
    private allCourseOwnerCoursesStatus;

  // mapping of courseHash to Course data
  mapping(address => Course[]) private _ownedCourses;

  //list of all courses stored in this contract
  mapping(bytes32 => Course) private _allCourses;

  // list of all course owners who have course stored in this contract
  mapping(bytes32 => CourseOwner) private _allCourseOwners;

  constructor() {
    setContractOwner(msg.sender);
  }

  receive() external payable {}

  error OnlyContractOwner();
  error OnlyCourseOwner();
  error CourseOwnerAddressIsSame();
  error CourseOwnerRewardPercentageOutOfBound();
  error CourseOwnerAlreadyExist();
  error CourseAlreadyBought();
  error CourseOwnerDoesNotExist();
  error CourseDoesNotExist();
  error CourseDoesAlreadyExist();
  error CourseMustBeActivated();
  error CourseIsAlreadyDeactivated();
  error CourseIsAlreadyActivated();

  //common error with funds transfer/withdrawal
  error InsufficientFunds();
  error WithdrawalFundsFailed();
  error TransferFundsFailed();

  // Modifier
  /**
   * Prevents reentrancy
   */
  modifier noReentrant() {
    require(!locked, "No re-entrancy");
    locked = true;
    _;
    locked = false;
  }

  // Modifier
  /**
   * Prevents a course to be puchased if not activated yet
   */
  modifier canPurchaseCourse(bytes32 courseId) {
    //check the status of the course set by the course owner
    CourseOwnerCoursesStatus memory courseStatus = allCourseOwnerCoursesStatus[
      courseId
    ];
    if (courseStatus.availability == CourseAvailabilityEnum.Deactivated)
      revert CourseMustBeActivated();

    //finally check for the purchase status
    Course memory course = getCourseFromId(courseId);
    if (course.purchaseStatus == PurchaseStatus.Purchased) {
      revert CourseAlreadyBought();
    }
    _;
  }

  // Modifier
  /**
   * Prevents contract interaction with someone else who is not the course owner
   */
  modifier onlyCourseOwner(bytes32 courseOwnerId) {
    //check if course owner exists, if not reject course creation
    CourseOwner memory existingOwner = _allCourseOwners[courseOwnerId];
    if (existingOwner.id == 0) revert CourseOwnerDoesNotExist();

    if (msg.sender != existingOwner._address) {
      revert OnlyCourseOwner();
    }
    _;
  }

  // Modifier
  /**
   * Prevents contract interaction with someone else who is not the contract owner
   */
  modifier onlyContractOwner() {
    if (msg.sender != contractOwner) {
      revert OnlyContractOwner();
    }
    _;
  }

  // Function
  /**
   * Get current contract owner
   */
  function getContractOwner() external view returns (address _address) {
    return contractOwner;
  }

  // Function
  /**
   * Set a new contract owner
   */
  function setContractOwner(address newContractOwner) private {
    contractOwner = payable(newContractOwner);
  }

  // Function
  /**
   * Transfer contract ownership
   */
  function transferOwnership(address newContractOwner)
    external
    onlyContractOwner
  {
    setContractOwner(newContractOwner);
  }

  // Function
  /**
   * Allows contract owner to withdraw some or all of the funds earned from purchases.
   */
  function withdrawMarketplaceFunds(uint256 amount)
    public
    onlyContractOwner
    noReentrant
  {
    /**
     * @param uint Amount to withdraw (in Wei)
     */
    uint256 contractBalance = address(this).balance;

    if (contractBalance <= amount) revert InsufficientFunds();

    (bool sent, ) = payable(msg.sender).call{value: amount}("");
    if (!sent) revert WithdrawalFundsFailed();
  }

  // Function
  /**
   * Change course's owner recipient address
   */
  //A bad actor could change course's owner recipient address to redirect funds from course purchases, hence the modifier requirement that allows only the contract owner to do it.
  //ideally, if taking full responsabilities over his account, the course owner is able change his recipient address without requiring contract owner assistance.
  function changeCourseOwnerAddress(bytes32 courseOwnerId, address newAddress)
    external
    onlyContractOwner
  {
    (address ownerCurrentAddress, ) = getCourseOwnerData(courseOwnerId);
    if (newAddress == ownerCurrentAddress) revert CourseOwnerAddressIsSame();

    CourseOwner storage existingOwner = _allCourseOwners[courseOwnerId];
    existingOwner._address = newAddress;
  }

  // Function
  /**
   * Add a new course owner with his negotiated reward percentage
   */
  function addCourseOwner(
    bytes32 courseOwnerId,
    address ownerAddress,
    uint8 rewardPercentage
  ) external onlyContractOwner {
    if (rewardPercentage > 100) revert CourseOwnerRewardPercentageOutOfBound();

    CourseOwner memory existingOwner = _allCourseOwners[courseOwnerId];
    if (existingOwner.id > 0) revert CourseOwnerAlreadyExist();

    CourseOwner memory courseOwner = CourseOwner({
      id: courseOwnerId,
      _address: ownerAddress,
      rewardPercentage: rewardPercentage
    });
    _allCourseOwners[courseOwnerId] = courseOwner;
  }

  // Function
  /**
   * Add a new course to the contract
   */
  function addCourse(
    bytes32 id,
    string memory title,
    uint32 price,
    bytes32 courseOwnerId
  ) external onlyCourseOwner(courseOwnerId) {
    bytes32 descriptionHash = keccak256(abi.encodePacked(id, title, price));

    //check if course already exist
    Course memory existingCourse = _allCourses[id];
    if (existingCourse.id > 0 && existingCourse.title == descriptionHash)
      revert CourseDoesAlreadyExist();

    CourseOwner memory existingOwner = _allCourseOwners[courseOwnerId];

    Course memory course = Course({
      id: id,
      title: descriptionHash,
      price: price,
      owner: existingOwner,
      purchaseStatus: PurchaseStatus.NotPurchased
    });

    _allCourses[id] = course;

    //activate the course by default
    CourseOwnerCoursesStatus
      memory ownerCourseStatus = CourseOwnerCoursesStatus({
        id: id,
        availability: CourseAvailabilityEnum.Activated
      });
    allCourseOwnerCoursesStatus[id] = ownerCourseStatus;
  }

  // Function
  /**
   * Activate a course, this may be necessary if it was previously deactivated
   */
  function activateCourse(bytes32 courseId) external onlyContractOwner {
    CourseOwnerCoursesStatus
      storage ownerCourseStatus = allCourseOwnerCoursesStatus[courseId];
    if (ownerCourseStatus.availability == CourseAvailabilityEnum.Activated) {
      revert CourseIsAlreadyActivated();
    }
    ownerCourseStatus.availability = CourseAvailabilityEnum.Activated;
  }

  // Function
  /**
   * Deactivate a course, this may be needed if the owner does not want to promote his course anymore
   * Course cannot be purchased anymore but must remain available for users who purchased it
   */
  function deactivateCourse(bytes32 courseId) external {
    Course storage existingCourse = _allCourses[courseId];
    if (existingCourse.id == 0) revert CourseDoesNotExist();

    CourseOwner memory existingOwner = _allCourseOwners[
      existingCourse.owner.id
    ];
    if (existingOwner.id == 0) revert CourseOwnerDoesNotExist();

    if (msg.sender != existingOwner._address) {
      revert OnlyCourseOwner();
    }

    CourseOwnerCoursesStatus
      storage ownerCourseStatus = allCourseOwnerCoursesStatus[courseId];

    if (ownerCourseStatus.availability == CourseAvailabilityEnum.Deactivated) {
      revert CourseIsAlreadyDeactivated();
    }
    ownerCourseStatus.availability = CourseAvailabilityEnum.Deactivated;
  }

  // Function
  /**
   * Retrieves the status of a course (activated or deactivated)
   */
  function getCourseStatus(bytes32 courseId)
    public
    view
    returns (CourseAvailabilityEnum status)
  {
    Course memory existingCourse = _allCourses[courseId];
    if (existingCourse.id == 0) revert CourseDoesNotExist();

    CourseOwnerCoursesStatus
      memory ownerCourseStatus = allCourseOwnerCoursesStatus[courseId];

    return ownerCourseStatus.availability;
  }

  // Function
  /**
   * Split purchase as following : The course owner is funded with a negotiated reward % of the course price, the rest left goes to the marketplace contract
   */
  function splitAmount(CourseOwner memory courseOwner, uint256 amount)
    private
    noReentrant
  {
    /**
     * @param uint Amount to transfer (in Wei)
     */
    uint256 courseOwnwerAmount = amount.mul(courseOwner.rewardPercentage).div(
      100
    );
    uint256 contractOwnwerAmount = amount - courseOwnwerAmount;

    //Transfer funds to course owner
    (bool successTransferCourseOwner, ) = courseOwner._address.call{
      value: courseOwnwerAmount
    }("");
    if (!successTransferCourseOwner) revert TransferFundsFailed();

    //Tranfer the rest to contract
    (bool successTransferContract, ) = address(this).call{
      value: contractOwnwerAmount
    }("");
    if (!successTransferContract) revert TransferFundsFailed();
  }

  // Function
  /**
   * Purchase a course (must be activated first), funds are transfered to different parties(course owner and contract owner)
   */
  function purchaseCourse(bytes32 courseId)
    external
    payable
    canPurchaseCourse(courseId)
  {
    if (msg.value <= 0) revert InsufficientFunds();

    if (!hasCourseAlreadyBeenBought(msg.sender, courseId)) {
      Course memory course = getCourseFromId(courseId);
      course.price = msg.value;
      course.purchaseStatus = PurchaseStatus.Purchased;
      //get latest update from course owner (he/she may have changed his fund's recipient address)
      CourseOwner memory courseOwner = _allCourseOwners[course.owner.id];
      course.owner = courseOwner;
      _ownedCourses[msg.sender].push(course);

      splitAmount(course.owner, course.price);
      return;
    }

    revert CourseAlreadyBought();
  }

  function getCoursePrice(bytes32 courseId)
    external
    view
    returns (uint256 price)
  {
    Course memory course = getCourseFromId(courseId);
    return course.price;
  }

  // Function
  /**
   * For a given address and course id, check if a course has already been bought
   */
  function hasCourseAlreadyBeenBought(address _address, bytes32 courseHashId)
    public
    view
    returns (bool)
  {
    Course[] memory owned = _ownedCourses[_address];
    for (uint256 i = 0; i < owned.length; i++) {
      if (
        owned[i].id == courseHashId &&
        owned[i].purchaseStatus == PurchaseStatus.Purchased
      ) return true;
    }
    return false;
  }

  // Function
  /**
   * For a given address, returns all bought courses
   */
  function getUserBoughtCoursesIds(address _address)
    external
    view
    returns (bytes32[] memory)
  {
    uint32 resultCount;

    Course[] memory owned = _ownedCourses[_address];
    for (uint32 i = 0; i < owned.length; i++) {
      if (owned[i].purchaseStatus == PurchaseStatus.Purchased) resultCount++;
    }

    bytes32[] memory ids = new bytes32[](resultCount);
    uint256 j;
    for (uint256 i = 0; i < owned.length; i++) {
      if (owned[i].purchaseStatus == PurchaseStatus.Purchased) {
        ids[j] = owned[i].id;
        j++;
      }
    }

    return ids;
  }

  // Function
  /**
   * For a given course id, returns a course object
   */
  function getCourseFromId(bytes32 courseId)
    private
    view
    returns (Course storage)
  {
    Course storage course = _allCourses[courseId];
    if (course.id > 0) {
      return course;
    }
    revert CourseDoesNotExist();
  }

  function getCourseOwnerData(bytes32 courseOwnerId)
    public
    view
    returns (address _address, uint256 rewardPercentage)
  {
    CourseOwner memory existingOwner = _allCourseOwners[courseOwnerId];
    if (existingOwner.id == 0) revert CourseOwnerDoesNotExist();
    return (existingOwner._address, existingOwner.rewardPercentage);
  }
}

//contract interaction testing
// 1. Add a new course owner with function: addCourseOwner
// 2. Add a new course with function: addCourse
// 3. Activate previously added course with function: activateCourse
// 4. Make a course purchase with function: purchaseCourse
// Check that all parties have received the funds (course owner and contract owner)

// 5. Course owner requested to change his recipient funds address, use function: changeCourseOwnerAddress
// 6. Try buying another course from that owner and check again if the new recipient address has received his funds

//Course owner id : guid = 89668047-4e15-4038-bfe3-ca48d49cefe0
//keccak-256 : 0x56e10badce74380d80504ec8a27c7c04659dbf3c681eb29331f7ff050d889dc8

// Course 1 keccak-256 : 7a01148c2ddec8a0d111c7d674f007130b4c17be41c7e392bb11acec6539d717
// Course 2 keccak-256 : 4371c95e9d6e5330b64fcdeaaf9f07de8458c2b554fa9bb14217f890e6de364f
// Course 3 keccak-256 : 50477dd0f75cca5cf8518db7062e7b9e378f467b829c26d4a0a8046683dd3654

// const instance = await Marketplace.deployed()
//instance.addCourse('0x7a01148c2ddec8a0d111c7d674f007130b4c17be41c7e392bb11acec6539d717', description: 'Solidity for beginners', price: 75, '0x56e10badce74380d80504ec8a27c7c04659dbf3c681eb29331f7ff050d889dc8');
//instance.addCourse('0x4371c95e9d6e5330b64fcdeaaf9f07de8458c2b554fa9bb14217f890e6de364f', 'Solidity for advanced', 120,'0x56e10badce74380d80504ec8a27c7c04659dbf3c681eb29331f7ff050d889dc8');
//instance.addCourse('0x50477dd0f75cca5cf8518db7062e7b9e378f467b829c26d4a0a8046683dd3654', 'Css complete course', 250, '0x56e10badce74380d80504ec8a27c7c04659dbf3c681eb29331f7ff050d889dc8');

//instance.activateCourse(0x7a01148c2ddec8a0d111c7d674f007130b4c17be41c7e392bb11acec6539d717);
//instance.activateCourse(0x4371c95e9d6e5330b64fcdeaaf9f07de8458c2b554fa9bb14217f890e6de364f);
//instance.purchaseCourse(0x4371c95e9d6e5330b64fcdeaaf9f07de8458c2b554fa9bb14217f890e6de364f);

//instance.deactivateCourse(0x7a01148c2ddec8a0d111c7d674f007130b4c17be41c7e392bb11acec6539d717);
//instance.purchaseCourse(0x7a01148c2ddec8a0d111c7d674f007130b4c17be41c7e392bb11acec6539d717)

//instance.getUserBoughtCoursesIds("0x...")

//to interact with other accounts:
//Marketplace.defaults({from:"0x...."})
