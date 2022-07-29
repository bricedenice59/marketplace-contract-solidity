import { BaseLayout } from "@components/ui/layout";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { contractAddresses, contractAbi } from "../contracts_constants/index";
import { useEffect, useState } from "react";

export default function Course() {
    const { chainId, isWeb3Enabled, account } = useMoralis();
    const { runContractFunction } = useWeb3Contract();
    const [listOfCoursesForAuthor, setlistOfCoursesForAuthor] = useState(false);

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
        var allCoursesPublished = 0;

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

        return allCoursesPublished;
    };

    useEffect(() => {
        if (isWeb3Enabled) {
            async function DoFetch() {
                const authorCourses = await fetchAuthorCourses();
                setlistOfCoursesForAuthor(authorCourses);
                console.log(authorCourses);
            }
            DoFetch();
        }
    }, [account]);

    return (
        <div>
            {isWeb3Enabled ? (
                getDeployedAddress() != null ? (
                    <div>{listOfCoursesForAuthor}</div>
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
