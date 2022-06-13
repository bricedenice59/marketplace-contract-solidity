import { NavbarComponent, FooterComponent, HeroComponent, BreadCrumbsComponent } from "@components/common"
import { EthPriceDisplayComponent, WalletBarComponent } from "@components/web3"
import { CourseListComponent } from "@components/course"
import { CartComponent } from "@components/order"

export default function Home() {
  return (
    <div>
      <div className="relative bg-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4">
          <NavbarComponent />

          <div className="fit">
            <HeroComponent />

            <BreadCrumbsComponent />

            <WalletBarComponent />

            <EthPriceDisplayComponent />

            <CartComponent />

            <CourseListComponent />
          </div>
        </div>
        <FooterComponent />
      </div>
    </div >
  )
}
