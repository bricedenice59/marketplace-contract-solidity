import { Web3Provider } from "@components/providers";
import { NavbarComponent, FooterComponent } from "@components/ui/common";

export default function BaseLayout({ children }) {
  return (
    <Web3Provider>
      <div className="relative max-w-7xl mx-auto px-4">
        <NavbarComponent />

        <div className="fit">{children}</div>
      </div>
      <FooterComponent />
    </Web3Provider>
  );
}
