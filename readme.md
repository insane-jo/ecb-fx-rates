# ecb-fx-rates
 
Simple and lightweight library for get current and historical fx rates.

## Install

Node

```
npm install ecb-fx-rates --save
```
 
## Usage

```javascript
let getRatesFunc = require('ecb-fx-rates');

let currencyName = 'JPY';
let crossCurrencyName = 'JPY/BGN';

let historicalData = new Date().getTime() - 24 * 1000 * 60 * 60 * 24; //get fx rate for 24 days before
```

### Promises examples

```javascript
//Get historical data for cross-currency
getRatesFunc({currency: crossCurrencyName, date: historicalData}).then(console.info.bind(console, `Historical rate for ${crossCurrencyName}`));

//Get current data for currency
getRatesFunc(currencyName).then(console.info.bind(console, `Current fx rate for ${currencyName}`));
//or
getRatesFunc({currency: currencyName}).then(console.info.bind(console, `Current fx rate for ${currencyName}`));
```

### Callback examples

```javascript
//Get historical data for cross-currency
getRatesFunc({currency: crossCurrencyName, date: historicalData}, function (err, rate) {
    if (err) {
        return console.error(err);
    }
    
    console.info(`Historical rate for ${crossCurrencyName}`, rate);
});

//Get current data for currency
getRatesFunc(currencyName, function (err, rate) {
    if (err) {
        return console.error(err);
    }
    
    console.info(`Current fx rate for ${currencyName}`, rate);
});
//or
getRatesFunc({currency: currencyName}, function (err, rate) {
    if (err) {
        return console.error(err);
    }
    
    console.info(`Current fx rate for ${currencyName}`, rate)
});
```

## Description

### Syntax

```javascript

//JSDOC descriptions for common types

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
 
```

```javascript

//MAIN FUNCTION DESCRIPTION

/**
 * Get foreign exchange rate
 * @param {fxRateOpts|string} optsOrTicker
 * @param {GetFxRateCallback} [cb]
 * @returns Promise<number>
 */
let getRatesFunc = require('ecb-fx-rate');

```
 
 

## Test
 
Test

```
npm install
npm run test
```

## Change list

### Version 1.0.0

* Initial commit