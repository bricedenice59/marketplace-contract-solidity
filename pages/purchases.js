import { BaseLayout } from "@components/ui/layout";
import { useMoralis } from "react-moralis";
import { useContext } from "react";
import { CourseListComponent } from "@components/ui/course/index";
import Web3Context from "store/contract-context";
import { useQuery } from "urql";
import { wformat } from "utils/stringutils";

const allPurchasedCoursesForCustomerQuery = `
    query getAllPurchasesForCustomer{
        purchasedItems(where: {buyer:"%customerAddress"}) {
            id
        }
    }
`;

export default function Course() {
    const web3Context = useContext(Web3Context.Web3Context);
    const { account } = useMoralis();

    const query = wformat(allPurchasedCoursesForCustomerQuery, { customerAddress: `${account}` });
    const [res] = useQuery({
        query: query,
        requestPolicy: "cache-and-network",
    });

    if (res.fetching)
        return <div className="text-center my-28 text-2xl text-blue-900">Loading...</div>;
    if (res.error)
        return <div className="text-center my-28 text-2xl text-blue-900">{res.error.message}</div>;

    if (!res.data || res.data.purchasedItems.length == 0)
        return (
            <div className="text-center my-28 text-2xl text-blue-900">
                It seems that no course have been purchased yet.
            </div>
        );

    return (
        <div>
            {web3Context && web3Context.isWeb3Enabled ? (
                web3Context.isChainSupported ? (
                    <div className="py-10">
                        <section className="grid grid-cols-2 gap-6 mb-5">
                            {res.data.purchasedItems.map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl shadow-md overflow-hidden md:max-w-3xl"
                                >
                                    <CourseListComponent
                                        courseId={res.data.purchasedItems[i].id}
                                        courseStatus={res.data.purchasedItems[i].status}
                                        shouldDisplayStatus={false}
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
