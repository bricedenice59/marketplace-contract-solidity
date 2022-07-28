import { useMoralis } from "react-moralis";
import { ConnectButton } from "web3uikit";
import { useEffect, useState } from "react";
import { contractAddresses } from "@contractConstants/index.js";

export default function Navbar() {
    const { isWeb3Enabled, chainId } = useMoralis();
    const [isChainIdSupported, setIsChainIdSupported] = useState(false);

    function isChainSupported(chainIdParam) {
        return chainIdParam in contractAddresses;
    }

    useEffect(() => {
        const newChainId = parseInt(chainId).toString();
        const supported = isChainSupported(newChainId);
        setIsChainIdSupported(supported);
    }, [chainId]);

    return (
        <section>
            <div className="relative pt-6 px-4 sm:px-6 lg:px-8">
                <nav className="relative" aria-label="Global">
                    <div className="flex items-center justify-center">
                        <div>
                            <a
                                href="#"
                                className="font-medium mr-8 text-gray-500 hover:text-gray-900"
                            >
                                Product
                            </a>
                            <a
                                href="#"
                                className="font-medium mr-8 text-gray-500 hover:text-gray-900"
                            >
                                Features
                            </a>
                            <a
                                href="#"
                                className="font-medium mr-8 text-gray-500 hover:text-gray-900"
                            >
                                Marketplace
                            </a>
                        </div>
                        <div>
                            <a
                                href="#"
                                className="font-medium mr-8 text-gray-500 hover:text-gray-900"
                            >
                                Company
                            </a>
                        </div>
                        <ConnectButton moralisAuth={false} />
                        {isWeb3Enabled && !isChainIdSupported ? (
                            <div className="bg-red-400 p-4 rounded-lg">
                                <div>Wrong network, please use Rinkeby testnet</div>
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
