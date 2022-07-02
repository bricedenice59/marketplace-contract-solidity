import useSWR from "swr";

export const handler = (web3) => () => {
  const { data, ...rest } = useSWR(
    () => (web3 ? "web3/network" : null),
    async () => {
      const chainId = await web3.eth.getChainId();

      if (!chainId) {
        throw new Error("Cannot retreive network. Please refresh the browser.");
      }

      return chainId;
    }
  );

  console.log(data);

  return {
    data,
    target: process.env.TARGET_CHAIN_ID,
    ...rest,
  };
};
