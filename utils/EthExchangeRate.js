const fetch = require('node-fetch');

module.exports = async () => {
    const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD', {
        method: 'GET'
    });

    var result = await response.json();
    return result.data.rates.ETH;
}
