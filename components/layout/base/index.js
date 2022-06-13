import { NavbarComponent, FooterComponent } from "@components/common"
export default function BaseLayout({ children }) {
    return (
        <>
            <div className="relative max-w-7xl mx-auto px-4">
                <NavbarComponent />

                <div className="fit">
                    {children}
                </div>
            </div>
            <FooterComponent />
        </>
    )
}