<template>
    <div>
        <div class="timelogger-container">
            <div :class="['timelogger', taskStatusClass]">
                <div class="timelogger__main">
                    <div v-if="runningTaskAssignment" class="tooltip-container task__play">
                        <Button
                            class="iconic white"
                            :icon="value ? 'pause' : 'play'"
                            :disabled="disabled"
                            @click="clickTask"
                        />
                        <Tooltip class="bottom left">
                            <p class="t-sm">
                                {{ value ? 'Pause tracking on this task' : 'Time in' }}
                            </p>
                        </Tooltip>
                    </div>
                    <div class="tooltip-container">
                        <p class="task__name">
                            {{ taskAssignmentTitle }}
                        </p>
                        <Tooltip class="bottom left">
                            <p class="t-sm">
                                {{ taskAssignmentTitle }}
                            </p>
                        </Tooltip>
                    </div>
                </div>
                <div class="timelogger__side">
                    <p class="task__duration">
                        <template
                            v-if="runningTaskAssignment"
                        >
                            {{ currentTaskTime }}
                        </template>
                        <template
                            v-else
                        >
                            {{ shiftHoursWorked }}
                        </template>
                    </p>
                    <div class="tooltip-container task__checkbox">
                        <Button
                            v-if="value && runningTaskAssignment && !scheduledTaskRunning"
                            class="iconic white"
                            :icon="(isNextTaskModalShown ? 'checkbox-marked' : 'checkbox-blank-outline')"
                            @click="$emit('select-next-task', runningTaskAssignment);"
                        />
                        <Tooltip class="bottom right">
                            <p class="t-sm">
                                Mark as done
                            </p>
                        </Tooltip>
                    </div>
                </div>
            </div>
            <div v-if="taskCanPivot && !isMobileTimeloggingAllowed" class="tooltip-container pivot">
                <Button
                    class="iconic"
                    :class="(isTaskPivoted ? 'success' : 'highlight secondary')"
                    icon="cellphone-wireless"
                    @click="switchPlatform"
                />
                <Tooltip
                    class="bottom right"
                >
                    <p class="t-sm">
                        {{ hint }}
                    </p>
                </Tooltip>
            </div>
        </div>
        <div v-if="timedInOnAnotherDevice" class="other-device-indicator">
            <div />
            <div>
                <i
                    :class="['mdi', 'mdi-monitor-multiple']"
                ></i>
                You are currently timed in on {{ runningTimeDevice }}.
            </div>
        </div>
        <div v-if="upcomingTasks.length && !isFetching" class="upcoming-tasks">
            <div class="header-container">
                <p class="semibold">
                    {{ upcomingTasks.length }} upcoming tasks
                </p>
                <a @click="isExpanded = !isExpanded">
                    {{ isExpanded ? 'Hide' : 'Show all' }}
                </a>
            </div>
            <ul v-if="isExpanded" class="section-container">
                <UpcomingTaskItem
                    v-for="upcomingTask in upcomingTasks"
                    :key="upcomingTask.pk"
                    :upcoming-task-item="upcomingTask"
                    :timed-in="value"
                    @switch-task="$emit('switch-scheduled-task', true)"
                />
            </ul>
        </div>
    </div>
</template>

<script>
    import Tooltip from '@/components/_generics/Tooltip.vue';
    import Button from '@/components/_generics/Button.vue';
    import UpcomingTaskItem from '@/components/dashboard/tasks/UpcomingTaskItem.vue';
    import { mapGetters, mapMutations, mapActions } from 'vuex';

    export default {
        name: 'Timelogger',

        components: {
            Button,
            Tooltip,
            UpcomingTaskItem,
        },

        props: {
            value: Boolean,
            hoursWorked: Number,
            disabled: Boolean,
            isFetching: Boolean,
            isMobileTimeloggingAllowed: Boolean,
            isDesktopTimeloggingAllowed: Boolean,
            taskHoursWorked: Number,
            timedInOnAnotherDevice: Boolean,
            runningTimeDevice: String,
            isNextTaskModalShown: Boolean,
        },
        data() {
            return {
                status: false,
                isExpanded: false,
                isTaskPivoted: false,
            };
        },

        eventBusCallbacks: {
            'task-moved-to-done': 'taskMovedToDoneHandler'
        },

        computed: {
            ...mapGetters('Tasks', [
                'runningTaskAssignment', 'scheduledTasks',
                'upcomingTasks']),

            taskStatusClass() {
                if (this.value) { // if timed in
                    if (this.runningTaskAssignment) {
                        return 'active'; // and has running task
                    }
                    return 'no-task'; // no running task
                }
                return 'inactive'; // timed out
            },

            taskAssignmentTitle() {
                if (this.runningTaskAssignment) {
                    return this.runningTaskAssignment.task.title;
                }
                return 'No task selected';
            },

            shiftHoursWorked() {
                return this.convertNumToTime(this.hoursWorked);
            },

            currentTaskTime() {
                return this.convertNumToTime(this.taskHoursWorked);
            },

            taskCanPivot() {
                if (this.runningTaskAssignment) {
                    return this.runningTaskAssignment.task.can_pivot;
                }
                return false;
            },

            isRunning() {
                return this.runningTaskAssignment && !this.timedInOnAnotherDevice;
            },

            scheduledTaskRunning() {
                if (this.runningTaskAssignment) {
                    return this.runningTaskAssignment.task.scheduled_task;
                }
                return false;
            },

            hint() {
                if (this.isTaskPivoted) {
                    return 'You are currently timed in on your ApplyBPO mobile app';
                }
                return 'You may time in on your ApplyBPO mobile app for this task';
            }
        },

        watch: {
            runningTimeDevice: {
                handler(device) {
                    if (device === 'Mobile') {
                        this.isTaskPivoted = true;
                    } else {
                        this.isTaskPivoted = false;
                    }
                },
                immediate: true
            },
        },

        methods: {
            ...mapMutations('Tasks', ['setSelectedTaskAssignment']),
            ...mapActions('Tasks', ['updateTaskAssignments']),

            clickTask() {
                /**
                 * When running task is clicked (paused),
                 * send a TIME IN request with no task
                 */
                this.$emit('pause-tracking');
            },

            convertNumToTime(number) {
                let hours = Math.floor(number);
                let hoursPadded = hours < 10 ? '0' + hours : hours;
                let n = new Date(0,0);
                n.setSeconds(+number * 60 * 60);
                let time = n.toTimeString().slice(2, 8);
                return hoursPadded + time;
            },

            hideItem(index) {
                return !this.isExpanded && index > 0;
            },

            switchPlatform() {
                this.isTaskPivoted = !this.isTaskPivoted;
                this.$emit('switch-platform', {
                    'componentName': this.$options.name,
                    'value': this.status,
                    'isTaskPivoted': this.isTaskPivoted
                });
            },
        },
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .timelogger-container {
        display: flex;

        .other-device-indicator {
            display: flex;
            border-radius: 4px;
            padding-left: 12px;
            padding-right: 12px;
            min-height: 30px;
            border: 2px solid;
            background: #FDF4D7;
            border-color: transparent;
            justify-content: space-between;
            align-items: center;
            margin-top: 6px;
            color: var(--secondary);
            i {
                padding: 1px 1px;
            }
        }

        .timelogger {
            flex: 1;
            display: flex;
            align-items: center;
            height: 40px;
            padding: 0 16px;
            border-radius: 8px;
            background: $primary-container;
            margin: 0 auto;

            justify-content: space-between;

            &__main {
                display: flex;
                align-items: center;

                & > * + * {
                    margin-left: 4px;
                }
            }

            &__side {
                display: flex;
                align-items: center;

                & > * + * {
                    margin-left: 4px;
                }
            }

            &.active {
                background: $accent;

                .task__name,
                .task__duration {
                    color: $white;
                }
            }

            &.inactive {
                background: $tertiary;

                .task__name,
                .task__duration {
                    color: $white;
                }
            }

            &.no-task {
                background: $warning-highlight;
            }

            button.iconic /deep/ {
                height: 28px;
                width: 28px;

                .icon {
                    font-size: 20px;
                    padding-bottom: 2px;
                }
            }

            .task {
                &__play {
                    margin-left: -8px;
                    margin-right: 8px;
                }

                &__name {
                    flex: 1;
                    font-weight: 600;
                    font-size: 15px;
                    line-height: 150%;
                    letter-spacing: -0.005em;
                    display: inline-block;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 60vw;
                    margin-bottom: -4px;
                }

                &__duration {
                    font-weight: 500;
                    font-size: 14px;
                    line-height: 150%;
                    letter-spacing: -0.005em;
                    float: right;
                }

                &__checkbox {
                    margin-right: -8px;
                    margin-left: 8px;
                    float: right;
                }
            }

            p {
                margin: 0;
            }
        }

        .pivot {
            margin-left: 8px;

            button {
                border-radius: 8px;
            }
        }
    }

    .upcoming-tasks {
        padding: 8px 16px;
        border-radius: 8px;
        background: $primary-container;
        border: 1px solid $quaternary;
        margin-top: 8px;

        p, a {
            margin: 0;
            font-size: 13px;
        }

        .header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;

            p {
                font-weight: 500;
                color: $primary;
            }

            a {
                cursor: pointer;
                user-select: none;

                &:hover {
                    color: darken($accent, 10%);
                }
            }
        }

        .section-container {
            @include clear-list-formatting();
            margin-top: 8px;
            margin-bottom: -8px;
        }
    }
</style>