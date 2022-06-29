const {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} = require("react");
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

  const _web3Api = useMemo(() => {
    return {
      web3Api: web3ApiState,
      connect: web3ApiState.provider
        ? async () => {
            try {
              await web3ApiState.provider.request({
                method: "eth_requestAccounts",
              });
            } catch (error) {
              console.log(error);
              location.reload();
            }
          }
        : () =>
            console.error(
              "Cannot connect to Metamask, try to reload your browser please."
            ),
    };
  }, [web3ApiState]);

  return (
    <Web3Context.Provider value={_web3Api}>{children}</Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}
