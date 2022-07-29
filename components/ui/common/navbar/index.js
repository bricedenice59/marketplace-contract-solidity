import { ConnectButton } from "web3uikit";
import Link from "next/link";

export default function Navbar() {
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
                    </div>
                </nav>
            </div>
        </section>
    );
}
