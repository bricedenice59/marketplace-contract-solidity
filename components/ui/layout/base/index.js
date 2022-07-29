import { NavbarComponent, FooterComponent } from "@components/ui/common";
import { useMoralis } from "react-moralis";
import { useEffect, useState } from "react";
import { contractAddresses } from "@contractConstants/index.js";

export default function BaseLayout({ children }) {
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
        <div className="relative max-w-7xl mx-auto px-4">
            <NavbarComponent />
            {isWeb3Enabled && !isChainIdSupported ? (
                <div className="mt-5 flex flex-col items-center bg-red-400 p-4 rounded-lg ">
                    <div className="text-sm text-primary-2 font-bold">
                        Wrong network, please use Rinkeby testnet
                    </div>
                </div>
            ) : (
                <div>
                    <div className="fit">{children}</div>
                    <FooterComponent />
                </div>
            )}
        </div>
    );
}
