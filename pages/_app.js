import { NotificationProvider } from "web3uikit";
import { MoralisProvider } from "react-moralis";
import ContractContextProvider from "store/contract-context";
import EthPriceContextProvider from "store/price-change-context";
import { Provider } from "urql";
import { marketplaceTheGraphClient } from "store/graphql-context";
import "@styles/globals.css";

function MyApp({ Component, pageProps }) {
    const Layout = Component.Layout;
    return (
        <>
            <MoralisProvider initializeOnMount={false}>
                <Provider value={marketplaceTheGraphClient}>
                    <NotificationProvider>
                        <ContractContextProvider.ContractContextProvider>
                            <EthPriceContextProvider.EthPriceContextProvider>
                                <Layout>
                                    <Component {...pageProps} />
                                </Layout>
                            </EthPriceContextProvider.EthPriceContextProvider>
                        </ContractContextProvider.ContractContextProvider>
                    </NotificationProvider>
                </Provider>
            </MoralisProvider>
        </>
    );
}

export default MyApp;
