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
    mapping(address => Course[]) private _ownedCourses;

    mapping(uint32 => Course) private _allCourses;

    address payable private _owner;

    constructor() {
        setContractOwner(msg.sender);
    }

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

    modifier canPurchaseCourse(uint32 courseId) {
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

    function addCourse(string memory description, uint256 price)
        external
        onlyOwner
    {
        uint32 idLastCourse = getMaxCourseId() + 1;
        bytes32 descriptionHash = keccak256(
            abi.encodePacked(description, price)
        );

        Course memory existingCourse = _allCourses[idLastCourse];
        if (
            existingCourse.id > 0 &&
            existingCourse.description == descriptionHash
        ) revert CourseAlreadyExist();

        Course memory course = Course({
            id: idLastCourse,
            description: descriptionHash,
            price: price,
            state: State.Deactivated
        });

        _availableCourses.push(course);
        _allCourses[idLastCourse] = course;
    }

    function activateCourse(uint32 courseId) external onlyOwner {
        Course storage course = getCourseFromId(courseId);
        if (course.state == State.Activated) {
            revert CourseIsAlreadyActivated();
        }
        course.state = State.Activated;
    }

    function deactivateCourse(uint32 courseId) external onlyOwner {
        Course storage course = getCourseFromId(courseId);
        if (course.state == State.Deactivated) {
            revert CourseIsAlreadyDeactivated();
        }
        course.state = State.Deactivated;
    }

    function purchaseCourse(uint32 courseId)
        external
        canPurchaseCourse(courseId)
    {
        if (!hasCourseAlreadyBeenBought(msg.sender, courseId)) {
            Course memory course = getCourseFromId(courseId);
            course.state = State.Purchased;
            _ownedCourses[msg.sender].push(course);
            return;
        }

        revert CourseAlreadyBought();
    }

    function hasCourseAlreadyBeenBought(address _address, uint32 courseId)
        private
        view
        returns (bool)
    {
        Course[] memory owned = _ownedCourses[_address];
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

        Course[] memory owned = _ownedCourses[_address];
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
        returns (Course storage)
    {
        Course storage course = _allCourses[courseId];
        if (course.id > 0) {
            return course;
        } else revert("No course found");
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

//instance.activateCourse(1);
//instance.activateCourse(2);
//instance.purchaseCourse(1);

//instance.deactivateCourse(1);
//instance.purchaseCourse(1)

//instance.purchaseCourse(2)

//instance.getUserBoughtCoursesIds("0x...")

//in order to interact with other accounts:
//Marketplace.defaults({from:"0x...."})
