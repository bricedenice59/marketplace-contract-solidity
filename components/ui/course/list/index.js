const { getAllCourses } = require("@content/courses/fetcher");
import { CourseStatusComponent } from "@components/ui/course/index";
import { EthPriceDisplayComponent } from "@components/ui/web3/index";
import Link from "next/link";
import Image from "next/image";
import { imgLoader } from "utils/imgLoader";
import { useState, useEffect } from "react";
const allCourses = getAllCourses().data;

export default function CourseListComponent({
    courseId,
    courseStatus,
    shouldDisplayStatus,
    shouldDisplayPrice,
}) {
    const [course, setCourse] = useState(null);
    useEffect(() => {
        var thisCourse = allCourses.find((o) => o.id === courseId);
        setCourse(thisCourse);
    }, [courseId]);

    return (
        <div>
            {course ? (
                <div className="md:flex">
                    <div className="md:flex-shrink-0">
                        <Image
                            className="h-full w-full object-cover md:w-48"
                            loader={imgLoader}
                            src={course.coverImage}
                            alt="image"
                            width="150"
                            height="275"
                            unoptimized="true"
                        />
                    </div>
                    <div className="p-8">
                        <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                            {course.type}
                        </div>
                        <Link
                            href={{
                                pathname: `/courses/${course.slug}`,
                                query: { id: course.id },
                            }}
                        >
                            <a className="h-12 block mt-1 text-lg leading-tight font-medium text-black hover:underline">
                                {course.title}
                            </a>
                        </Link>
                        <p className="mt-2 py-5 text-gray-500">
                            {course.description?.substring(0, 70)}...
                        </p>
                        {shouldDisplayPrice ? (
                            <EthPriceDisplayComponent coursePrice={course.price} />
                        ) : (
                            <div></div>
                        )}
                    </div>
                    {shouldDisplayStatus ? (
                        <div className="p-8">
                            <CourseStatusComponent
                                courseId={course.id}
                                statusParam={courseStatus}
                            />
                        </div>
                    ) : (
                        <div></div>
                    )}
                </div>
            ) : (
                <div></div>
            )}
        </div>
    );
}
