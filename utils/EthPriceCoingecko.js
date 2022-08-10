const URL =
    "https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false";

const fetcher = async (url) => {
    const res = await fetch(url);
    const json = await res.json();

    return json.market_data.current_price.usd ?? null;
};

async function getEthPrice() {
    const data = await fetcher(URL);

    return { eth: { data } };
}

function getItemEthPrice(coursePriceInFiat, ethPrice) {
    const itemPriceInEth = (ethPrice && (coursePriceInFiat / Number(ethPrice)).toFixed(6)) ?? null;
    return itemPriceInEth;
}

module.exports = {
    getEthPrice,
    getItemEthPrice,
};
