function wformat(str, dict) {
    return str.replace(/%(\w+)/g, function (_, k) {
        return dict[k];
    });
}

module.exports = {
    wformat,
};
