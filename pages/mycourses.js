import { BaseLayout } from "@components/ui/layout";
import { useMoralis } from "react-moralis";
import { useContext } from "react";
import { CourseListComponent } from "@components/ui/course/index";
import Web3Context from "store/contract-context";
import { useQuery } from "urql";
import { wformat } from "utils/stringutils";

const allCoursesPublishedByAuthorQuery = `
    query getCourseItems{
        courseItems(where: { author_: {address: "%authorId"}})  {
            id
            status
        }
    }
`;

export default function Course() {
    const web3Context = useContext(Web3Context.Web3Context);
    const { account } = useMoralis();

    const query = wformat(allCoursesPublishedByAuthorQuery, { authorId: `${account}` });
    const [res] = useQuery({
        query: query,
    });

    if (res.fetching)
        return <div className="text-center my-28 text-2xl text-blue-900">Loading...</div>;
    if (res.error)
        return <div className="text-center my-28 text-2xl text-blue-900">{error.message}</div>;

    if (!res.data || res.data.courseItems.length == 0)
        return (
            <div className="text-center my-28 text-2xl text-blue-900">
                Could not find any course published yet...
            </div>
        );

    return (
        <div>
            {web3Context && web3Context.isWeb3Enabled ? (
                web3Context.isChainSupported ? (
                    <div className="py-10">
                        <section className="grid grid-cols-2 gap-6 mb-5">
                            {res.data.courseItems.map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl shadow-md overflow-hidden md:max-w-3xl"
                                >
                                    <CourseListComponent
                                        courseId={res.data.courseItems[i].id}
                                        courseStatus={res.data.courseItems[i].status}
                                        shouldDisplayStatus={true}
                                    ></CourseListComponent>
                                </div>
                            ))}
                        </section>
                    </div>
                ) : (
                    <div></div>
                )
            ) : (
                <div className="text-center my-28 text-2xl text-blue-900">
                    Please connect an account...
                </div>
            )}
        </div>
    );
}

Course.Layout = BaseLayout;
