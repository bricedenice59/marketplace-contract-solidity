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
    bool _locked = false;

    enum State {
        NotPurchasedYet,
        Purchased,
        Activated,
        Deactivated
    }

    //That course is gonna be stored on the storage
    struct Course {
        bytes32 id; // 32
        bytes32 description;
        uint256 price; // 32
        address owner;
        State state; // 1
    }

    // mapping of courseHash to Course data
    mapping(address => Course[]) private _ownedCourses;

    mapping(bytes32 => Course) private _allCourses;

    address payable private _owner;

    constructor() {
        setContractOwner(msg.sender);
    }

    receive() external payable {}

    error CourseAlreadyBought();
    error CourseAlreadyExist();
    error OnlyOwner();
    error CourseMustBeActivated();
    error CourseIsAlreadyDeactivated();
    error CourseIsAlreadyActivated();

    modifier onlyOwner() {
        if (msg.sender != _owner) {
            revert OnlyOwner();
        }
        _;
    }

    // Modifier
    /**
     * Prevents reentrancy
     */
    modifier noReentrant() {
        require(!_locked, "No re-entrancy");
        _locked = true;
        _;
        _locked = false;
    }

    modifier canPurchaseCourse(bytes32 courseId) {
        Course memory course = getCourseFromId(courseId);
        if (course.state == State.Deactivated) {
            revert CourseMustBeActivated();
        }
        _;
    }

    function setContractOwner(address newOwner) private {
        _owner = payable(newOwner);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        setContractOwner(newOwner);
    }

    function addCourse(
        bytes32 id,
        string memory description,
        uint32 price,
        address courseOwner
    ) external onlyOwner {
        bytes32 descriptionHash = keccak256(
            abi.encodePacked(id, description, price)
        );

        Course memory existingCourse = _allCourses[id];
        if (
            existingCourse.id > 0 &&
            existingCourse.description == descriptionHash
        ) revert CourseAlreadyExist();

        Course memory course = Course({
            id: id,
            description: descriptionHash,
            price: price,
            owner: courseOwner,
            state: State.Deactivated
        });

        _allCourses[id] = course;
    }

    function activateCourse(bytes32 courseId) external onlyOwner {
        Course storage course = getCourseFromId(courseId);
        if (course.state == State.Activated) {
            revert CourseIsAlreadyActivated();
        }
        course.state = State.Activated;
    }

    function deactivateCourse(bytes32 courseId) external onlyOwner {
        Course storage course = getCourseFromId(courseId);
        if (course.state == State.Deactivated) {
            revert CourseIsAlreadyDeactivated();
        }
        course.state = State.Deactivated;
    }

    function splitAmount(address recipient, uint256 amount)
        private
        noReentrant
    {
        //I want the course owner to be rewarded with 80% of the course price
        //The 20% left go to the marketplace contract owner
        uint256 courseOwnwerAmount = amount.div(5).mul(4);
        uint256 contractOwnwerAmount = amount.div(5);

        (bool successTransferCourseOwner, ) = recipient.call{
            value: courseOwnwerAmount
        }("");
        require(successTransferCourseOwner, "Transfer failed.");

        (bool successTransferContractOwner, ) = _owner.call{
            value: contractOwnwerAmount
        }("");
        require(successTransferContractOwner, "Transfer failed.");
    }

    function purchaseCourse(bytes32 courseId)
        external
        payable
        canPurchaseCourse(courseId)
    {
        require(msg.value > 0, "No Ether were sent.");

        if (!hasCourseAlreadyBeenBought(msg.sender, courseId)) {
            Course memory course = getCourseFromId(courseId);
            course.price = msg.value;
            course.state = State.Purchased;
            _ownedCourses[msg.sender].push(course);

            splitAmount(course.owner, msg.value);
            return;
        }

        revert CourseAlreadyBought();
    }

    function hasCourseAlreadyBeenBought(address _address, bytes32 courseHashId)
        private
        view
        returns (bool)
    {
        Course[] memory owned = _ownedCourses[_address];
        for (uint256 i = 0; i < owned.length; i++) {
            if (
                owned[i].id == courseHashId && owned[i].state == State.Purchased
            ) return true;
        }
        return false;
    }

    function getUserBoughtCoursesIds(address _address)
        external
        view
        returns (bytes32[] memory)
    {
        uint32 resultCount;

        Course[] memory owned = _ownedCourses[_address];
        for (uint32 i = 0; i < owned.length; i++) {
            if (owned[i].state == State.Purchased) resultCount++;
        }

        bytes32[] memory ids = new bytes32[](resultCount);
        uint256 j;
        for (uint256 i = 0; i < owned.length; i++) {
            if (owned[i].state == State.Purchased) {
                ids[j] = owned[i].id;
                j++;
            }
        }

        return ids;
    }

    function getCourseFromId(bytes32 courseId)
        private
        view
        returns (Course storage)
    {
        Course storage course = _allCourses[courseId];
        if (course.id > 0) {
            return course;
        } else revert("No course found");
    }
}

// list of guids from frotend
// Course 1 id : 97acd90d-5715-454e-a9a4-211f1a9fb4aa
// Course 2 id : b1642964-9d92-4284-9eb9-b46b522a1ef5
// Course 3 id : b8c2897c-5a8b-4e2c-89f9-53d409ef8515

// Course 1 keccak-256 : 7a01148c2ddec8a0d111c7d674f007130b4c17be41c7e392bb11acec6539d717
// Course 2 keccak-256 : 4371c95e9d6e5330b64fcdeaaf9f07de8458c2b554fa9bb14217f890e6de364f
// Course 3 keccak-256 : 50477dd0f75cca5cf8518db7062e7b9e378f467b829c26d4a0a8046683dd3654

// const instance = await Marketplace.deployed()
//instance.addCourse({id: '0x7a01148c2ddec8a0d111c7d674f007130b4c17be41c7e392bb11acec6539d717', description: 'Solidity for beginners', price: 75});
//instance.addCourse('0x4371c95e9d6e5330b64fcdeaaf9f07de8458c2b554fa9bb14217f890e6de364f', 'Solidity for advanced', 120);
//instance.addCourse('0x50477dd0f75cca5cf8518db7062e7b9e378f467b829c26d4a0a8046683dd3654', 'Css complete course', 250);

//instance.activateCourse(0x7a01148c2ddec8a0d111c7d674f007130b4c17be41c7e392bb11acec6539d717);
//instance.activateCourse(0x4371c95e9d6e5330b64fcdeaaf9f07de8458c2b554fa9bb14217f890e6de364f);
//instance.purchaseCourse(0x4371c95e9d6e5330b64fcdeaaf9f07de8458c2b554fa9bb14217f890e6de364f);

//instance.deactivateCourse(0x7a01148c2ddec8a0d111c7d674f007130b4c17be41c7e392bb11acec6539d717);
//instance.purchaseCourse(0x7a01148c2ddec8a0d111c7d674f007130b4c17be41c7e392bb11acec6539d717)

//instance.getUserBoughtCoursesIds("0x...")

//to interact with other accounts:
//Marketplace.defaults({from:"0x...."})
