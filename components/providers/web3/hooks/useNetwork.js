const { useEffect, useState } = require("react");

export const handler = (web3, provider) => () => {
  const [chainId, setchainId] = useState(1);

  useEffect(() => {
    const handleAccountsChanged = async () => {
      const chain_id = await web3?.eth.getChainId();
      if (!chain_id) {
        throw new Error("Cannot retrieve network. Please refresh the browser.");
      }
      setchainId(chain_id);
    };

    provider?.on("chainChanged", handleAccountsChanged);

    //subscription cleanup
    return () => {
      provider?.removeListener("chainChanged", handleAccountsChanged);
    };
  }, [provider]);

  return {
    isChainAllowed: chainId == process.env.NEXT_PUBLIC_TARGET_CHAIN_ID,
    target: process.env.NEXT_PUBLIC_TARGET_CHAIN_ID,
  };
};
