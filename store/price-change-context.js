import { createContext, useState, useEffect } from "react";
import { getEthPrice } from "utils/EthPriceCoingecko";

const EthPriceContext = createContext({
    ethPrice: 0,
});

function EthPriceContextProvider(props) {
    const [context, setContext] = useState();

    async function getPriceData() {
        var price;
        try {
            const getPrice = await getEthPrice();
            price = getPrice.eth.data;
        } catch (error) {
            price = "Could not fetch last price ETH/USD";
        }

        setContext({
            ethPrice: price,
        });
    }

    // function getRandomInt(min, max) {
    //     min = Math.ceil(min);
    //     max = Math.floor(max);
    //     const data = Math.floor(Math.random() * (max - min + 1)) + min;
    //     return { eth: { data } };
    // }

    // function getFakePriceData() {
    //     var price;
    //     try {
    //         const getPrice = getRandomInt(1000, 2000);
    //         price = getPrice.eth.data;
    //     } catch (error) {
    //         price = "Could not fetch last price ETH/USD";
    //     }
    //     setContext({
    //         ethPrice: price,
    //     });
    // }

    useEffect(() => {
        // retrieve only once and then retrieve every 2 min
        getPriceData();

        const intervalId = setInterval(() => {
            console.log("getting last price...");
            getPriceData();
        }, 60000); //every min
        return () => clearInterval(intervalId);
    }, []);

    return <EthPriceContext.Provider value={context}>{props.children}</EthPriceContext.Provider>;
}

export default { EthPriceContextProvider, EthPriceContext };
