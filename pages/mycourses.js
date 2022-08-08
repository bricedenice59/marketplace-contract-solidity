import { BaseLayout } from "@components/ui/layout";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { contractAddresses, contractAbi } from "../contracts_constants/index";
import { useEffect, useState } from "react";
import { CourseListComponent } from "@components/ui/course/index";

export default function Course() {
    const { chainId, isWeb3Enabled, account } = useMoralis();
    const { runContractFunction } = useWeb3Contract();
    const [listOfCoursesForAuthor, setlistOfCoursesForAuthor] = useState([]);

    function isChainIdSupported(chainIdParam) {
        return chainIdParam in contractAddresses;
    }

    function getDeployedAddress() {
        var chainIdStr = parseInt(chainId).toString();
        if (isChainIdSupported(chainIdStr)) {
            return contractAddresses[chainIdStr][0];
        }
        return null;
    }

    const fetchAuthorCourses = async () => {
        var allCoursesPublished;

        const options = {
            abi: contractAbi,
            contractAddress: getDeployedAddress(),
            functionName: "getCourseAuthorPublishedCourses",
            params: { authorAddress: account },
        };

        try {
            allCoursesPublished = await runContractFunction({
                params: options,
            });
        } catch (error) {}

        if (!allCoursesPublished) return [];
        return allCoursesPublished;
    };

    useEffect(() => {
        if (isWeb3Enabled) {
            async function DoFetch() {
                const authorCourses = await fetchAuthorCourses();
                setlistOfCoursesForAuthor(authorCourses);
            }
            DoFetch();
        }
    }, [account]);

    return (
        <div>
            {isWeb3Enabled ? (
                getDeployedAddress() != null ? (
                    <div className="py-10">
                        <section className="grid grid-cols-2 gap-6 mb-5">
                            {listOfCoursesForAuthor.map((id, i) => (
                                <div
                                    key={id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden md:max-w-3xl"
                                >
                                    <CourseListComponent courseId={id}></CourseListComponent>
                                </div>
                            ))}
                        </section>
                        {/* <CourseListComponent listCourseIds={listOfCoursesForAuthor} /> */}
                    </div>
                ) : (
                    <div></div>
                )
            ) : (
                <div>Please connect an account...</div>
            )}
        </div>
    );
}

Course.Layout = BaseLayout;
