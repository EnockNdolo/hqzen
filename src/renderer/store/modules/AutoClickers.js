import sileo from '@/lib/sileo/restmodel.js';

const AutoClickers = new sileo.Model('hqzen', 'auto-clickers-list');
const AutoClickerEmailSender = new sileo.Model('hqzen', 'auto-clicker-email-sender')

const state = {
    autoClickersList: null,
};

const getters = {
    autoClickersList: state => state.autoClickersList,
};

const mutations = {
    setAutoClickersList(state, autoClickers) {
        state.autoClickersList = autoClickers;
    }
}
const actions = {
    fetchAutoClickers(context, filters) {
        return AutoClickers.objects.filter(filters);
    },

    createAutoClickerEmail(context, data) {
        const form = new FormData();

        form.append('employment_id', data.employment_id);
        form.append('auto_clicker_id', data.auto_clicker_id);

        return AutoClickerEmailSender.objects.create(form).then(response => {
            return response;
        }).catch( response => {
            console.error(response);
            return response;
        });
    }
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
