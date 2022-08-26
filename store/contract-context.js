import { createContext, useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import {
    marketPlaceContractAddresses,
    multiSigWalletAddress,
    marketPlaceContractAbi,
    multiSigWalletContractAbi,
} from "@contractConstants/index";

const Web3Context = createContext({
    isWeb3Enabled: false,
    contracts: null,
    provider: null,
    chain: 1,
    isChainSupported: false,
    isConnectedAccountAdmin: false,
});

function ContractContextProvider(props) {
    const [context, setContext] = useState(null);
    const { Moralis, isWeb3Enabled, chainId, account } = useMoralis();

    function isChainIdSupported(chainIdParam) {
        if (!chainIdParam) return false;
        return chainIdParam in marketPlaceContractAddresses;
    }

    function getDeployedAddress() {
        if (!chainId) return null;
        var chainIdStr = parseInt(chainId).toString();
        if (isChainIdSupported(chainIdStr)) {
            return marketPlaceContractAddresses[chainIdStr][0];
        }
        return null;
    }

    function getMarketplaceContract() {
        const deployedAddress = getDeployedAddress();
        return getContractAt(deployedAddress, marketPlaceContractAbi);
    }
    function getMultiSigWalletContract() {
        return getContractAt(multiSigWalletAddress, multiSigWalletContractAbi);
    }

    function getContractAt(deployedAddress, abi) {
        if (!deployedAddress)
            return {
                _contract: null,
                _provider: null,
            };

        const ethers = Moralis.web3Library;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(deployedAddress, abi, signer);
        return {
            _contract: contract,
            _provider: provider,
        };
    }

    const isConnectedAccountAnAdmin = async (multiSigContract) => {
        if (!account) return false;
        try {
            const owners = await multiSigContract._contract.getOwnersAddresses();
            return owners.some((x) => x.toLowerCase() === account.toLowerCase());
        } catch (error) {
            console.error(error.message);
            return false;
        }
    };

    useEffect(() => {
        var marketplaceContract = getMarketplaceContract();
        var multiSigContract = getMultiSigWalletContract();

        isConnectedAccountAnAdmin(multiSigContract)
            .then((isAdmin) => {
                setContext({
                    isWeb3Enabled: isWeb3Enabled,
                    contracts: {
                        marketplaceContract: marketplaceContract._contract,
                        multiSigContract: multiSigContract._contract,
                    },
                    provider: marketplaceContract._provider,
                    chain: chainId,
                    isChainSupported: chainId
                        ? isChainIdSupported(parseInt(chainId).toString())
                        : false,
                    isConnectedAccountAdmin: isAdmin,
                });
            })
            .catch(console.error);
    }, [chainId, account]);

    return <Web3Context.Provider value={context}>{props.children}</Web3Context.Provider>;
}

export default { ContractContextProvider, Web3Context };
