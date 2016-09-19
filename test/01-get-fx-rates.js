let getRates = require('../index');
let {expect} = require('chai');

const CURRENCY_NAME = 'JPY';
const CROSS_CURRENCY_NAME = 'JPY/BGN';

describe('01. Get fx rates', () => {
    "use strict";

    describe('Rates for single currency', () => {

        it('Get current exchange rate with string', (done) => {
            getRates(CURRENCY_NAME).then((rate) => {
                expect(rate).to.be.a('number');
                done();
            }).catch((err) => {

                console.error(err);
                expect(err).equal(null);

                done();
            });
        });

        it('Historical data not equal current rate', (done) => {

            let date = new Date();

            Promise.all([
                getRates({currency: CURRENCY_NAME, date: date}),
                getRates({currency: CURRENCY_NAME, date: date.getTime() - (1000 * 60 * 60 * 24)})
            ]).then((data) => {
                let currentRate = data[0];
                let histRate = data[1];

                expect(currentRate).not.equal(histRate);
                done();
            });

        });

    });

    describe('Rates for cross-currencies', () => {

        it('Get current exchange rate with string', (done) => {
            getRates(CROSS_CURRENCY_NAME).then((rate) => {
                expect(rate).to.be.a('number');
                done();
            }).catch((err) => {

                console.error(err);
                expect(err).equal(null);

                done();
            });
        });

        it('Historical data not equal current rate', (done) => {

            let date = new Date();

            Promise.all([
                getRates({currency: CROSS_CURRENCY_NAME, date: date}),
                getRates({currency: CROSS_CURRENCY_NAME, date: date.getTime() - (1000 * 60 * 60 * 24)})
            ]).then((data) => {
                let currentRate = data[0];
                let histRate = data[1];

                expect(currentRate).not.equal(histRate);
                done();
            }).catch((err) => {
                console.error(err);
            });

        });

    });

    it('Unknown currency throws error', (done) => {
        getRates('unknown_currency').then((rate) => {
            expect(rate).equal(null);
        }).catch(() => {
            done();
        });
    });

});