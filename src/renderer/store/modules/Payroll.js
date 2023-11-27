import sileo from '@/lib/sileo/restmodel.js';

const PayrollRelatedConstant = new sileo.Model('applybpo', 'payroll-related-constants');

const state = {
    payrollConstants: {},
};


const mutations = {
    setPayrollRelatedConstants(state, constants) {
        state.payrollConstants = constants;
    },
};

const actions = {
    fetchPayrollConstants({commit}) {
        return PayrollRelatedConstant.objects.filter().then(data => {
            commit('setPayrollRelatedConstants', data);
            return data;
        });
    }
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
};
