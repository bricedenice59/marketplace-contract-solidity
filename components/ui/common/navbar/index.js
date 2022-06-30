import { useWeb3Context } from "@components/providers/web3";
import { LoginComponent } from "@components/ui/login";

export default function Navbar() {
  const { web3ApiState, connect, getHooks } = useWeb3Context();
  const { account } = getHooks().useAccount();

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
            {web3ApiState.web3 && !account ? (
              <LoginComponent clickAction={() => connect()} />
            ) : web3ApiState.web3 && account ? (
              <span>{account}</span>
            ) : (
              <span
                onClick={() => openPlayStoreToInstallMetamask()}
                className="px-8 py-3 border rounded-md text-base font-medium text-white bg-indigo-600 hover:opacity-30"
              >
                Install Metamask
              </span>
            )}
          </div>
        </nav>
      </div>
    </section>
  );
}
