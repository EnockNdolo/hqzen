import sileo from '@/lib/sileo/restmodel.js';
import auth from '@/store/modules/Auth';

const ExchangeRateHistorical = new sileo.Model('exchange', 'historical');

const state = {
    conversionRatesByDate: {},
    exchangeDates: [],
    baseCurrencyCode: 'USD',
};

const getters = {
    userCurrency() {
        if (auth.state.user) {
            return auth.state.user.user_profile.currency;
        }
        return '';
    },
};

const mutations = {
    setConversionRatesByDate(state, conversionRate) {
        let {data, date} = conversionRate;
        state.conversionRatesByDate[date] = data;
    },

    pushExchangeDate(state, date) {
        state.exchangeDates.push(date);
    }
};

const actions = {
    // Date must be in YYYY-MM-DD format
    fetchExchangeRatesByDate({ commit, state }, date) {
        if (date in state.conversionRatesByDate) {
            return state.conversionRatesByDate[date];
        }

        if (state.exchangeDates.indexOf(date) !== -1) {
            return;
        }

        commit('pushExchangeDate', date);
        return ExchangeRateHistorical.objects.filter({date}).then(data => {
            commit('setConversionRatesByDate', {date, data});
            return data;
        });
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
