import { useEffect, useState, useContext } from "react";
import { useNotification } from "web3uikit";
import Web3Context from "store/contract-context";

export default function CourseStatusComponent({ courseId, statusParam }) {
    const web3Context = useContext(Web3Context.Web3Context);
    const [status, setStatus] = useState(0);
    const [isFetching, setIsFetching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const dispatch = useNotification();

    function SetButtonTextState() {
        if (isFetching) return "Loading...";
        if (isProcessing && status == 0) return "Deactivating...";
        if (isProcessing && status == 1) return "Activating...";
        if (status == 0) return "Deactivate";
        return "Activate";
    }

    const handleSuccessTxActivateDeactivate = async (tx) => {
        var txResult = await tx.wait(2);

        if (txResult.status == 1) {
            const courseStatus = await DoFetchCourseStatusFromBlockchain();
            setStatus(courseStatus);
            handleNotificationActivateDeactivateCompleted(txResult);
        }
    };

    const handleNotificationActivateDeactivateCompleted = (tx) => {
        dispatch({
            type: "info",
            message: "Course " + status == 0 ? "activated" : "deactivated",
            title: "Confirmation",
            position: "topR",
            icon: "bell",
        });
    };

    const activateDeactivateCourse = async () => {
        var tx;
        var gasPrice;
        if (!web3Context.contract || !web3Context.provider) return;

        setIsProcessing(true);
        try {
            gasPrice = await web3Context.provider.getGasPrice();
        } catch (error) {
            console.log(error);
        }

        if (status == 0) {
            try {
                tx = await web3Context.contract.deactivateCourse(courseId, {
                    gasLimit: 2100000,
                    gasPrice: gasPrice,
                });
            } catch (error) {
                console.log(error);
            }
        } else {
            try {
                tx = await web3Context.contract.activateCourse(courseId, {
                    gasLimit: 2100000,
                    gasPrice: gasPrice,
                });
            } catch (error) {
                console.log(error);
            }
        }
        if (tx) await handleSuccessTxActivateDeactivate(tx);
        setIsProcessing(false);
    };

    const fetchCourseAuthorStatus = async () => {
        var courseStatus = 1;

        // from contract :
        // enum CourseAvailabilityEnum {
        //   Activated, => 0
        //   Deactivated => 1
        // }
        if (web3Context.contract) {
            try {
                courseStatus = await web3Context.contract.getCourseStatus(courseId);
            } catch (error) {}
        }

        return parseInt(courseStatus);
    };

    async function DoFetchCourseStatusFromBlockchain() {
        setIsFetching(true);
        const courseStatus = await fetchCourseAuthorStatus();
        setStatus(courseStatus);
        setIsFetching(false);
    }

    useEffect(() => {
        var courseStatus = 1; // by default if parsing fails, return deactivated
        // from contract :
        //activated: 0x000....0;
        //deactivated: 0x000....1
        try {
            courseStatus = parseInt(statusParam);
        } catch (error) {}
        setStatus(courseStatus);
    });

    return (
        <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            disabled={isFetching || isProcessing}
            onClick={async function () {
                await activateDeactivateCourse();
            }}
        >
            {SetButtonTextState()}
            {isFetching || isProcessing ? (
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
    );
}
