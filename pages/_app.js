import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import "@styles/globals.css";

function MyApp({ Component, pageProps }) {
  const Layout = Component.Layout;
  return (
    <Layout>
      <ToastContainer />
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
