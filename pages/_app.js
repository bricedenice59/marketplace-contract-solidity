import { NotificationProvider } from "web3uikit";
import { MoralisProvider } from "react-moralis";
import ContractContextProvider from "store/contract-context";
import "@styles/globals.css";

function MyApp({ Component, pageProps }) {
    const Layout = Component.Layout;
    return (
        <>
            <MoralisProvider initializeOnMount={false}>
                <NotificationProvider>
                    <ContractContextProvider.ContractContextProvider>
                        <Layout>
                            <Component {...pageProps} />
                        </Layout>
                    </ContractContextProvider.ContractContextProvider>
                </NotificationProvider>
            </MoralisProvider>
        </>
    );
}

export default MyApp;
