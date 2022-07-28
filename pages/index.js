import { BaseLayout } from "@components/ui/layout";
import { HeroComponent } from "@components/ui/common";
import { CourseListComponent } from "@components/ui/course";
import { getAllCourses } from "@content/courses/fetcher";

export default function Home({ courses }) {
    return (
        <>
            <HeroComponent />
            {JSON.stringify(courses)}
            <CourseListComponent />
        </>
    );
}

export function getStaticProps() {
    const data = getAllCourses();
    return {
        props: {
            courses: data,
        },
    };
}

Home.Layout = BaseLayout;
