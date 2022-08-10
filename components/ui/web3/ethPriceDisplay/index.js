import { useEffect, useState, useContext } from "react";
import EthPriceContext from "store/price-change-context";
import { getItemEthPrice } from "utils/EthPriceCoingecko";

export default function EthPriceDisplayComponent({ coursePrice }) {
    const priceContext = useContext(EthPriceContext.EthPriceContext);
    const [priceItemETH, setPriceItemETH] = useState(0);
    const [priceItemFiat, setPriceItemFiat] = useState(0);

    useEffect(() => {
        function getPriceData() {
            var baseEthPrice = priceContext?.ethPrice;
            var itemPrice = getItemEthPrice(coursePrice, baseEthPrice);
            setPriceItemETH(itemPrice);
        }
        getPriceData();
    }, [priceContext?.ethPrice]);

    useEffect(() => {
        var baseEthPrice = priceContext?.ethPrice;
        var itemPrice = getItemEthPrice(coursePrice, baseEthPrice);
        setPriceItemFiat((itemPrice * baseEthPrice).toFixed(2));
    }, []);

    return (
        <div className="grid">
            <div className="flex flex-1 items-stretch text-center">
                <div className="p-10 border drop-shadow rounded-md">
                    <p className="text-xl text-gray-500">Price course</p>
                    <div>
                        <span className="text-2xl font-bold">
                            {priceItemETH} = {priceItemFiat}$
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
