// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Marketplace {
    enum State {
        Purchased
    }

    //That course is gonna be stored on the storage
    struct Course {
        uint32 id; //32
        address owner; //20
        State courseState; //1byte
    }

    Course[] courses;

    modifier hasCourseAlreadyBeenPurchased(uint32 courseId) {
        uint32[] memory _courses = getPurchasedCourseForUser(msg.sender);
        bool found = false;
        for (uint256 i = 0; i < _courses.length; i++) {
            if (courses[i].owner == msg.sender && courses[i].id == courseId) {
                found = true;
                break;
            }
        }
        require(found == false, "course has already been bought");
        _;
    }

    function purchaseCourse(uint32 courseId)
        external
        hasCourseAlreadyBeenPurchased(courseId)
    {
        Course memory course = Course({
            id: courseId,
            owner: msg.sender,
            courseState: State.Purchased
        });
        courses.push(course);
    }

    function getPurchasedCourseForUser(address userAddress)
        public
        view
        returns (uint32[] memory)
    {
        uint32[] memory ids = new uint32[](courses.length);

        for (uint256 i = 0; i < courses.length; i++) {
            if (courses[i].owner == userAddress) {
                ids[i] = courses[i].id;
            }
        }

        return (ids);
    }
}

// const instance = await Marketplace.deployed()
//inst.purchaseCourse(5)
//inst.purchaseCourse(3)
//inst.purchaseCourse(4)
//inst.purchaseCourse(5)
//inst.getPurchasedCourseForUser("0x05cC6D6Db1a1b2841ccF81307E94aec57C53D854")

//in order to interact with other accounts:
//Marketplace.defaults({from:"0x...."})
