import { BaseLayout } from "@components/ui/layout";
import { useMoralis } from "react-moralis";
import { useContext } from "react";
import { CourseListComponent } from "@components/ui/course/index";
import Web3Context from "store/contract-context";
import { useQuery } from "urql";
import { wformat } from "utils/stringutils";

const allCoursesPublishedByAuthorQuery = `
    query getCourseItems{
        courseAuthor(id:"%authorId"){       
            publications{
                id
            }
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
        return <div className="text-center my-28 text-2xl text-blue-900">{res.error.message}</div>;

    if (!res.data || !res.data.courseAuthor || res.data.courseAuthor.publications?.length == 0)
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
                            {res.data.courseAuthor.publications.map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl shadow-md overflow-hidden md:max-w-3xl"
                                >
                                    <CourseListComponent
                                        courseId={res.data.courseAuthor.publications[i].id}
                                        courseStatus={res.data.courseAuthor.publications[i].status}
                                        shouldDisplayStatus={true}
                                        shouldDisplayPrice={false}
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
