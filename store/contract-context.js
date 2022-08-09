import { createContext, useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import { contractAddresses, contractAbi } from "@contractConstants/index";

const Web3Context = createContext({
    isWeb3Enabled: false,
    contract: null,
    provider: null,
    chain: 1,
    isChainSupported: false,
});

function ContractContextProvider(props) {
    const [context, setContext] = useState(null);
    const { Moralis, isWeb3Enabled, chainId } = useMoralis();

    function isChainIdSupported(chainIdParam) {
        if (!chainIdParam) return false;
        return chainIdParam in contractAddresses;
    }

    function getDeployedAddress() {
        if (!chainId) return null;
        var chainIdStr = parseInt(chainId).toString();
        if (isChainIdSupported(chainIdStr)) {
            return contractAddresses[chainIdStr][0];
        }
        return null;
    }

    function getContract() {
        const deployedAddress = getDeployedAddress();
        if (!deployedAddress)
            return {
                _contract: null,
                _provider: null,
            };

        const ethers = Moralis.web3Library;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(deployedAddress, contractAbi, signer);
        return {
            _contract: contract,
            _provider: provider,
        };
    }

    useEffect(() => {
        var data = getContract();
        setContext({
            isWeb3Enabled: isWeb3Enabled,
            contract: data._contract,
            provider: data._provider,
            chain: chainId,
            isChainSupported: chainId ? isChainIdSupported(parseInt(chainId).toString()) : false,
        });
    }, [chainId]);

    return <Web3Context.Provider value={context}>{props.children}</Web3Context.Provider>;
}

export default { ContractContextProvider, Web3Context };
