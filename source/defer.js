/**
 * @return {{promise: Promise, reject: function, resolve: function}}
 */
module.exports = function defer() {
    "use strict";

    let result = {};

    result.promise = new Promise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });

    return result;
};