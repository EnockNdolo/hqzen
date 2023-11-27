<template>
    <div class="tasks-container">
        <header>
            <h1 class="workforce-name">
                {{ workforceName }}
            </h1>
            <div class="button-container">
                <div class="tooltip-container">
                    <div class="icon-container">
                        <i v-if="timedIn && isLate" class="mdi mdi-alert-circle-outline late"></i>
                        <i v-else-if="timedIn && isWorkingOT" class="mdi mdi-update ot"></i>
                        <p
                            :class="{
                                active: timedIn,
                                ot: timedIn && isWorkingOT,
                                late: timedIn && isLate
                            }"
                        >
                            {{ time }}
                        </p>
                    </div>
                    <Tooltip
                        v-if="timedIn && (isWorkingOT || isLate)"
                        class="bottom right"
                    >
                        <p v-if="isLate" class="t-sm">
                            You were late today
                        </p>
                        <p v-else-if="isWorkingOT" class="t-sm">
                            You're working overtime
                        </p>
                    </Tooltip>
                </div>
                <div class="tooltip-container">
                    <Button
                        :disabled="isSyncing || !isOnline"
                        class="iconic tertiary"
                        icon="sync"
                        @click="syncHandler"
                    />
                    <Tooltip
                        class="bottom right"
                    >
                        <p class="t-sm">
                            Sync
                        </p>
                    </Tooltip>
                </div>
                <div class="tooltip-container">
                    <Button
                        :disabled="disabled"
                        :class="(timedIn && !timedInOnAnotherDevice ? 'error' : 'success')"
                        class="iconic log"
                        :icon="(timedIn && !timedInOnAnotherDevice ? 'stop' : 'play')"
                        @click="$emit('toggle-time-switch', {'value': !timedIn})"
                    />
                    <Tooltip
                        class="bottom right"
                    >
                        <p class="t-sm">
                            <template
                                v-if="!disabled"
                            >
                                <template v-if="timedIn && !timedInOnAnotherDevice">
                                    Time out
                                </template>
                                <template v-else>
                                    Time in
                                </template>
                            </template>
                            <template v-else>
                                <template v-if="isOutsideSchedule">
                                    You are not allowed to time in outside your schedule.
                                </template>
                                <template
                                    v-else-if="onUnauthorizedNetwork"
                                >
                                    You are not authorized to work remotely
                                </template>
                                <template v-else-if="!canTimeIn.success">
                                    {{ canTimeIn.error_message }}
                                </template>
                            </template>
                        </p>
                    </Tooltip>
                </div>
            </div>
        </header>
        <div class="timelog-section">
            <Timelogger
                :value="isTimedIn"
                :hours-worked="hoursWorked"
                :task-hours-worked="taskHoursWorked"
                :is-fetching="isFetching"
                :disabled="disabled"
                :is-mobile-timelogging-allowed="isMobileTimeloggingAllowed"
                :is-desktop-timelogging-allowed="isDesktopTimeloggingAllowed"
                :is-outside-schedule="isOutsideSchedule"
                :timed-in-on-another-device="timedInOnAnotherDevice"
                :running-time-device="runningTimeDevice"
                :is-next-task-modal-shown="isNextTaskModalShown"
                @toggle="toggleTask"
                @mark-task-as-done="markTaskAsDone($event)"
                @switch-scheduled-task="toggleTask"
                @switch-platform="$emit('switch-platform', $event)"
                @pause-tracking="$emit('pause-time-tracking')"
                @select-next-task="showNextTaskModal"
            />
            <BannerAlert
                v-if="beforeScheduleBanner"
                color="yellow"
                icon="alert-circle-outline"
                :primary="beforeScheduleBanner.primary"
                :secondary="beforeScheduleBanner.secondary"
            />
            <BannerAlert
                v-else-if="outsideShiftBanner && timedIn"
                color="yellow"
                :primary="outsideShiftBanner.primary"
                :secondary="outsideShiftBanner.secondary"
            >
                <template slot="content-right">
                    <CountdownTimer
                        size="small"
                        :time="300"
                        :override-counter="outsideShiftBanner.counter"
                    />
                </template>
            </BannerAlert>
            <BannerAlert
                v-else-if="isOutsideSchedule && (timeLeftBeforeEndOfShift < 0 || !!currentBreakTime)"
                color="red"
                :primary="!!currentBreakTime
                    ? 'You were timed out because you are currently on your break'
                    : 'You were timed out because your shift has ended.'
                "
                secondary="Employees having a strict schedule type cannot time in beyond their assigned schedule."
            >
                <!-- currently disable # TODO: for future -->
                <template v-if="false" slot="content-right">
                    <Button
                        class="border tertiary small"
                        icon="update"
                    >
                        Request Overtime
                    </Button>
                </template>
            </BannerAlert>
        </div>
        <ul class="tab-group">
            <li class="tab">
                <input
                    id="assigned"
                    v-model="tab"
                    type="radio"
                    name="type"
                    value="assigned"
                />
                <label for="assigned">
                    <p>
                        Assigned to You
                    </p>
                    <Badge
                        v-if="!isFetching && taskAssignments.length"
                        color="blue"
                        :label="taskAssignments.length"
                    />
                </label>
            </li>
            <div class="tab">
                <input
                    id="schedule"
                    v-model="tab"
                    type="radio"
                    name="type"
                    value="schedule"
                />
                <label for="schedule">
                    <p>
                        Scheduled tasks
                    </p>
                </label>
            </div>
        </ul>
        <div class="search-container">
            <SearchBar
                v-if="tab == 'assigned'"
                v-model="searchText"
                placeholder="Search Task or Card Title"
                width="block"
                @clear="searchText = ''"
            />
        </div>
        <section>
            <div v-if="tab == 'assigned'" class="content-view">
                <template v-if="isFetching">
                    <ul class="list">
                        <li
                            v-for="i in 12"
                            :key="i"
                            class="task-item-loader"
                        >
                            <BaseLoading
                                height="28px"
                                width="28px"
                                border-radius="4px"
                            />
                            <div class="information">
                                <BaseLoading
                                    height="20px"
                                    width="100%"
                                />
                                <BaseLoading
                                    height="20px"
                                    margin-top="2px"
                                    width="50%"
                                />
                            </div>
                            <BaseLoading
                                height="20px"
                                width="64px"
                                margin-right="8px"
                                border-radius="4px"
                            />
                            <BaseLoading
                                height="28px"
                                width="28px"
                                border-radius="4px"
                            />
                        </li>
                    </ul>
                </template>
                <template v-else>
                    <template v-if="filteredTaskAssignments.length">
                        <ul class="list">
                            <TaskItem
                                v-for="taskAssignment in filteredTaskAssignments"
                                :key="`task-assignment-${taskAssignment.pk}`"
                                :task-assignment="taskAssignment"
                                :timed-in="timedIn"
                                :timed-in-on-another-device="timedInOnAnotherDevice"
                                :is-mobile-timelogging-allowed="isMobileTimeloggingAllowed"
                                :is-desktop-timelogging-allowed="isDesktopTimeloggingAllowed"
                                :task-hours-worked="taskHoursWorked"
                                :shift-time-logs="shiftTimeLogs"
                                :disabled="disabled"
                                @toggle="toggleTask"
                                @pin-task="pinTaskHandler"
                                @pause-tracking="$emit('pause-time-tracking')"
                            />
                        </ul>
                    </template>
                    <EmptyState
                        v-else
                        icon="clipboard-text-outline"
                        primary="No tasks"
                    />
                </template>
            </div>
            <div v-else-if="tab == 'schedule'" class="content-view">
                <template v-if="isFetching">
                    <ul class="list">
                        <li
                            v-for="i in 3"
                            :key="i"
                        >
                            <BaseLoading
                                height="60px"
                                width="100%"
                            />
                        </li>
                    </ul>
                </template>
                <template v-else>
                    <template v-if="scheduledTasks.length">
                        <ul class="list">
                            <ScheduledTaskItem
                                v-for="scheduledTask in scheduledTasks"
                                :key="`scheduled-task-${scheduledTask.pk}`"
                                :task-assignment="scheduledTask"
                            />
                        </ul>
                    </template>
                    <EmptyState
                        v-else
                        icon="clipboard-text-outline"
                        primary="No scheduled tasks"
                    />
                </template>
            </div>
        </section>
        <NextTaskModal
            v-if="isNextTaskModalShown"
            :task-assignments="taskAssignments"
            :current-task="currentTask"
            @time-out="timeOutAfterMarkingTaskDone"
            @next-task="nextTask($event)"
            @cancel="isNextTaskModalShown = false"
        />
        <CustomModal
            v-if="currentTaskMovedToDone"
            message-primary="Your current task was moved to done."
            message-secondary="Please select a new task."
            icon="alert-circle-outline"
            icon-color="yellow"
            @close="closeTaskMovedToDoneModal"
        />
    </div>
</template>

<script>
    import {ipcRenderer} from 'electron';
    import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';
    import TaskItem from '@/components/dashboard/tasks/TaskItem.vue';
    import ScheduledTaskItem from '@/components/dashboard/tasks/ScheduledTaskItem.vue';
    import Timelogger from '@/components/dashboard/Timelogger.vue';
    import BaseLoading from '@/components/_generics/BaseLoading.vue';
    import Tooltip from '@/components/_generics/Tooltip.vue';
    import Button from '@/components/_generics/Button.vue';
    import SearchBar from '@/components/_generics/SearchBar.vue';
    import Badge from '@/components/_generics/Badge.vue';
    import EmptyState from '@/components/_generics/EmptyState.vue';
    import BannerAlert from '@/components/_generics/BannerAlert.vue';
    import CountdownTimer from '@/components/_generics/CountdownTimer.vue';
    import TimezoneMixin from '@/mixins/TimezoneMixin.js';
    import ScheduleMixin from '@/mixins/ScheduleMixin.js';

    const FIVE_MINUTES = 300;
    import NextTaskModal from '@/components/dashboard/NextTaskModal.vue';
    import CustomModal from '@/components/dashboard/CustomModal.vue';

    export default {
        name: 'Tasks',

        components: {
            TaskItem,
            ScheduledTaskItem,
            Timelogger,
            BaseLoading,
            Tooltip,
            SearchBar,
            Button,
            Badge,
            EmptyState,
            BannerAlert,
            CountdownTimer,
            NextTaskModal,
            CustomModal
        },

        mixins: [
            TimezoneMixin,
            ScheduleMixin
        ],

        props:{
            isSyncing: {
                type: Boolean,
                required: true
            },
            isOnline: {
                type: Boolean,
                required: true
            },
            hoursWorked: {
                type: Number,
                required: true
            },
            timedIn: {
                type: Boolean,
                required: true
            },
            timedInOnAnotherDevice: {
                type: Boolean,
                required: true
            },
            canTimeIn: {
                type: Object,
                required: false
            },
            onUnauthorizedNetwork: {
                type: Boolean,
                required: true
            },
            currentTaskAssignmentPk: {
                type: Number,
                required: false,
            },
            workforceName: {
                type: String,
                required: false
            },
            isTimingInOut: {
                type: Boolean,
                required: true
            },
            isMobileTimeloggingAllowed: {
                type: Boolean,
                required: true
            },
            isDesktopTimeloggingAllowed: {
                type: Boolean,
            },
            taskHoursWorked: {
                type: Number,
                required: true
            },
            shiftTimeLogs: {
                type: Array,
                required:true
            },
            runningTimeDevice:{
                type: String
            },
            employment: Object,
            workforceEmployeeSettings: Object
        },

        data() {
            return {
                taskAssignments: [],
                scheduledTasks: [],
                isFetching: false,
                searchText: '',
                tab: 'assigned',
                userIsTimedOut: false,
                isNextTaskModalShown: false,
                currentTask: false,
                timeLoggerValue: false,
                currentTaskMovedToDone: false,
            };
        },

        eventBusCallbacks: {
            'task-moved-to-done': 'taskMovedToDoneHandler',
            'subtask-completed': 'subtaskCheckedHandler',
            'task-moved-from-done': 'fetchTasks',
            'assigned-to-subtask': 'fetchTasks',
            'card-closed': 'fetchTasks',
            'card-reopened': 'fetchTasks',
            // TODO: refactor: instead of refetching all tasks, pass the ID from backend
            'removed-from-subtask': 'fetchTasks',
            'task-assignment-updated': 'fetchTasks',
            'board-deleted': 'fetchTasks'
        },

        computed: {
            ...mapState('Auth', ['user']),
            ...mapGetters('Tasks', ['runningTaskAssignment']),
            ...mapGetters('Employment', ['currentWorkforceId', 'currentBoardId']),

            time() {
                return this.convertNumToTime(this.hoursWorked);
            },

            isWorkingOT() {
                return this.afterShiftHoursWorked > 0;
            },

            isLate() {
                // TODO implement checking of late (jc@bposeats.com)
                return false;
            },

            disabled() {
                return (
                    this.isTimingInOut
                    || this.isSyncing
                    || !this.isOnline
                    || !this.canTimeIn.success
                    || this.isFetching
                    || this.isOutsideSchedule
                );
            },

            outsideShiftBanner() {
                if (
                    this.timeLeftBeforeEndOfShift <= FIVE_MINUTES &&
                    this.timeLeftBeforeEndOfShift > 0 &&
                    !this.remainingApprovedOvertime
                ) {
                    return {
                        primary: `
                            You will be timed out once your shift ends at\
                            ${this.scheduleToday.endTime.format('hh:mm A')}
                        `,
                        secondary: `
                            Employees having a strict schedule type cannot\
                            time in beyond their assigned schedule.
                        `,
                        counter: this.timeLeftBeforeEndOfShift
                    };
                } else if (this.timeLeftBeforeBreak <= FIVE_MINUTES && this.timeLeftBeforeBreak > 0) {
                    return {
                        primary: `
                            You will be timed out once your break starts at\
                            ${this.upcomingBreak.format('hh:mm A')}
                        `,
                        secondary: `
                            Employees having a strict schedule type cannot\
                            time in during their break time.`
                        ,
                        counter: this.timeLeftBeforeBreak
                    };
                } else if (this.remainingApprovedOvertime <= FIVE_MINUTES && this.remainingApprovedOvertime > 0) {
                    return {
                        primary: `
                            You will be timed out once your approved overtime is done.
                        `,
                        secondary: `
                            Employees having a strict schedule type cannot\
                            time in beyond their assigned schedule.
                        `,
                        counter: this.remainingApprovedOvertime
                    };
                }
                return null;
            },

            beforeScheduleBanner() {
                if (
                    this.now.isBefore(this.nextSchedule) &&
                    (!this.scheduleToday || this.now.isBefore(this.startTimeWithGracePeriod))
                ) {
                    let nextShiftStart = this.nextSchedule.format('hh:mm A, dddd');
                    let gracePeriod = this.workforceEmployeeSettings.desktop_time_in_grace_period / 60;
                    let secondary = 'You can only start timing in within your shift due to your strict schedule';
                    if (gracePeriod > 0) {
                        secondary = `You can only start timing in ${gracePeriod} \
                        minutes before your shift due to your strict schedule.`;
                    }
                    return {
                        primary: `Your next shift will begin at ${nextShiftStart} and has not started yet.`,
                        secondary: secondary
                    };
                }
                return null;
            },

            filteredTaskAssignments() {
                return this.taskAssignments.filter(taskAssignment => {
                    let searchKey = this.searchText.toLowerCase();
                    let inTaskTitle = taskAssignment.task.title.toLowerCase().includes(searchKey);
                    let inCardTitle = taskAssignment.task.card_title.toLowerCase().includes(searchKey);
                    return inTaskTitle || inCardTitle;
                }).sort((prevTask, nextTask) => {
                    /**
                     * sorts by date pinned
                     */
                    let prevDate = prevTask.date_pinned;
                    let nextDate = nextTask.date_pinned;
                    if (prevDate === nextDate) {
                        return 0;
                    } else if (prevDate === null) { // makes sure that unpinned items are placed after pinned items
                        return 1;
                    } else if (nextDate === null) { // makes sure that unpinned items are placed after pinned items
                        return -1;
                    }
                    return prevDate < nextDate ? -1 : 1; // makes sure earliest pinned item stays on top of the list
                });
            },

            isTimedIn: {
                get() {
                    return this.timedIn && !this.timedInOnAnotherDevice;
                },
                set(newValue) {
                    this.timeLoggerValue = newValue;
                }
            },
        },

        watch: {
            isSyncing() {
                if (this.timedIn && !this.isSyncing) {
                    this.fetchTasks();
                }
            },

            currentWorkforceId() {
                this.fetchTasks();
            },

            isOutsideSchedule: {
                handler() {
                    if (this.isOutsideSchedule && this.isTimedIn) {
                        this.setSelectedTaskAssignment(null);
                        let data = { 'value': false };
                        ipcRenderer.send('show-window');
                        this.$emit('toggle-time-switch', data);
                    }
                },
                immediate: true,
                deep: true
            }
        },

        async created() {
            await this.fetchTasks();
        },

        methods: {
            ...mapActions('Tasks', [
                'fetchTaskAssignments', 'updateTaskAssignments']),
            ...mapMutations('Tasks', [
                'setSelectedTaskAssignment', 'setScheduledTasks']),
            ...mapMutations('Employment', ['setBoardId']),

            async fetchTasks() {
                this.isFetching = true;
                this.taskAssignments = [];
                this.scheduledTasks = [];
                try {
                    let response = await this.fetchTaskAssignments({
                        'assignee_id': this.user.user_profile.pk,
                        'task__card_subtask__card__column__board__workforce_id': this.currentWorkforceId
                    });

                    if (response) {
                        response.forEach(taskAssignment => (taskAssignment.task.scheduled_task == null ?
                            this.taskAssignments : this.scheduledTasks).push(taskAssignment));
                    }
                } catch(error) {
                    console.error(error);
                }

                this.scheduledTasks.sort((a, b) => {
                    return (a.task.scheduled_task.start_time < b.task.scheduled_task.start_time) ? -1 : (
                        (a.task.scheduled_task.start_time > b.task.scheduled_task.start_time) ? 1 : 0);
                });

                if (this.taskAssignments.length > 0) {
                    this.setBoardId(this.taskAssignments[0].task.board_id);
                }

                setTimeout(() => {
                    this.setScheduledTasks(this.scheduledTasks);
                    if (this.timedIn && this.currentTaskAssignmentPk) {
                        let selectedTaskAssignment = this.taskAssignments.filter(taskAssignment => {
                            if (taskAssignment.pk == this.currentTaskAssignmentPk) {
                                return taskAssignment;
                            }
                        });
                        if (selectedTaskAssignment.length <= 0) {
                            selectedTaskAssignment = this.scheduledTasks.filter(scheduledTask => {
                                if (scheduledTask.pk == this.currentTaskAssignmentPk) {
                                    return scheduledTask;
                                }
                            });
                        }
                        this.setSelectedTaskAssignment(selectedTaskAssignment[0]);
                    }
                    this.isFetching = false;
                }, 100);
            },

            taskMovedToDoneHandler(data) {
                if (this.runningTaskAssignment && data.task_ids.includes(this.runningTaskAssignment.task.pk)) {
                    this.currentTaskMovedToDone = true;
                    this.markTaskAsComplete();
                }
            },

            closeTaskMovedToDoneModal() {
                this.currentTaskMovedToDone = false;
                this.fetchTasks();
            },

            subtaskCheckedHandler(data) {
                if (this.runningTaskAssignment.task.pk == data.subtask_pk) {
                    this.setSelectedTaskAssignment(null);
                    this.currentTaskMovedToDone = true;
                    ipcRenderer.send('show-window');
                }
            },

            markTaskAsDone(data) {
                this.taskAssignments = this.taskAssignments.filter(taskAssignment => {
                    return taskAssignment.pk != this.runningTaskAssignment.pk;
                });
                this.setSelectedTaskAssignment(null);
                this.$emit('toggle-time-switch', data);
            },

            toggleTask(value) {
                console.log('togglingi')
                let data = { 'value': value };
                this.$emit('toggle-time-switch', data);
            },

            timeOutAfterMarkingTaskDone() {
                this.markTaskAsComplete();
                this.taskAssignments = this.taskAssignments.filter(taskAssignment => {
                    return taskAssignment.pk != this.runningTaskAssignment.pk;
                });
                this.setSelectedTaskAssignment(null);
                let data = { 'value': false };
                this.$emit('toggle-time-switch', data);
                this.isNextTaskModalShown = false;
            },

            showNextTaskModal(event) {
                this.isNextTaskModalShown = true;
                this.currentTask = event;
            },

            nextTask(nextTaskPk) {
                this.markTaskAsComplete();
                if (nextTaskPk) {
                    let nextTask = this.taskAssignments.filter(taskAssignment => {
                        return taskAssignment.pk == nextTaskPk;
                    });
                    this.setSelectedTaskAssignment(nextTask[0]);

                    /**
                     * When next task is selected,
                     * send a TIME IN request
                     */
                    let data = { 'value': true };
                    this.$emit('toggle-time-switch', data);
                } else {
                    this.taskAssignments = this.taskAssignments.filter(taskAssignment => {
                        return taskAssignment.pk != this.runningTaskAssignment.pk;
                    });
                    this.setSelectedTaskAssignment(null);

                    /**
                     * When next task is selected,
                     * send a TIME IN request with no task
                     */
                    let data = { 'value': true };
                    this.$emit('toggle-time-switch', data);
                }
                this.isNextTaskModalShown = false;
            },

            syncHandler() {
                this.$emit('perform-sync');
            },

            convertNumToTime(number) {
                let hours = Math.floor(number);
                let hoursPadded = hours < 10 ? '0' + hours : hours;
                let n = new Date(0,0);
                n.setSeconds(+number * 60 * 60);
                let time = n.toTimeString().slice(2, 8);
                return hoursPadded + time;
            },

            async pinTaskHandler(pk) {
                let data = { taskAssignmentPk: pk };
                let pinnedAssignment = this.taskAssignments.find(assignment => assignment.pk == pk);

                data['isPinned'] = !pinnedAssignment.date_pinned;

                try {
                    let response = await this.updateTaskAssignments(data);
                    if (response) {
                        pinnedAssignment.date_pinned = response.date_pinned;
                    }
                } catch(error) {
                    console.error(error);
                }
            },

            async markTaskAsComplete() {
                if (this.runningTaskAssignment) {
                    let data = {
                        'taskAssignmentPk': this.runningTaskAssignment.pk,
                        'isDone': true
                    };
                    try {
                        let response = await this.updateTaskAssignments(data);
                        if (response) {
                            this.$emit('mark-task-as-done', {
                                'componentName': 'Tasks',
                                'value': false
                            });
                        }
                    } catch(error) {
                        console.error(error);
                    }
                }
            },
        }
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .tasks-container {
        position: relative;
        display: grid;
        height: 100%;
        grid-template-rows: auto auto auto auto 1fr;
    }

    header {
        padding-top: 24px;
        padding-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        h1 {
            font-style: normal;
            font-weight: 600;
            font-size: 20px;
            line-height: 110%;
            letter-spacing: -0.007em;
            color: var(--black-primary);
        }

        .button-container {
            display: inline-flex;
            align-items: center;

            button {
                margin-left: 12px;
            }

            .log {
                border-radius: 50%;

                &:disabled {
                    background: $quaternary !important;
                }
            }
        }

        .icon-container {
            display: inline-flex;
            align-items: center;

            .ot {
                color: $violet;
            }

            .late {
                color: $warning;
            }

            .active {
                color: $accent;
            }

            i {
                font-size: 20px;
            }

            p {
                padding-left: 8px;
                font-style: normal;
                font-weight: 600;
                font-size: 20px;
                line-height: 110%;
                text-align: right;
                letter-spacing: -0.007em;
                color: $secondary;
                margin: 0;
            }
        }
    }

    .timelog-section {
        padding-bottom: 12px;

        > div {
            margin: 12px 0;
        }
    }

    .tab-group {
        @include clear-list-formatting();
        display: flex;
        background: white;
        box-shadow: 0 0 0 1px $quaternary;
        border-radius: 8px 8px 0 0;
        overflow: hidden;

        .tab {
            flex: 1;
            height: 44px;

            input {
                display: none;
            }

            label {
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
                background: white;
                padding: 0 16px;
                height: inherit;
                cursor: pointer;

                p {
                    font-weight: 500;
                    line-height: 150%;
                    color: $tertiary;
                }

                p + .badge {
                    margin-left: 8px;
                }

                .badge {
                    padding: 0;
                }

                &:hover {
                    background: $quaternary;
                }
            }

            input:checked + label {
                box-shadow: inset 0px -2px 0px $accent;

                p {
                    color: $accent;
                }
            }

            i {
                font-size: 18px;
            }
        }
    }

    .search-container {
        .search /deep/ input {
            border-radius: 0;
            border: none;
            box-shadow: 0 0 0 1px $quaternary;
        }
    }

    section {
        box-shadow: 0 0 0 1px $quaternary;
        border-radius: 0 0 8px 8px;
        overflow-y: auto;
        @include scrollbar();
    }

    .list {
        @include clear-list-formatting();
    }

    .task-item-loader {
        display: flex;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid $quaternary;

        .information {
            flex: 1;
            margin: 0 12px;
        }
    }
</style>
