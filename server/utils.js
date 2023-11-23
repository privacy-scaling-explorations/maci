const whitelist = (input) => {
    // allow alphanumeric, dots, _ and - to match up to a MACI key or a file name
    if (input.toString().match(/^[0-9a-zA-Z\.\_\-]+$/)) return true;
    return false;
};

module.exports = {
    whitelist,
};
