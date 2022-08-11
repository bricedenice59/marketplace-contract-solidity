import { BaseLayout } from "@components/ui/layout";
import { useMoralis } from "react-moralis";
import { useEffect, useState, useContext } from "react";
import { CourseListComponent } from "@components/ui/course/index";
import { HeroComponent } from "@components/ui/common/index";

import Web3Context from "store/contract-context";

export default function Home() {
    const web3Context = useContext(Web3Context.Web3Context);
    const { account } = useMoralis();
    const [listofAllAvailableCourses, setlistofAllAvailableCourses] = useState([]);

    const fetchAllCourses = async () => {
        var allCoursesPublished;
        if (web3Context.contract) {
            try {
                allCoursesPublished = await web3Context.contract.getAllCourses();
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
    }, [account]);

    useEffect(() => {
        if (web3Context && web3Context.isWeb3Enabled) {
            DoFetchAllPublishedCourses();
        }
    }, [web3Context]);

    return (
        <div>
            <HeroComponent />
            {web3Context && web3Context.isWeb3Enabled ? (
                web3Context.isChainSupported ? (
                    <div className="py-10">
                        <section className="grid grid-cols-2 gap-6 mb-5">
                            {listofAllAvailableCourses.map((id, i) => (
                                <div
                                    key={id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden md:max-w-3xl"
                                >
                                    <CourseListComponent
                                        courseId={id}
                                        status={null}
                                        shouldDisplayStatus={false}
                                    ></CourseListComponent>
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
