import { NavbarComponent, FooterComponent } from "@components/ui/common";
import { useContext } from "react";
import Web3Context from "store/contract-context";
export default function BaseLayout({ children }) {
    const web3Context = useContext(Web3Context.Web3Context);

    return (
        <div className="relative max-w-7xl mx-auto px-4">
            <NavbarComponent />
            {web3Context && web3Context.isWeb3Enabled == true && !web3Context.isChainSupported ? (
                <div className="mt-5 flex flex-col items-center bg-red-400 p-4 rounded-lg ">
                    <div className="text-sm text-primary-2 font-bold">
                        Wrong network, please use Goerli testnet
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
