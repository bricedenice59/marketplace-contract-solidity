const { getAllCourses } = require("@content/courses/fetcher");
import { CourseStatusComponent } from "@components/ui/course/index";
const allCourses = getAllCourses().data;

export default function CourseListComponent({ courseId }) {
    var node = allCourses.find((o) => o.id === courseId);
    return (
        <div className="md:flex">
            <div className="md:flex-shrink-0">
                <img className="h-48 w-full object-cover md:w-48" src={node.coverImage} />
            </div>
            <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                    {node.type}
                </div>
                <a
                    href="#"
                    className="block mt-1 text-lg leading-tight font-medium text-black hover:underline"
                >
                    {node.title}
                </a>
                <p className="mt-2 text-gray-500">{node.description}</p>
            </div>
            <div className="p-8">
                <CourseStatusComponent courseId={node.id} />
            </div>
        </div>
    );
}
