import { useWeb3, Web3Provider } from "@components/providers";
import { LoginComponent } from "@components/ui/login";

export default function Navbar() {
  const web3Context = useWeb3();
  console.log(web3Context);

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
            <LoginComponent clickAction={() => web3Context.connect()} />
          </div>
        </nav>
      </div>
    </section>
  );
}
