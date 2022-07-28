import { NotificationProvider } from "web3uikit";
import { MoralisProvider } from "react-moralis";
import "@styles/globals.css";

function MyApp({ Component, pageProps }) {
    const Layout = Component.Layout;
    return (
        <MoralisProvider initializeOnMount={false}>
            <Layout>
                <NotificationProvider>
                    <Component {...pageProps} />
                </NotificationProvider>
            </Layout>
        </MoralisProvider>
    );
}

export default MyApp;
