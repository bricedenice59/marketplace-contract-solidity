// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// SafeMath
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

error Marketplace__OnlyContractOwner();
error Marketplace__OnlyCourseAuthor();
error Marketplace__CourseAuthorAddressIsSame();
error Marketplace__CourseAuthorRewardPercentageOutOfBound();
error Marketplace__CourseAuthorAlreadyExist();
error Marketplace__CourseAlreadyBought();
error Marketplace__CourseAuthorDoesNotExist();
error Marketplace__CourseDoesNotExist();
error Marketplace__CourseDoesAlreadyExist();
error Marketplace__CourseMustBeActivated();
error Marketplace__CourseIsAlreadyDeactivated();
error Marketplace__CourseIsAlreadyActivated();
error Marketplace__CannotPurchaseOwnCourse();

//common error with funds transfer/withdrawal
error Marketplace__InsufficientFunds();
error Marketplace__WithdrawalFundsFailed();
error Marketplace__TransferFundsFailed();

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

    struct CourseAuthorCoursesStatus {
        bytes32 id; //course id
        CourseAvailabilityEnum availability;
    }

    struct CourseAuthor {
        address _address; //An author may (have to)/change account address
        uint8 rewardPercentage; //A course author negotiates to earn a percentage of his course proposed price
    }

    //That course is gonna be stored on the storage
    struct Course {
        bytes32 id;
        bytes32 title;
        uint256 price;
        CourseAuthor author;
        PurchaseStatus purchaseStatus;
    }

    //list of all courses stored in this contract
    mapping(bytes32 => Course) private allCourses;

    // mapping of courseHash to Course data
    mapping(address => Course[]) private customerOwnedCourses;

    // list of all course authors who have course stored in this contract
    mapping(address => CourseAuthor) private allCourseAuthors;

    //list of all courses that a course author has published
    mapping(address => Course[]) private allCourseAuthorsPublishedCourses;

    mapping(bytes32 => CourseAuthorCoursesStatus) private allCourseAuthorsCoursesStatus;

    constructor() {
        setContractOwner(msg.sender);
    }

    /* events */
    event CourseAuthorAdded(address indexed author);
    event CourseAdded(bytes32 indexed courseId);
    event CoursePurchased(bytes32 indexed courseId);
    event CourseActivated(bytes32 indexed courseId);
    event CourseDeactivated(bytes32 indexed courseId);
    event WithdrawFunds(address indexed toAddress, bool indexed success);
    event CourseAuthorAddressChanged();

    // Modifier
    /**
     * Prevents a course to be purchased logic
     */
    modifier canPurchaseCourse(bytes32 courseId) {
        //prevents an author to buy any of his/her own courses
        Course memory course = allCourses[courseId];
        if (course.author._address == msg.sender) revert Marketplace__CannotPurchaseOwnCourse();

        //check the status of the course set by the course author
        CourseAuthorCoursesStatus memory courseStatus = allCourseAuthorsCoursesStatus[courseId];
        if (courseStatus.availability == CourseAvailabilityEnum.Deactivated)
            revert Marketplace__CourseMustBeActivated();

        //finally check for the purchase status
        if (allCourses[courseId].purchaseStatus == PurchaseStatus.Purchased) {
            revert Marketplace__CourseAlreadyBought();
        }
        _;
    }

    // Modifier
    /**
     * Prevents contract interaction with someone else who is not the contract author
     */
    modifier onlyContractOwner() {
        if (msg.sender != contractOwner) {
            revert Marketplace__OnlyContractOwner();
        }
        _;
    }

    modifier onlyAuthor() {
        CourseAuthor memory author = allCourseAuthors[msg.sender];

        if (msg.sender != author._address) {
            revert Marketplace__OnlyCourseAuthor();
        }
        _;
    }

    modifier checkCourseShouldNotExist(bytes32 courseId) {
        Course memory existingCourse = allCourses[courseId];
        if (existingCourse.id > 0) revert Marketplace__CourseDoesAlreadyExist();
        _;
    }

    modifier checkCourseShouldExist(bytes32 courseId) {
        if (allCourses[courseId].id == 0) {
            revert Marketplace__CourseDoesNotExist();
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
    function transferOwnership(address newContractOwner) external onlyContractOwner {
        setContractOwner(newContractOwner);
    }

    // Function
    /**
     * Allows contract owner to withdraw some or all of the funds earned from purchases.
     */
    function withdrawMarketplaceFunds(uint256 amount) external onlyContractOwner {
        /**
         * @param uint Amount to withdraw (in Wei)
         */
        uint256 contractBalance = address(this).balance;

        if (contractBalance <= amount) revert Marketplace__InsufficientFunds();

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        emit WithdrawFunds(address(this), sent);

        if (!sent) revert Marketplace__WithdrawalFundsFailed();
    }

    // Function
    /**
     * Change course's author recipient address
     */
    function changeCourseAuthorAddress(address newAddress) external onlyAuthor {
        CourseAuthor storage existingAuthor = allCourseAuthors[msg.sender];
        if (newAddress == existingAuthor._address) revert Marketplace__CourseAuthorAddressIsSame();

        existingAuthor._address = newAddress;
        allCourseAuthors[newAddress] = existingAuthor;

        bytes32[] memory courses = getCourseAuthorPublishedCourses(msg.sender);
        for (uint32 i = 0; i < courses.length; i++) {
            Course storage course = allCourses[courses[i]];
            course.author._address = newAddress;
        }
        emit CourseAuthorAddressChanged();
    }

    // Function
    /**
     * Add a new course author with his negotiated reward percentage
     */
    function addCourseAuthor(address courseAuthorAddress, uint8 rewardPercentage)
        external
        onlyContractOwner
    {
        if (rewardPercentage > 100) revert Marketplace__CourseAuthorRewardPercentageOutOfBound();

        CourseAuthor memory existingOwner = allCourseAuthors[courseAuthorAddress];
        if (existingOwner._address != address(0)) revert Marketplace__CourseAuthorAlreadyExist();

        CourseAuthor memory courseAuthor = CourseAuthor({
            _address: courseAuthorAddress,
            rewardPercentage: rewardPercentage
        });
        allCourseAuthors[courseAuthorAddress] = courseAuthor;
        emit CourseAuthorAdded(courseAuthorAddress);
    }

    // Function
    /**
     * Add a new course to the contract
     */
    function addCourse(
        bytes32 id,
        bytes32 title,
        uint32 price
    ) external onlyAuthor checkCourseShouldNotExist(id) {
        Course memory course = Course({
            id: id,
            title: title,
            price: price,
            author: allCourseAuthors[msg.sender],
            purchaseStatus: PurchaseStatus.NotPurchased
        });

        allCourses[id] = course;

        //activate the course by default
        CourseAuthorCoursesStatus memory AuthorCourseStatus = CourseAuthorCoursesStatus({
            id: id,
            availability: CourseAvailabilityEnum.Activated
        });
        allCourseAuthorsCoursesStatus[id] = AuthorCourseStatus;

        //finally, add the course to the list of published courses for the current author
        allCourseAuthorsPublishedCourses[msg.sender].push(course);
        emit CourseAdded(id);
    }

    // Function
    /**
     * Activate a course, this may be necessary if it was previously deactivated
     */
    function activateCourse(bytes32 courseId) external onlyAuthor checkCourseShouldExist(courseId) {
        CourseAuthorCoursesStatus storage authorCourseStatus = allCourseAuthorsCoursesStatus[
            courseId
        ];
        if (authorCourseStatus.availability == CourseAvailabilityEnum.Activated) {
            revert Marketplace__CourseIsAlreadyActivated();
        }
        authorCourseStatus.availability = CourseAvailabilityEnum.Activated;
        emit CourseActivated(courseId);
    }

    // Function
    /**
     * Deactivate a course, this may be needed if the author does not want to promote his course anymore
     * Course cannot be purchased anymore but must remain available for users who purchased it
     */
    function deactivateCourse(bytes32 courseId)
        external
        onlyAuthor
        checkCourseShouldExist(courseId)
    {
        CourseAuthorCoursesStatus storage authorCourseStatus = allCourseAuthorsCoursesStatus[
            courseId
        ];

        if (authorCourseStatus.availability == CourseAvailabilityEnum.Deactivated) {
            revert Marketplace__CourseIsAlreadyDeactivated();
        }
        authorCourseStatus.availability = CourseAvailabilityEnum.Deactivated;
        emit CourseDeactivated(courseId);
    }

    // Function
    /**
     * Retrieves the status of a course (activated or deactivated)
     */
    function getCourseStatus(bytes32 courseId)
        external
        view
        checkCourseShouldExist(courseId)
        returns (CourseAvailabilityEnum status)
    {
        CourseAuthorCoursesStatus memory authorCourseStatus = allCourseAuthorsCoursesStatus[
            courseId
        ];

        return authorCourseStatus.availability;
    }

    // Function
    /**
     * Split purchase as following : 
     1. The course author is funded with a negotiated reward % of the course price
     2. The rest left goes to the marketplace contract
     */
    function splitAmount(CourseAuthor memory courseAuthor, uint256 amount) private {
        /**
         * @param uint Amount to transfer (in Wei)
         */
        uint256 courseAuthorAmount = amount.mul(courseAuthor.rewardPercentage).div(100);
        uint256 contractOwnerAmount = amount - courseAuthorAmount;

        //Transfer funds to course author
        (bool successTransferCourseAuthor, ) = courseAuthor._address.call{
            value: courseAuthorAmount
        }("");
        if (!successTransferCourseAuthor) revert Marketplace__TransferFundsFailed();

        //Tranfer the rest to contract
        (bool successTransferContract, ) = address(this).call{value: contractOwnerAmount}("");
        if (!successTransferContract) revert Marketplace__TransferFundsFailed();
    }

    // Function
    /**
     * Purchase a course (must be activated first)
     funds are transfered to different parties(course author and contract owner)
     */
    function purchaseCourse(bytes32 courseId)
        external
        payable
        checkCourseShouldExist(courseId)
        canPurchaseCourse(courseId)
    {
        if (msg.value < 1) revert Marketplace__InsufficientFunds();

        if (!hasCourseAlreadyBeenBought(msg.sender, courseId)) {
            Course memory course = allCourses[courseId];
            course.price = msg.value;
            course.purchaseStatus = PurchaseStatus.Purchased;
            //get latest update from course author (he/she may have changed his fund's recipient address)
            course.author = allCourseAuthors[course.author._address];
            customerOwnedCourses[msg.sender].push(course);

            emit CoursePurchased(courseId);
            splitAmount(course.author, course.price);

            return;
        }

        revert Marketplace__CourseAlreadyBought();
    }

    function getCoursePrice(bytes32 courseId)
        external
        view
        checkCourseShouldExist(courseId)
        returns (uint256 price)
    {
        return allCourses[courseId].price;
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
        Course[] memory owned = customerOwnedCourses[_address];
        for (uint256 i = 0; i < owned.length; i++) {
            if (owned[i].id == courseHashId && owned[i].purchaseStatus == PurchaseStatus.Purchased)
                return true;
        }
        return false;
    }

    // Function
    /**
     * For a given address, returns all bought courses
     */
    function getUserBoughtCoursesIds(address _address) external view returns (bytes32[] memory) {
        uint32 resultCount = 0;

        Course[] memory owned = customerOwnedCourses[_address];
        if (owned.length == 0) return new bytes32[](resultCount);

        for (uint32 i = 0; i < owned.length; i++) {
            if (owned[i].purchaseStatus == PurchaseStatus.Purchased) resultCount++;
        }

        bytes32[] memory ids = new bytes32[](resultCount);
        uint256 j = 0;
        for (uint256 i = 0; i < owned.length; i++) {
            if (owned[i].purchaseStatus == PurchaseStatus.Purchased) {
                ids[j] = owned[i].id;
                j++;
            }
        }

        return ids;
    }

    function getCourseAuthorRewardPercentage(address _address)
        external
        view
        returns (uint8 rewardPercentage)
    {
        CourseAuthor memory existingAuthor = allCourseAuthors[_address];
        if (existingAuthor._address == address(0)) revert Marketplace__CourseAuthorDoesNotExist();

        return existingAuthor.rewardPercentage;
    }

    // Function
    /**
     * For a given course id, returns a course object
     */
    function getCourseFromId(bytes32 courseId)
        private
        view
        checkCourseShouldExist(courseId)
        returns (Course memory)
    {
        return allCourses[courseId];
    }

    // Function
    /**
     * For a given author address, returns a list of course object
     */
    function getCourseAuthorPublishedCourses(address authorAddress)
        public
        view
        returns (bytes32[] memory courses)
    {
        if (allCourseAuthors[authorAddress]._address == address(0))
            revert Marketplace__CourseAuthorDoesNotExist();

        Course[] memory publishedCourses = allCourseAuthorsPublishedCourses[authorAddress];
        bytes32[] memory ids = new bytes32[](publishedCourses.length);
        uint256 j;
        for (uint256 i = 0; i < publishedCourses.length; i++) {
            ids[j] = publishedCourses[i].id;
            j++;
        }
        return ids;
    }
}
