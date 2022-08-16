import { BaseLayout } from "@components/ui/layout";

import { useEffect, useState, useContext } from "react";
import { CourseListComponent } from "@components/ui/course/index";
import { HeroComponent } from "@components/ui/common/index";
import Web3Context from "store/contract-context";

const allCoursesPublishedQuery = `
    query getAllActivatedCourseItems{
        courseItems(where: {status: "Activated"})  {
            id
        }
    }
`;

export default function Home() {
    const web3Context = useContext(Web3Context.Web3Context);
    const [listofAllAvailableCourses, setlistofAllAvailableCourses] = useState([]);

    const fetchAllCourses = async () => {
        var allCoursesPublished;
        if (web3Context.graphQLClient) {
            try {
                const data = await web3Context.graphQLClient
                    .query(allCoursesPublishedQuery)
                    .toPromise();
                allCoursesPublished = data.data.courseItems;
            } catch (error) {}
        }

        if (!allCoursesPublished) return [];
        return allCoursesPublished;
    };

    async function DoFetchAllPublishedCourses() {
        const allCourses = await fetchAllCourses();
        setlistofAllAvailableCourses(allCourses);
    }

    useEffect(() => {
        if (web3Context && web3Context.isWeb3Enabled) {
            DoFetchAllPublishedCourses();
        }
    });

    return (
        <div>
            <HeroComponent />
            {web3Context && web3Context.isWeb3Enabled ? (
                web3Context.isChainSupported ? (
                    <div className="py-10">
                        <section className="grid grid-cols-2 gap-6 mb-5">
                            {listofAllAvailableCourses.map((_, i) => (
                                <div key={i}>
                                    {/* <div>{listofAllAvailableCourses[i].id}</div> */}
                                    <div className="bg-white rounded-xl shadow-md overflow-hidden md:max-w-3xl">
                                        <CourseListComponent
                                            courseId={listofAllAvailableCourses[i].id}
                                            status={null}
                                            shouldDisplayStatus={false}
                                        ></CourseListComponent>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </div>
                ) : (
                    <div></div>
                )
            ) : (
                <div className="my-28 text-2xl text-center  text-blue-900">
                    Please connect an account...
                </div>
            )}
        </div>
    );
}

Home.Layout = BaseLayout;
