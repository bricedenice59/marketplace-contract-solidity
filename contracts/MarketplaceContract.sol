// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;

// SafeMath
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/** @title A marketplace contract
 *  @author Brice Grenard
 *  @notice This contract is a demo of a simple marketplace where programming courses can be promoted and sold
 *  @dev The price feed has been developped outside this contract but could obviously been added in here using Chainlink
 */
contract Marketplace {
    // Library usage
    using SafeMath for uint256;

    address payable private contractOwner;

    receive() external payable {}

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
    mapping(address => Course[]) private ownedCourses;

    //list of all courses stored in this contract
    mapping(bytes32 => Course) private allCourses;

    // list of all course owners who have course stored in this contract
    mapping(bytes32 => CourseOwner) private allCourseOwners;

    constructor() {
        setContractOwner(msg.sender);
    }

    error Marketplace__OnlyContractOwner();
    error Marketplace__OnlyCourseOwner();
    error Marketplace__CourseOwnerAddressIsSame();
    error Marketplace__CourseOwnerRewardPercentageOutOfBound();
    error Marketplace__CourseOwnerAlreadyExist();
    error Marketplace__CourseAlreadyBought();
    error Marketplace__CourseOwnerDoesNotExist();
    error Marketplace__CourseDoesNotExist();
    error Marketplace__CourseDoesAlreadyExist();
    error Marketplace__CourseMustBeActivated();
    error Marketplace__CourseIsAlreadyDeactivated();
    error Marketplace__CourseIsAlreadyActivated();

    //common error with funds transfer/withdrawal
    error Marketplace__InsufficientFunds();
    error Marketplace__WithdrawalFundsFailed();
    error Marketplace__TransferFundsFailed();

    // Modifier
    /**
     * Prevents a course to be puchased if not activated yet
     */
    modifier canPurchaseCourse(bytes32 courseId) {
        //check the status of the course set by the course owner
        CourseOwnerCoursesStatus
            memory courseStatus = allCourseOwnerCoursesStatus[courseId];
        if (courseStatus.availability == CourseAvailabilityEnum.Deactivated)
            revert Marketplace__CourseMustBeActivated();

        //finally check for the purchase status
        Course memory course = getCourseFromId(courseId);
        if (course.purchaseStatus == PurchaseStatus.Purchased) {
            revert Marketplace__CourseAlreadyBought();
        }
        _;
    }

    // Modifier
    /**
     * Prevents contract interaction with someone else who is not the contract owner
     */
    modifier onlyContractOwner() {
        if (msg.sender != contractOwner) {
            revert Marketplace__OnlyContractOwner();
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
    function withdrawMarketplaceFunds(uint256 amount) public onlyContractOwner {
        /**
         * @param uint Amount to withdraw (in Wei)
         */
        uint256 contractBalance = address(this).balance;

        if (contractBalance <= amount) revert Marketplace__InsufficientFunds();

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert Marketplace__WithdrawalFundsFailed();
    }

    // Function
    /**
     * Change course's owner recipient address
     */
    function changeCourseOwnerAddress(bytes32 courseOwnerId, address newAddress)
        external
        onlyContractOwner
    {
        (address ownerCurrentAddress, ) = getCourseOwnerData(courseOwnerId);
        if (newAddress == ownerCurrentAddress)
            revert Marketplace__CourseOwnerAddressIsSame();

        CourseOwner storage existingOwner = allCourseOwners[courseOwnerId];
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
        if (rewardPercentage > 100)
            revert Marketplace__CourseOwnerRewardPercentageOutOfBound();

        CourseOwner memory existingOwner = allCourseOwners[courseOwnerId];
        if (existingOwner.id > 0) revert Marketplace__CourseOwnerAlreadyExist();

        CourseOwner memory courseOwner = CourseOwner({
            id: courseOwnerId,
            _address: ownerAddress,
            rewardPercentage: rewardPercentage
        });
        allCourseOwners[courseOwnerId] = courseOwner;
    }

    // Function
    /**
     * Add a new course to the contract
     */
    function addCourse(
        bytes32 id,
        bytes32 title,
        uint32 price,
        bytes32 courseOwnerId
    ) external {
        CourseOwner memory existingOwner = allCourseOwners[courseOwnerId];
        if (existingOwner.id == 0)
            revert Marketplace__CourseOwnerDoesNotExist();

        if (msg.sender != existingOwner._address) {
            revert Marketplace__OnlyCourseOwner();
        }

        //check if course already exist
        Course memory existingCourse = allCourses[id];
        if (existingCourse.id > 0) revert Marketplace__CourseDoesAlreadyExist();

        Course memory course = Course({
            id: id,
            title: title,
            price: price,
            owner: existingOwner,
            purchaseStatus: PurchaseStatus.NotPurchased
        });

        allCourses[id] = course;

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
        if (
            ownerCourseStatus.availability == CourseAvailabilityEnum.Activated
        ) {
            revert Marketplace__CourseIsAlreadyActivated();
        }
        ownerCourseStatus.availability = CourseAvailabilityEnum.Activated;
    }

    // Function
    /**
     * Deactivate a course, this may be needed if the owner does not want to promote his course anymore
     * Course cannot be purchased anymore but must remain available for users who purchased it
     */
    function deactivateCourse(bytes32 courseId) external {
        Course memory existingCourse = getCourseFromId(courseId);
        CourseOwner memory existingOwner = allCourseOwners[
            existingCourse.owner.id
        ];
        if (existingOwner.id == 0)
            revert Marketplace__CourseOwnerDoesNotExist();

        if (msg.sender != existingOwner._address) {
            revert Marketplace__OnlyCourseOwner();
        }

        CourseOwnerCoursesStatus
            storage ownerCourseStatus = allCourseOwnerCoursesStatus[courseId];

        if (
            ownerCourseStatus.availability == CourseAvailabilityEnum.Deactivated
        ) {
            revert Marketplace__CourseIsAlreadyDeactivated();
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
        Course memory course = getCourseFromId(courseId);

        CourseOwnerCoursesStatus
            memory ownerCourseStatus = allCourseOwnerCoursesStatus[course.id];

        return ownerCourseStatus.availability;
    }

    // Function
    /**
     * Split purchase as following : 
     1. The course owner is funded with a negotiated reward % of the course price
     2. The rest left goes to the marketplace contract
     */
    function splitAmount(CourseOwner memory courseOwner, uint256 amount)
        private
    {
        /**
         * @param uint Amount to transfer (in Wei)
         */
        uint256 courseOwnwerAmount = amount
            .mul(courseOwner.rewardPercentage)
            .div(100);
        uint256 contractOwnwerAmount = amount - courseOwnwerAmount;

        //Transfer funds to course owner
        (bool successTransferCourseOwner, ) = courseOwner._address.call{
            value: courseOwnwerAmount
        }("");
        if (!successTransferCourseOwner)
            revert Marketplace__TransferFundsFailed();

        //Tranfer the rest to contract
        (bool successTransferContract, ) = address(this).call{
            value: contractOwnwerAmount
        }("");
        if (!successTransferContract) revert Marketplace__TransferFundsFailed();
    }

    // Function
    /**
     * Purchase a course (must be activated first)
     funds are transfered to different parties(course owner and contract owner)
     */
    function purchaseCourse(bytes32 courseId)
        external
        payable
        canPurchaseCourse(courseId)
    {
        if (msg.value < 1) revert Marketplace__InsufficientFunds();

        if (!hasCourseAlreadyBeenBought(msg.sender, courseId)) {
            Course memory course = getCourseFromId(courseId);
            course.price = msg.value;
            course.purchaseStatus = PurchaseStatus.Purchased;
            //get latest update from course owner (he/she may have changed his fund's recipient address)
            CourseOwner memory courseOwner = allCourseOwners[course.owner.id];
            course.owner = courseOwner;
            ownedCourses[msg.sender].push(course);

            splitAmount(course.owner, course.price);
            return;
        }

        revert Marketplace__CourseAlreadyBought();
    }

    function getCoursePrice(bytes32 courseId)
        external
        view
        returns (uint256 price)
    {
        return getCourseFromId(courseId).price;
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
        Course[] memory owned = ownedCourses[_address];
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

        Course[] memory owned = ownedCourses[_address];
        for (uint32 i = 0; i < owned.length; i++) {
            if (owned[i].purchaseStatus == PurchaseStatus.Purchased)
                resultCount++;
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
        returns (Course memory)
    {
        Course memory course = allCourses[courseId];
        if (course.id > 0) {
            return course;
        }
        revert Marketplace__CourseDoesNotExist();
    }

    function getCourseOwnerData(bytes32 courseOwnerId)
        public
        view
        returns (address _address, uint256 rewardPercentage)
    {
        CourseOwner memory existingOwner = allCourseOwners[courseOwnerId];
        if (existingOwner.id == 0)
            revert Marketplace__CourseOwnerDoesNotExist();
        return (existingOwner._address, existingOwner.rewardPercentage);
    }
}
