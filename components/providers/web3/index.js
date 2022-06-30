const { createContext, useContext, useEffect, useState } = require("react");
const { setupHooks } = require("@components/providers/web3/hooks/setupHooks");
import detectEthereumProvider from "@metamask/detect-provider";
import Web3 from "web3";

const Web3Context = createContext(null);

export default function Web3Provider({ children }) {
  const [web3ApiState, setweb3ApiState] = useState({
    provider: null,
    web3: null,
    contract: null,
    isLoading: true,
  });

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();
      if (provider) {
        const web3 = new Web3(provider);
        setweb3ApiState({
          provider: provider,
          web3: web3,
          contract: null,
          isLoading: false,
        });
      } else {
        // if the provider is not detected, detectEthereumProvider resolves to null
        console.error("Please install MetaMask!");
        setweb3ApiState({
          provider: null,
          web3: null,
          contract: null,
          isLoading: false,
        });
      }
    };
    loadProvider();
  }, []);

  async function connect() {
    if (web3ApiState.provider)
      try {
        await web3ApiState.provider.request({
          method: "eth_requestAccounts",
        });
      } catch (error) {
        const msg = "Please key in your password in MetaMask first.";
        console.error(msg, error);
        window.alert(msg);
      }
  }

  function getHooks() {
    return setupHooks(web3ApiState.web3, web3ApiState.provider);
  }

  return (
    <Web3Context.Provider value={{ web3ApiState, connect, getHooks }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3Context() {
  return useContext(Web3Context);
}
