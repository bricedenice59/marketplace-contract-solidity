// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;

contract Marketplace {
    enum State {
        NotPurchasedYet,
        Purchased,
        Activated,
        Deactivated
    }

    //That course is gonna be stored on the storage
    struct Course {
        uint32 id; // 32
        bytes32 description;
        uint256 price; // 32
        State state; // 1
    }

    Course[] _availableCourses;

    // mapping of courseHash to Course data
    mapping(address => Course[]) private ownedCourses;

    address payable private _owner;

    constructor() {
        setContractOwner(msg.sender);
    }

    error CourseAlreadyBought();
    error CourseAlreadyExist();

    /// Only owner has an access!
    error OnlyOwner();

    modifier onlyOwner() {
        if (msg.sender != _owner) {
            revert OnlyOwner();
        }
        _;
    }

    function setContractOwner(address newOwner) private {
        _owner = payable(newOwner);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        setContractOwner(newOwner);
    }

    function addCourse(string memory description, uint256 price)
        external
        onlyOwner
    {
        uint32 idLastCourse = getMaxCourseId() + 1;
        bytes32 descriptionHash = keccak256(
            abi.encodePacked(description, price)
        );

        for (uint256 i = 0; i < _availableCourses.length; i++) {
            if (_availableCourses[i].description == descriptionHash) {
                revert CourseAlreadyExist();
            }
        }

        Course memory course = Course({
            id: idLastCourse,
            description: descriptionHash,
            price: price,
            state: State.Deactivated
        });

        _availableCourses.push(course);
    }

    function purchaseCourse(uint32 courseId) external {
        if (!hasCourseAlreadyBeenBought(msg.sender, courseId)) {
            Course memory course = getCourseFromId(courseId);
            course.state = State.Purchased;
            ownedCourses[msg.sender].push(course);
            return;
        }

        revert CourseAlreadyBought();
    }

    function hasCourseAlreadyBeenBought(address _address, uint32 courseId)
        private
        view
        returns (bool)
    {
        Course[] memory owned = ownedCourses[_address];
        for (uint256 i = 0; i < owned.length; i++) {
            if (owned[i].id == courseId && owned[i].state == State.Purchased) {
                return true;
            }
        }
        return false;
    }

    function getUserBoughtCoursesIds(address _address)
        external
        view
        returns (uint32[] memory)
    {
        uint32 resultCount;

        Course[] memory owned = ownedCourses[_address];
        for (uint32 i = 0; i < owned.length; i++) {
            if (owned[i].state == State.Purchased) resultCount++;
        }

        uint32[] memory ids = new uint32[](resultCount);
        uint256 j;
        for (uint256 i = 0; i < owned.length; i++) {
            if (owned[i].state == State.Purchased) {
                ids[j] = owned[i].id;
                j++;
            }
        }

        return ids;
    }

    function getCourseFromId(uint32 courseId)
        private
        view
        returns (Course memory)
    {
        for (uint256 i = 0; i < _availableCourses.length; i++) {
            if (_availableCourses[i].id == courseId) {
                return _availableCourses[i];
            }
        }
        revert("No course found");
    }

    function getMaxCourseId() private view returns (uint32) {
        uint32 maxNumber; //default = 0

        for (uint256 i = 0; i < _availableCourses.length; i++) {
            if (_availableCourses[i].id > maxNumber) {
                maxNumber = _availableCourses[i].id;
            }
        }

        return maxNumber;
    }
}

// const instance = await Marketplace.deployed()
//instance.addCourse('Solidity for beginners', 75);
//instance.addCourse('Solidity for advanced', 120.6);
//instance.purchaseCourse(5)
//instance.purchaseCourse(3)
//instance.purchaseCourse(4)
//instance.purchaseCourse(5)
//instance.getUserBoughtCoursesIds("0x05cC6D6Db1a1b2841ccF81307E94aec57C53D854")

//in order to interact with other accounts:
//Marketplace.defaults({from:"0x...."})
