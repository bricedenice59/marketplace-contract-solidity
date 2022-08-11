import {
    CourseHeroComponent,
    CourseKeypointsComponent,
    CourseLecturesComponent,
} from "@components/ui/course";
const { getAllCourses } = require("@content/courses/fetcher");
import { BaseLayout } from "@components/ui/layout";
import { useRouter } from "next/router";

const allCourses = getAllCourses().data;
export default function Course() {
    const router = useRouter();
    var thisCourse = allCourses.find((o) => o.id === router.query.id);
    return (
        <div>
            {thisCourse ? (
                <div className="py-4">
                    <CourseHeroComponent
                        hasOwner={true}
                        title={thisCourse.title}
                        description={thisCourse.description}
                        image={thisCourse.coverImage}
                    />
                    <CourseKeypointsComponent points={thisCourse.wsl} />
                    <CourseLecturesComponent />{" "}
                </div>
            ) : (
                <div>There was an error trying to fetch course</div>
            )}
        </div>
    );
}

Course.Layout = BaseLayout;
