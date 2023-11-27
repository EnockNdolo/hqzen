import sileo from '@/lib/sileo/restmodel.js';

const ActiveEmployments = new sileo.Model('applybpo', 'applicant-active-employments');
const Employment = new sileo.Model('applybpo', 'applicant-employment');
const OvertimeRequests = new sileo.Model('applybpo', 'overtime-requests');

const state = {
    currentEmployment: null,
    currentWorkforceId: null,
    currentBoardId: null,
    currentShiftOvertime: null,
};

const getters = {
    currentEmployment: state => state.currentEmployment,
    currentWorkforceId: state => state.currentWorkforceId,
    currentBoardId: state => state.currentBoardId,
    currentShiftOvertime: state => state.currentShiftOvertime
};

const mutations = {

    setWorkforceId(state, workforceId) {
        state.currentWorkforceId = workforceId;
    },

    setBoardId(state, boardId) {
        state.currentBoardId = boardId;
    },

    setCurrentEmployment(state, employment) {
        state.currentEmployment = employment;
        localStorage.setItem('current_employment', JSON.stringify(employment));
    },

    clearCurrentEmployment(state) {
        state.currentEmployment = null;
        localStorage.removeItem('current_employment');
    },

    setCurrentShiftOvertime(state, shiftOvertime) {
        state.currentShiftOvertime = shiftOvertime;
    }
};

const actions = {
    fetchActiveEmployments({commit}) {
        return ActiveEmployments.objects.filter()
            .catch(response => {
                console.error(response);
                return response;
            });
    },

    fetchEmploymentData(context, employment_pk) {
        return Employment.objects.get(employment_pk);
    },

    fetchOvertimeRequests(context, employment_pk) {
        return OvertimeRequests.objects.filter(employment_pk);
    }
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
