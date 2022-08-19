import { BaseLayout } from "@components/ui/layout";
import { useContext } from "react";
import { useMoralis } from "react-moralis";
import { CourseListComponent } from "@components/ui/course/index";
import { HeroComponent } from "@components/ui/common/index";
import Web3Context from "store/contract-context";
import { useQuery } from "urql";
import { wformat } from "utils/stringutils";

//Fetch all courses that are activated
//exclude the ones published by the current connected account and the ones whose author is blacklisted
const allCoursesPublishedQuery = `
    query getAllActivatedCourseItems {
        courseItems(where: { 
        status: "Activated",
        author_: {address_not: "%connectedAccount"}
        })
        {
            id
            author{
                blacklistedStatus{
                    isFrozen
                }
            }
        }
    }
`;

export default function Home() {
    const web3Context = useContext(Web3Context.Web3Context);
    const { account } = useMoralis();

    const query = wformat(allCoursesPublishedQuery, { connectedAccount: `${account}` });
    const [res] = useQuery({ query: query, requestPolicy: "cache-and-network" });

    if (res.fetching)
        return <div className="text-center my-28 text-2xl text-blue-900">Loading...</div>;
    if (res.error)
        return <div className="text-center my-28 text-2xl text-blue-900">{res.error.message}</div>;

    if (!res.data || res.data.courseItems.length == 0)
        return <div className="text-center my-28 text-2xl text-blue-900">Marketplace empty :)</div>;

    var listCourses = [];
    res.data.courseItems.forEach((x) => {
        var blacklisted = false;
        blacklisted = x.author.blacklistedStatus != null && x.author.blacklistedStatus.isFrozen;
        if (!blacklisted) {
            listCourses.push(x);
        }
    });

    return (
        <div>
            <HeroComponent />
            {web3Context && web3Context.isWeb3Enabled ? (
                web3Context.isChainSupported ? (
                    <div className="py-10">
                        <section className="grid grid-cols-2 gap-6 mb-5">
                            {listCourses.map((_, i) => (
                                <div key={i}>
                                    <div>{listCourses[i].id}</div>
                                    <div className="bg-white rounded-xl shadow-md overflow-hidden md:max-w-3xl">
                                        <CourseListComponent
                                            courseId={listCourses[i].id}
                                            status={null}
                                            shouldDisplayStatus={false}
                                            shouldDisplayPrice={true}
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
