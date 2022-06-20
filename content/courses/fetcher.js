const courses = require("./index.json");
const coursesOwners = require("./courseOwners.json");

const getAllCoursesOwners = () => {
    return {
        data: coursesOwners
    }
}

const getAllCoursesOwnersForContractUse = () => {
    var coursesOwners = [];
    getAllCoursesOwners().data.forEach(owner => {
        coursesOwners.push({ id: owner.id, address: owner.address, rewardPercentage: owner.rewardPercentage })
    });
    return {
        data: coursesOwners
    }
}

const getAllCourses = () => {
    return {
        data: courses
    }
}

const getAllParsedCoursesForContractUse = () => {
    var courses = [];
    getAllCourses().data.forEach(course => {
        courses.push({ id: course.id, title: course.title, price: course.price, courseOwner: course.courseOwner })
    });
    return {
        data: courses
    }
}

module.exports.getAllCourses = getAllCourses;
module.exports.getAllParsedCoursesForContractUse = getAllParsedCoursesForContractUse;
module.exports.getAllCoursesOwnersForContractUse = getAllCoursesOwnersForContractUse;