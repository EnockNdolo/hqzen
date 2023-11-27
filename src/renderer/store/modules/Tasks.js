import sileo from '@/lib/sileo/restmodel.js';
import moment from 'moment-timezone';

const TaskAssignments = new sileo.Model('hqzen', 'task-assignments');

const SECONDS = 900; // 900 seconds before reminder pops up

const state = {
    selectedTaskAssignment: null,
    scheduledTasks: null,
    upcomingTasks: [],
};

const mutations = {
    setSelectedTaskAssignment(state, payload) {
        state.selectedTaskAssignment = payload;
    },

    setTaskAssignmentTimeSpent(state, payload) {
        state.selectedTaskAssignment.time_spent = payload;
    },

    setScheduledTasks(state, payload) {
        state.scheduledTasks = payload;
        state.upcomingTasks = [];
    },

    setSubtractedHours(state) {
        if (state.scheduledTasks) {
            state.upcomingTasks = [];
            state.scheduledTasks.forEach(
                taskAssignment => {
                    let startTime = moment(taskAssignment.task.scheduled_task.start_time);
                    let endTime = moment(taskAssignment.task.scheduled_task.end_time);
                    let diff = startTime.diff(endTime, 'seconds');
                    taskAssignment.task.scheduled_task.time_remaining--;
                    if (taskAssignment.task.scheduled_task.time_remaining <= SECONDS
                        && taskAssignment.task.scheduled_task.time_remaining > diff
                        && taskAssignment != state.selectedTaskAssignment) {
                        if (state.upcomingTasks.indexOf(taskAssignment) === -1) {
                            state.upcomingTasks.push(taskAssignment);
                        }
                    }
                }
            );
        }
    },
};

const actions = {
    fetchTaskAssignments(context, filters) {
        return TaskAssignments.objects.filter(filters);
    },

    updateTaskAssignments(context, data) {
        const form = new FormData();
        if (data.isDone) {
            form.append('status', 1);
        } else {
            form.append('status', 0);
            form.append('is_pinned', data.isPinned);
        }
        return TaskAssignments.objects.update({'pk': data.taskAssignmentPk}, form);
    }
};

const getters = {
    runningTaskAssignment: (state) => state.selectedTaskAssignment,
    scheduledTasks: (state) => state.scheduledTasks,
    upcomingTasks: (state) => state.upcomingTasks,
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};

