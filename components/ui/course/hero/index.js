import Image from "next/image";
import { imgLoader } from "utils/imgLoader";
import { useNotification } from "web3uikit";
import { useContext, useState } from "react";
import Web3Context from "store/contract-context";
import EthPriceContext from "store/price-change-context";
import { EthPriceDisplayComponent } from "@components/ui/web3/index";
import { getItemEthPrice } from "utils/EthPriceCoingecko";
import { ethers } from "ethers";

export default function CourseHeroComponent({ hasOwner, courseItem }) {
    const web3Context = useContext(Web3Context.Web3Context);
    const priceContext = useContext(EthPriceContext.EthPriceContext);
    const dispatch = useNotification();
    const [isProcessing, setIsProcessing] = useState(false);
    const [course, setCourse] = useState(courseItem);
    const [hasBeenPurchased, setHasBeenPurchased] = useState(hasOwner);

    const handleNotificationPurchaseCompleted = (tx) => {
        dispatch({
            type: "info",
            message: "Course has been purchased! Thanks :)",
            title: "Confirmation",
            position: "topR",
            icon: "bell",
        });
    };
    const handleNotificationPurchaseReverted = () => {
        dispatch({
            type: "error",
            message: "An error occured when purchasing the course",
            title: "Error",
            position: "topR",
            icon: "bell",
        });
    };

    function SetButtonTextState() {
        if (isProcessing && !hasOwner) return "Processing...";
        return "Purchase course";
    }

    const purchaseCourse = async () => {
        var tx;
        var gasPrice;
        if (!web3Context.contracts.marketplaceContract || !web3Context.provider) return;
        const contract = web3Context.contracts.marketplaceContract;
        setIsProcessing(true);
        try {
            gasPrice = await web3Context.provider.getGasPrice();
        } catch (error) {
            console.log(error);
        }

        var baseEthPrice = priceContext?.ethPrice;
        var itemPrice = getItemEthPrice(course.price, baseEthPrice);

        const valueToSend = ethers.utils.parseEther(itemPrice).toString();
        try {
            tx = await contract.purchaseCourse(course.id, {
                gasLimit: 2100000,
                gasPrice: gasPrice,
                value: valueToSend,
            });
        } catch (error) {
            console.log(error);
        }

        if (tx) {
            try {
                var txResult = await tx.wait(2);
                if (txResult.status == 1) {
                    setHasBeenPurchased(true);
                    handleNotificationPurchaseCompleted(txResult);
                }
            } catch (error) {
                handleNotificationPurchaseReverted();
            }
        }
        setIsProcessing(false);
    };

    return (
        <section>
            <div className="relative bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                        <svg
                            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
                            fill="currentColor"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <polygon points="50,0 100,0 50,100 0,100" />
                        </svg>
                        <div className="relative pt-6 px-4 sm:px-6 lg:px-8"></div>
                        <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                            <div className="sm:text-center lg:text-left">
                                {hasBeenPurchased && (
                                    <div className="text-xl inline-block p-4 py-2 rounded-full font-bold bg-green-200 text-green-700">
                                        You own this course:
                                    </div>
                                )}
                                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                                    <span className="block xl:inline">
                                        {course.title?.substring(0, course.title.length / 2)}
                                    </span>
                                    <span className="block text-indigo-600 xl:inline">
                                        {course.title?.substring(course.title.length / 2)}
                                    </span>
                                </h1>
                                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                    {course.description}
                                </p>
                                {hasBeenPurchased ? (
                                    <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                                        <div className="rounded-md shadow">
                                            <a
                                                href="#"
                                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                                            >
                                                Get started
                                            </a>
                                        </div>
                                        <div className="mt-3 sm:mt-0 sm:ml-3">
                                            <a
                                                href="#"
                                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                                            >
                                                Watch
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <EthPriceDisplayComponent coursePrice={course.price} />
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                            disabled={isProcessing}
                                            onClick={async function () {
                                                await purchaseCourse();
                                            }}
                                        >
                                            {SetButtonTextState()}
                                            {isProcessing ? (
                                                <svg
                                                    className="inline mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                                                    viewBox="0 0 100 101"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                                        fill="currentColor"
                                                    />
                                                    <path
                                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                                        fill="currentFill"
                                                    />
                                                </svg>
                                            ) : (
                                                <div></div>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
                <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
                    <Image
                        className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
                        loader={imgLoader}
                        src={course.coverImage}
                        alt="image"
                        width="600"
                        height="600"
                        unoptimized="true"
                    />
                </div>
            </div>
        </section>
    );
}
