const courses = require("./index.json");

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