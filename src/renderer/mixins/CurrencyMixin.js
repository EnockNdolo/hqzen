import {mapActions, mapState} from 'vuex';
import TimezoneMixin from '@/mixins/TimezoneMixin';

const MINIMUM_SALARY = '10000';
const MAXIMUM_SALARY = '999999';

export default {
    name: 'CurrencyMixin',

    mixins: [
        TimezoneMixin
    ],

    data() {
        return {
            minimumSalary: 0,
            maximumSalary: 0
        };
    },

    computed: {
        ...mapState('Currency', ['userCurrency', 'baseCurrencyCode']),
    },

    async created() {
        this.minimumSalary = await this.convertCurrency('PHP', this.userCurrency, MINIMUM_SALARY);
        this.maximumSalary = await this.convertCurrency('PHP', this.userCurrency, MAXIMUM_SALARY);
    },

    methods: {
        ...mapActions('Currency', ['fetchExchangeRatesByDate']),

        /**
         * Convert a money value to a currency.
         * @param {string} from The currency of the given amount.
         * @param {string} to The result currency to be achieved.
         * @param {string|number} amount
         * @param {string=} date The reference date for the conversion rate to be used. Must be a valid
         *     timestamp for `Moment.js` to evaluate. Default value is an empty string.
         * @returns {Promise<number>} A Promise object that represents the converted amount.
         */
        async convertCurrency(from, to, amount, date='') {
            amount = parseFloat(amount);

            if (amount == 0 || from === to) {
                return amount;
            }

            let formattedDate = this.timezoneFormat(date, 'YYYY-MM-DD');

            let exchangeRates = await this.fetchRates(formattedDate);

            let fromRate = parseFloat(exchangeRates[from]);
            let toRate = parseFloat(exchangeRates[to]);

            let valueInUSD = amount / fromRate;
            let converted =  valueInUSD * toRate;

            return converted;
        },

        /**
         * Fetch the exchange rates on the given day. Automatically retries if the API call fails.
         * @param {string} date
         */
        async fetchRates(date) {
            let rates = await this.fetchExchangeRatesByDate(date);

            if (rates) {
                return rates;
            }

            // This code block is to retry the fetch again.

            // This is used to delay the fetch by 100ms
            await (() => new Promise(resolve => setTimeout(resolve, 100)))();
            // Recursively call fetch again in the hopes that `fetchExchangeRatesByDate` will produce a different result
            return await this.fetchRates(date);
        },

        /**
         * Convert a value from the base currency to the given currency.
         * @param {string} to The result currency to be achieved
         * @param {string|number} amount
         * @param {string=} date The reference date for the conversion rate to be used. Must be a valid
         *     timestamp for `Moment.js` to evaluate. Default value is an empty string.
         */
        convertCurrencyFromBase(to, amount, date='') {
            return this.convertCurrency(this.baseCurrencyCode, to, amount, date);
        },

        /**
         * Convert a value from a given currency to the base currency.
         * @param {string} to The orignal currency.
         * @param {string|number} amount
         * @param {string=} date The reference date for the conversion rate to be used. Must be a valid
         *     timestamp for `Moment.js` to evaluate. Default value is an empty string.
         */

        convertCurrencyToBase(from, amount, date='') {
            return this.convertCurrency(from, this.baseCurrencyCode, amount, date);
        }
    }
};
