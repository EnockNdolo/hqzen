import sileo from '@/lib/sileo/restmodel.js';

const InOutTimeLogs = new sileo.Model('timelogging', 'in-out-time-logs');
const TimeLogActivities = new sileo.Model('timelogging', 'desktop-employee-timelog-activity');
const MouseKeyboardActivities = new sileo.Model('timelogging', 'desktop-employee-mouse-keyboard-activity');

const state = {
    currentTimelog: null,
    mouseKeyboardActivity: null
};

const mutations = {
    setTimelog(state, timelog) {
        state.currentTimelog = timelog;
    },
};

const getters = {
    currentTimelog: (state) => state.currentTimelog,
};

const actions = {
	performTimeIn({ commit }, data) {
		const form = new FormData();

		for (let field in data) {
            form.append(field, data[field]);
        }

		return InOutTimeLogs.objects.create(form).then(
			response => {
                commit('setTimelog', response);
                return response;
            }).catch(error => {
                console.error(error);
                return error;
        });
	},

	performTimeOut({ commit }, data) {
        return InOutTimeLogs.objects.update({ employment_id: data.employment }).then(
        	response => {
                return response;
            }).catch(response => {
                console.error(response);
                return response;
        });
	},

	fetchTimeLogs({commit}, filters) {
        console.log('filters ', filters)
		return InOutTimeLogs.objects.filter(filters).then(
            response => {
                console.log('after fetching timelogs with filters', response)
                commit('setTimelog', response[response.length-1])
                return response;
            });
	},

	createEmployeeTimeLogActivities(context, data) {
        const form = new FormData();
        form.append('activities', JSON.stringify(data.activities));
        form.append('employment', data.employment);

        return TimeLogActivities.objects.create(form)
            .then(response => {
                sessionStorage.setItem('userActivities', JSON.stringify({}));
            });
    },

	createEmployeeMouseKeyboardActivities({ commit }, data) {
        const form = new FormData();
        form.append(
            'mouse_keyboard_activities',
            JSON.stringify(data.mouse_keyboard_activities)
        )
        form.append('employment', data.employment);

        return MouseKeyboardActivities.objects.create(form)
            .then(response => {
                sessionStorage.setItem('mouseKeyboardActivities', JSON.stringify({}));
                return response;
            });
    },
};

export default {
	namespaced: true,
	actions,
    state,
    getters,
    mutations
};
