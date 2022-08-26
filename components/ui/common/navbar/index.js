import { ConnectButton } from "web3uikit";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useContext } from "react";
import EthPriceContext from "store/price-change-context";
import Web3Context from "store/contract-context";

export default function Navbar() {
    const [priceETH, setPriceETH] = useState();
    const [isAdmin, setIsAdmin] = useState();
    const priceContext = useContext(EthPriceContext.EthPriceContext);
    const web3Context = useContext(Web3Context.Web3Context);

    useEffect(() => {
        setPriceETH(priceContext?.ethPrice);
    }, [priceContext?.ethPrice]);

    useEffect(() => {
        if (web3Context) {
            setIsAdmin(web3Context.isConnectedAccountAdmin);
        }
    }, [web3Context?.isConnectedAccountAdmin]);

    return (
        <section>
            <div className="relative pt-6 px-4 sm:px-6 lg:px-8">
                <nav className="relative" aria-label="Global">
                    <div className="flex items-center justify-center">
                        <div className="px-4">
                            <Link
                                className="font-medium mr-8 text-gray-500 hover:text-gray-900"
                                href="/"
                            >
                                Marketplace
                            </Link>
                        </div>
                        <div className="px-4">
                            <Link
                                className="font-medium mr-8 text-gray-500 hover:text-gray-900"
                                href="/mycourses"
                            >
                                My courses
                            </Link>
                        </div>
                        <div className="px-4">
                            <Link
                                className="font-medium mr-8 text-gray-500 hover:text-gray-900"
                                href="/purchases"
                            >
                                My purchases
                            </Link>
                        </div>
                        <ConnectButton moralisAuth={false} />

                        <div className="px-4 flex">
                            <Image
                                src="/images/eth-icon.png"
                                alt="ethereum"
                                width="32"
                                height="32"
                            />
                            <div className="text-2xl font-bold"> {priceETH}$</div>
                        </div>
                        {isAdmin ? (
                            <div className="px-10">
                                <Link
                                    className="font-medium mr-8 text-gray-500 hover:text-gray-900"
                                    href="/admin"
                                >
                                    Administration
                                </Link>
                            </div>
                        ) : (
                            <div></div>
                        )}
                    </div>
                </nav>
            </div>
        </section>
    );
}
