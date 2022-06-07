// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

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

    function purchaseCourse(uint32 courseId) external payable {
        if (!hasCourseAlreadyBeenBought(msg.sender, courseId)) {
            Course memory course = Course({
                id: courseId,
                price: msg.value,
                state: State.Purchased
            });
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
}

// const instance = await Marketplace.deployed()
//instance.purchaseCourse(5)
//instance.purchaseCourse(3)
//instance.purchaseCourse(4)
//instance.purchaseCourse(5)
//instance.getUserBoughtCoursesIds("0x05cC6D6Db1a1b2841ccF81307E94aec57C53D854")

//in order to interact with other accounts:
//Marketplace.defaults({from:"0x...."})
