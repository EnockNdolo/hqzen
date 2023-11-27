<template>
    <span class="base-currency">
        <template v-if="showCurrency">
            {{ toCurrencyCode }}
        </template>
        {{ convertedAmount }}
    </span>
</template>

<script>
    import {mapGetters, mapState} from 'vuex';
    import CurrencyMixin from '@/mixins/CurrencyMixin';

    export default {
        name: 'BaseCurrency',

        mixins: [
            CurrencyMixin
        ],

        props: {
            value: {
                type: [String, Number],
                required: true
            },

            showCurrency: {
                type: Boolean,
                default: true
            },

            originCurrencyCode: {
                type: String,
            },

            resultCurrencyCode: {
                type: String,
            },

            referenceDate: {
                type: String,
                default: '',
            }
        },

        data() {
            return {
                convertedAmount: '0.00'
            };
        },

        computed: {
            ...mapGetters('Currency', ['userCurrency']),
            ...mapState('Currency', ['baseCurrencyCode']),

            fromCurrencyCode() {
                return this.originCurrencyCode ? this.originCurrencyCode : this.baseCurrencyCode;
            },

            toCurrencyCode() {
                return this.resultCurrencyCode ? this.resultCurrencyCode : this.userCurrency;
            }

        },

        watch: {
            referenceDate: {
                handler: 'convertAmount'
            },

            value: {
                handler: 'convertAmount'
            },

            currency: {
                handler: 'convertAmount'
            },
        },

        created() {
            this.convertAmount();
        },

        methods: {
            async convertAmount() {
                let converted = await this.convertCurrency(
                    this.fromCurrencyCode, this.toCurrencyCode, this.value, this.referenceDate);
                if (isNaN(converted))
                    return;

                this.convertedAmount = this.formatAmount(converted);
            },

            formatAmount(amount) {
                return amount.toLocaleString(
                    undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}
                );
            },
        }
    };
</script>

<style scoped>
    .base-currency {
        display: inline-block;
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        letter-spacing: inherit;
    }
</style>
