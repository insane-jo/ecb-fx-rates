const request = require('request');
const xml2json = require('xml2json');
const defer = require('./defer');


/**
 * @typedef {number} FormattedDate
 * @description ms of start of the day
 */

/**
 * @typedef {{}} fxRateOpts
 * @property {boolean} [exactDate=false] if true - returns only date, that asked, else - returns exchange rate from the last nearest date if no data
 * @property {Date} [date=new Date()] - date for get historical exchange rates
 * @property {string} currency
 * @property {boolean} [ignoreCache=false]
 * @property {boolean} [dontStoreCache=false]
 */

/**
 * @callback GetFxRateCallback
 * @param {?err} error
 * @param {?number} data
 */

/**
 * @typedef {Object<string, number>} fxRateData
 */

const URL_90_DAYS = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml';
const URL_ALL_DATA = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml';
const URL_CURRENT_DATE = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const UPLOAD_PROMISES = {
    /**
     * Promise to get for 90 days
     */
    90: null,

    /**
     * Promise to get data for current date
     */
    1: null,

    /**
     * Promise for get all data
     */
    0: null
};

/**
 * @type {Object<FormattedDate, fxRateData>}
 */
const UPLOADED_RATES_CACHE = {};

/**
 * @param {Date} d
 * @param {boolean} [returnMS=false]
 * @return {Date|Number}
 */
function roundDate(d, returnMS) {
    "use strict";

    if (!(d instanceof Date)) {
        d = new Date(d);
    }

    let dTime = d.getTime();
    let roundedMs = dTime - dTime % MS_IN_DAY;

    if (returnMS) {
        return roundedMs;
    } else {
        return new Date(roundedMs);
    }
}

/**
 * Get foreign exchange rate
 * @param {fxRateOpts|string} optsOrTicker
 * @param {GetFxRateCallback} [cb]
 * @returns Promise<number>
 */
module.exports = function getFxRate(optsOrTicker, cb) {
    "use strict";

    let date, isCurrentDate, currency, dateMs;

    if (typeof optsOrTicker === 'string') {
        currency = optsOrTicker;
        date = new Date();
        isCurrentDate = true;
    } else {
        date = optsOrTicker.date || new Date();
        isCurrentDate = !optsOrTicker.date;
        currency = optsOrTicker.currency;
    }

    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    date = roundDate(date);
    dateMs = date.getTime();

    let resultDefer; // = defer();
    let getDataFromCache;
    let keyFromCache;

    if (optsOrTicker.ignoreCache) {
        getDataFromCache = false;
    } else {
        getDataFromCache = !!UPLOADED_RATES_CACHE[dateMs];

        if (!getDataFromCache && !optsOrTicker.exactDate) {
            let msKeys = Object.keys(UPLOADED_RATES_CACHE).sort((a, b) => b - a);
            let lastKey = msKeys[0];
            msKeys = msKeys.map((x) => +(x)).filter((x) => x < dateMs);
            if (msKeys[0] != lastKey) {
                getDataFromCache = UPLOADED_RATES_CACHE[msKeys[0]];
                keyFromCache = msKeys[0];
            }
        } else {
            keyFromCache = dateMs;
        }
    }

    if (!getDataFromCache) {
        let urlForUploadData,
            keyForCachedUpload;

        if (isCurrentDate) {
            urlForUploadData = URL_CURRENT_DATE;
            keyForCachedUpload = 1;
        } else if (Date.now() - dateMs < (90 * 1000 * 60 * 60 * 24)) {
            urlForUploadData = URL_90_DAYS;
            keyForCachedUpload = 90;
        } else {
            urlForUploadData = URL_ALL_DATA;
            keyForCachedUpload = 0;
        }

        if (!UPLOAD_PROMISES[keyForCachedUpload]) {
            resultDefer = defer();

            request(urlForUploadData, (err, data) => {
                if (err) {
                    resultDefer.reject(err);
                } else {
                    let parsedBody = JSON.parse(xml2json.toJson(data.body));
                    let fxData = parsedBody['gesmes:Envelope'].Cube.Cube;

                    if (!Array.isArray(fxData)) {
                        fxData = [fxData];
                    }

                    let summaryChanges = {};

                    fxData.forEach((dateRates) => {
                        let time = new Date(dateRates.time).getTime();
                        let resultToStore = {};

                        dateRates.Cube.forEach((currencyData) => {
                            resultToStore[currencyData.currency] = +(currencyData.rate);
                        });

                        if (time !== -1 && !optsOrTicker.dontStoreCache) {
                            UPLOADED_RATES_CACHE[time] = resultToStore;
                        }

                        summaryChanges[time] = resultToStore;
                    });

                    resultDefer.resolve(summaryChanges);
                }
            });

            UPLOAD_PROMISES[keyForCachedUpload] = resultDefer.promise;

            resultDefer.promise.then((data) => {
                delete UPLOAD_PROMISES[keyForCachedUpload];
                return data;
            }).catch((err) => {
                delete UPLOAD_PROMISES[keyForCachedUpload];
                throw err;
            });
        } else {
            resultDefer = {
                promise: UPLOAD_PROMISES[keyForCachedUpload]
            };
        }

        resultDefer.promise = resultDefer.promise.then((resolvedData) => {
            let result;
            if (optsOrTicker.exactDate || resolvedData[dateMs]) {
                result = resolvedData[dateMs];
            } else {
                let keys = Object.keys(resolvedData).map((key) => +(key)).sort((a, b) => b - a).filter((key) => key < dateMs);
                result = resolvedData[keys[0]];
            }

            if (!result) {
                throw new Error('No data for date');
            } else {
                return result;
            }
        });
    } else {

        resultDefer = defer();
        resultDefer.resolve(UPLOADED_RATES_CACHE[keyFromCache]);
    }

    resultDefer.promise = resultDefer.promise.then((dataForDate) => {
        let splittedCurrency = currency.split('/');
        let currencyOne = splittedCurrency[0];
        let currencyTwo = splittedCurrency[1];

        let err;

        currencyOne = dataForDate[currencyOne];
        if (!currencyOne) {
            err = new Error(`unknown currency ${currencyOne}`);
            throw err;
        }

        if (currencyTwo) {
            currencyTwo = dataForDate[currencyTwo];
            if(!currencyTwo) {
                err = new Error(`unknown currency ${currencyTwo}`);
                throw err;
            }

            return currencyOne / currencyTwo;
        } else {
            return currencyOne;
        }
    });

    if (cb) {
        resultDefer.promise = resultDefer.promise.then((data) => {
            cb(null, data);
            return data;
        }).catch((err) => {
            cb(err, null);
            throw err;
        });
    }

    return resultDefer.promise;
};