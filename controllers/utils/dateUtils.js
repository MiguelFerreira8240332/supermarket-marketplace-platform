function getMonthRange(date = new Date()) {
    return {
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 1)
    };
}

module.exports = { getMonthRange };