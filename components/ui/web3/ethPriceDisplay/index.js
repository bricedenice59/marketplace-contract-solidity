import { useEffect, useState, useContext } from "react";
import EthPriceContext from "store/price-change-context";
import { getItemEthPrice } from "utils/EthPriceCoingecko";
import Image from "next/image";

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
        <div>
            <div className="flex">
                <Image src="/images/eth-icon.png" alt="ethereum" width="32" height="32" />
                <div className="text-xl font-bold">
                    {" "}
                    {priceItemETH} = ${priceItemFiat}
                </div>
            </div>
        </div>
    );
}
