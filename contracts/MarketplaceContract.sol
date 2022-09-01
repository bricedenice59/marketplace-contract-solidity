// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

// SafeMath
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

error Marketplace__AddressIsInvalid();
error Marketplace__OnlyContractOwner();
error Marketplace__OnlyMultiSigWalletsOwners();
error Marketplace__ContractRewardPercentageOutOfBound();
error Marketplace__OnlyCourseAuthor();
error Marketplace__CourseAuthorAddressIsSame();
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

//blacklist common errors
error Marketplace__AuthorBlacklisted();

/** @title A marketplace contract
 *  @author Brice Grenard
 *  @notice This contract is a demo of a simple marketplace where programming courses can be promoted and sold
 *  @dev The price feed has been developped outside this contract but could obviously been added in here using Chainlink
 */
contract Marketplace {
    // Library usage
    using SafeMath for uint256;

    address payable private contractOwner;
    uint8 private s_contractRewardPercentage;
    address private s_multiSigWallet;

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
        bool isBlacklisted;
    }

    struct Course {
        bytes32 id;
        CourseAuthor author;
        PurchaseStatus purchaseStatus;
    }

    //list of all courses stored in this contract
    mapping(bytes32 => Course) public s_allCourses;

    // mapping of courseHash to Course data
    mapping(address => Course[]) private s_customerOwnedCourses;

    // list of all course authors who have course stored in this contract
    mapping(address => CourseAuthor) private s_allCourseAuthors;

    //list of all courses that a course author has published
    mapping(address => Course[]) private s_allCourseAuthorsPublishedCourses;

    mapping(bytes32 => CourseAuthorCoursesStatus) private s_allCourseAuthorsCoursesStatus;

    constructor(uint8 contract_reward_percentage, address multiSigWallet) {
        if (multiSigWallet == address(0)) revert Marketplace__AddressIsInvalid();
        setContractOwner(msg.sender);
        s_contractRewardPercentage = contract_reward_percentage;
        s_multiSigWallet = multiSigWallet;
    }

    /* events */
    event CourseAdded(
        bytes32 indexed courseId,
        address indexed authorAddress,
        uint256 indexed timestamp
    );
    event CoursePurchased(
        bytes32 indexed courseId,
        address indexed buyer,
        uint256 indexed timestamp
    );
    event CourseActivated(bytes32 indexed courseId);
    event CourseDeactivated(bytes32 indexed courseId);
    event WithdrawFunds(address indexed toAddress, bool indexed success);
    event CourseAuthorAddressChanged(
        address indexed previousAddress,
        address indexed newAddress
    );
    event BlackListedAuthor(
        address indexed authorAddress,
        bool indexed isFrozen,
        uint256 indexed timestamp
    );

    // Modifier
    /**
     * Prevents a course to be purchased logic
     */
    modifier canPurchaseCourse(bytes32 courseId) {
        //prevents an author to buy any of his/her own courses
        Course memory course = s_allCourses[courseId];
        if (course.author._address == msg.sender)
            revert Marketplace__CannotPurchaseOwnCourse();

        //check the status of the course set by the course author
        CourseAuthorCoursesStatus memory courseStatus = s_allCourseAuthorsCoursesStatus[
            courseId
        ];
        if (courseStatus.availability == CourseAvailabilityEnum.Deactivated)
            revert Marketplace__CourseMustBeActivated();

        //finally check for the purchase status
        if (s_allCourses[courseId].purchaseStatus == PurchaseStatus.Purchased) {
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
        CourseAuthor memory author = s_allCourseAuthors[msg.sender];

        if (msg.sender != author._address) {
            revert Marketplace__OnlyCourseAuthor();
        }
        _;
    }

    modifier checkCourseShouldNotExist(bytes32 courseId) {
        Course memory existingCourse = s_allCourses[courseId];
        if (existingCourse.id > 0) revert Marketplace__CourseDoesAlreadyExist();
        _;
    }

    modifier checkCourseShouldExist(bytes32 courseId) {
        if (s_allCourses[courseId].id == 0) {
            revert Marketplace__CourseDoesNotExist();
        }
        _;
    }

    /**
     * Prevents any single owner to interact with the here-below functions decorated with this modifier
     */
    modifier onlyMultiSigWallet() {
        if (msg.sender != address(s_multiSigWallet))
            revert Marketplace__OnlyMultiSigWalletsOwners();
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
     * Internal function to set author account frozen/unfrozen
     */
    function setFreezeAuthor(address _address, bool isFrozen) private onlyMultiSigWallet {
        CourseAuthor storage existingAuthor = s_allCourseAuthors[_address];
        if (existingAuthor._address == address(0))
            revert Marketplace__CourseAuthorDoesNotExist();

        emit BlackListedAuthor(_address, isFrozen, block.timestamp);
        existingAuthor.isBlacklisted = isFrozen;
    }

    // Function
    /**
     * Freeze author account
     */
    function freezeAuthor(address authorAddress) external onlyMultiSigWallet {
        setFreezeAuthor(authorAddress, true);
    }

    // Function
    /**
     * Unfreeze author account
     */
    function unFreezeAuthor(address authorAddress) external onlyMultiSigWallet {
        setFreezeAuthor(authorAddress, false);
    }

    // Function
    /**
     * Change marketplace contract reward percentage
     * Only the contract owner(s) can interact with it
     */
    function changeContractRewardPercentage(uint8 newRewardPercentage)
        external
        onlyContractOwner
    {
        if (newRewardPercentage > 100)
            revert Marketplace__ContractRewardPercentageOutOfBound();
        s_contractRewardPercentage = newRewardPercentage;
    }

    // Function
    /**
     * Change marketplace contract reward percentage
     */
    function getContractRewardPercentage() external view returns (uint8 percentage) {
        return s_contractRewardPercentage;
    }

    // Function
    /**
     * Allows contract owners to withdraw some or all of the funds earned from purchases.
     */
    function withdrawMarketplaceFunds(address to, uint256 amount)
        external
        onlyMultiSigWallet
    {
        /**
         * @param uint Amount to withdraw (in Wei)
         */
        uint256 contractBalance = address(this).balance;

        if (contractBalance <= amount) revert Marketplace__InsufficientFunds();

        (bool sent, ) = payable(to).call{value: amount}("");
        emit WithdrawFunds(address(this), sent);

        if (!sent) revert Marketplace__WithdrawalFundsFailed();
    }

    // Function
    /**
     * Change course's author recipient address
     */
    function changeCourseAuthorAddress(address newAddress) external onlyAuthor {
        CourseAuthor storage existingAuthor = s_allCourseAuthors[msg.sender];
        if (existingAuthor.isBlacklisted) revert Marketplace__AuthorBlacklisted();
        if (newAddress == existingAuthor._address)
            revert Marketplace__CourseAuthorAddressIsSame();

        address previousAddress = existingAuthor._address;
        existingAuthor._address = newAddress;
        s_allCourseAuthors[newAddress] = existingAuthor;

        bytes32[] memory courses = getCourseAuthorPublishedCourses(msg.sender);
        for (uint32 i = 0; i < courses.length; i++) {
            Course storage course = s_allCourses[courses[i]];
            course.author._address = newAddress;
        }
        emit CourseAuthorAddressChanged(previousAddress, newAddress);
    }

    // Function
    /**
     * Add a new course to the contract
     */
    function addCourse(bytes32 id) external checkCourseShouldNotExist(id) {
        if (msg.sender == contractOwner) revert Marketplace__OnlyCourseAuthor();

        //add a new course author to the contract
        CourseAuthor memory existingOwner = s_allCourseAuthors[msg.sender];
        if (existingOwner._address == address(0)) {
            CourseAuthor memory courseAuthor = CourseAuthor({
                _address: msg.sender,
                isBlacklisted: false
            });
            s_allCourseAuthors[msg.sender] = courseAuthor;
        } else if (existingOwner.isBlacklisted) revert Marketplace__AuthorBlacklisted();

        //add a course
        Course memory course = Course({
            id: id,
            author: s_allCourseAuthors[msg.sender],
            purchaseStatus: PurchaseStatus.NotPurchased
        });

        s_allCourses[id] = course;

        //activate the course by default
        CourseAuthorCoursesStatus memory AuthorCourseStatus = CourseAuthorCoursesStatus({
            id: id,
            availability: CourseAvailabilityEnum.Activated
        });
        s_allCourseAuthorsCoursesStatus[id] = AuthorCourseStatus;

        //finally, add the course to the list of published courses for the current author
        s_allCourseAuthorsPublishedCourses[msg.sender].push(course);

        emit CourseAdded(id, msg.sender, block.timestamp);
    }

    // Function
    /**
     * Activate a course, this may be necessary if it was previously deactivated
     */
    function activateCourse(bytes32 courseId)
        external
        onlyAuthor
        checkCourseShouldExist(courseId)
    {
        CourseAuthorCoursesStatus
            storage authorCourseStatus = s_allCourseAuthorsCoursesStatus[courseId];

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
        CourseAuthorCoursesStatus
            storage authorCourseStatus = s_allCourseAuthorsCoursesStatus[courseId];

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
        public
        view
        checkCourseShouldExist(courseId)
        returns (CourseAvailabilityEnum status)
    {
        CourseAuthorCoursesStatus
            memory authorCourseStatus = s_allCourseAuthorsCoursesStatus[courseId];

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
        uint256 contractOwnerAmount = amount.mul(s_contractRewardPercentage).div(100);
        uint256 courseAuthorAmount = amount - contractOwnerAmount;

        //Transfer funds to course author
        (bool successTransferCourseAuthor, ) = courseAuthor._address.call{
            value: courseAuthorAmount
        }("");
        if (!successTransferCourseAuthor) revert Marketplace__TransferFundsFailed();

        //Tranfer the rest to contract
        (bool successTransferContract, ) = address(this).call{value: contractOwnerAmount}(
            ""
        );
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
            Course memory course = s_allCourses[courseId];
            //get author linked to that course
            course.author = s_allCourseAuthors[course.author._address];
            //prevent course being purchased if author is blacklisted
            if (course.author.isBlacklisted) revert Marketplace__AuthorBlacklisted();

            course.purchaseStatus = PurchaseStatus.Purchased;
            s_customerOwnedCourses[msg.sender].push(course);

            emit CoursePurchased(courseId, msg.sender, block.timestamp);
            splitAmount(course.author, msg.value);

            return;
        }

        revert Marketplace__CourseAlreadyBought();
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
        Course[] memory owned = s_customerOwnedCourses[_address];
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
     * For a given author address, returns a list of course object
     */
    function getCourseAuthorPublishedCourses(address authorAddress)
        public
        view
        returns (bytes32[] memory courses)
    {
        if (s_allCourseAuthors[authorAddress]._address == address(0))
            revert Marketplace__CourseAuthorDoesNotExist();

        Course[] memory publishedCourses = s_allCourseAuthorsPublishedCourses[
            authorAddress
        ];
        bytes32[] memory ids = new bytes32[](publishedCourses.length);
        uint256 j;
        for (uint256 i = 0; i < publishedCourses.length; i++) {
            ids[j] = publishedCourses[i].id;
            j++;
        }
        return ids;
    }
}
