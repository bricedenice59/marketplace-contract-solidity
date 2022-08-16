import { BaseLayout } from "@components/ui/layout";
import { useContext } from "react";
import { CourseListComponent } from "@components/ui/course/index";
import { HeroComponent } from "@components/ui/common/index";
import Web3Context from "store/contract-context";
import { useQuery } from "urql";

const allCoursesPublishedQuery = `
    query getAllActivatedCourseItems {
        courseItems(where: { status: "Activated" }) {
            id
        }
    }
`;

export default function Home() {
    const web3Context = useContext(Web3Context.Web3Context);
    const [res] = useQuery({ query: allCoursesPublishedQuery, requestPolicy: "cache-and-network" });

    if (res.fetching)
        return <div className="text-center my-28 text-2xl text-blue-900">Loading...</div>;
    if (res.error)
        return <div className="text-center my-28 text-2xl text-blue-900">{error.message}</div>;
    if (!res.data || res.data.courseItems.length == 0)
        return <div className="text-center my-28 text-2xl text-blue-900">MArketplace empty :)</div>;
    return (
        <div>
            <HeroComponent />
            {web3Context && web3Context.isWeb3Enabled ? (
                web3Context.isChainSupported ? (
                    <div className="py-10">
                        <section className="grid grid-cols-2 gap-6 mb-5">
                            {res.data.courseItems.map((_, i) => (
                                <div key={i}>
                                    <div>{res.data.courseItems[i].id}</div>
                                    <div className="bg-white rounded-xl shadow-md overflow-hidden md:max-w-3xl">
                                        <CourseListComponent
                                            courseId={res.data.courseItems[i].id}
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
