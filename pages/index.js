import { HeroComponent, BreadCrumbsComponent } from "@components/common"
import { EthPriceDisplayComponent, WalletBarComponent } from "@components/web3"
import { CourseListComponent } from "@components/course"
import { CartComponent } from "@components/order"
import { BaseLayout } from "@components/layout"

export default function Home() {
  return (
    <>
      <HeroComponent />
      <BreadCrumbsComponent />
      <WalletBarComponent />
      <EthPriceDisplayComponent />
      <CartComponent />
      <CourseListComponent />
    </>
  )
}

Home.Layout = BaseLayout
