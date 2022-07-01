import { useWeb3 } from "@components/providers/web3";
import { LoginComponent } from "@components/ui/login";
import { useAccount, useNetwork } from "@components/hooks/web3";
import { toast } from "react-toastify";

export default function Navbar() {
  const { connect, isLoading } = useWeb3();
  const { account } = useAccount();
  const { network } = useNetwork();

  console.log(network.network.data == 4);
  function openPlayStoreToInstallMetamask() {
    window.open("https://metamask.io/", "_blank");
  }

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
            {isLoading ? (
              <span disabled={true} onClick={connect}>
                Loading...
              </span>
            ) : !account.data ? (
              <LoginComponent clickAction={() => connect()} />
            ) : account.data ? (
              <span>{account.data}</span>
            ) : (
              <span
                onClick={() => openPlayStoreToInstallMetamask()}
                className="px-8 py-3 border rounded-md text-base font-medium text-white bg-indigo-600 hover:opacity-30"
              >
                Install Metamask
              </span>
            )}
            ({network.network.data != 4 ? toast.error("Wow so easy !") : null})
          </div>
        </nav>
      </div>
    </section>
  );
}
