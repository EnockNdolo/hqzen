<template>
    <li :class="isRunning ? 'active' : ''">
        <div class="tooltip-container">
            <Button
                :disabled="disabled"
                class="track iconic"
                :class="taskIsRunning"
                :icon="isRunning ? 'pause' : 'play'"
                @click="toggleTask"
            />
            <Tooltip class="side-right">
                <p class="t-sm">
                    <template v-if="isRunning">
                        Pause tracking on this task
                    </template>
                    <template v-else>
                        Track this task
                    </template>
                </p>
            </Tooltip>
        </div>
        <div class="information">
            <p class="task__name">
                <i v-if="task.can_pivot && !isMobileTimeloggingAllowed" class="mdi mdi-cellphone-wireless" />
                {{ task.title }}
            </p>
            <p class="task__info">
                <span class="bold">
                    {{ task.points }}
                    {{ task.points == 1 ? 'point' : 'points' }}
                </span> •
                {{ task.card_title }} • {{ taskCreatorName }}
            </p>
        </div>
        <div
            class="task__time tooltip-container"
            @mouseover="hoverTask = true"
            @mouseleave="hoverTask = false"
        >
            <span class="time">
                
                <template
                    v-if="!hoverTask && isRunning"
                >

                    {{ shiftRunningTaskAssignmentTime }}
                </template>
                <template
                    v-else-if="!hoverTask && !isRunning"
                >
                    {{ shiftTaskAssignmentTime }}
                </template>
                <template
                    v-else-if="hoverTask"
                >
                    {{ taskAssignmentTime }}
                </template>
            </span>
            <Tooltip v-if="hoverTask" class="side-left">
                <p class="t-sm">
                    Total time spent on this task
                </p>
            </Tooltip>
        </div>
        <div class="tooltip-container">
            <Button
                class="iconic tertiary"
                :class="isRunning ? 'transparent primary' : 'tertiary'"
                icon="launch"
                @click="openTaskDetailsInHqzen(task)"
            />
            <Tooltip class="side-left">
                <p class="t-sm">
                    Open task in HQZen
                </p>
            </Tooltip>
        </div>
        <div class="tooltip-container">
            <Button
                class="iconic"
                :class="isPinnedTask ? 'primary' : 'tertiary'"
                :icon="isPinnedTask ? 'pin' : 'pin-outline'"
                @click="pinTaskHandler"
            />
            <Tooltip class="side-left">
                <p class="t-sm">
                    {{ isPinnedTask ? "Unpin this task from the top" : "Pin this task to the top" }}
                </p>
            </Tooltip>
        </div>
    </li>
</template>
<script>
    import { mapGetters, mapMutations, mapState } from 'vuex';
    import ExternalLinkMixin from '@/mixins/ExternalLinkMixin';
    import Button from '@/components/_generics/Button.vue';
    import Tooltip from '@/components/_generics/Tooltip.vue';


    export default {
        name: 'TaskItem',

        components: {
            Button,
            Tooltip
        },

        mixins: [
            ExternalLinkMixin,
        ],

        props: {
            taskAssignment: {
                type: Object,
                required: true,
            },

            timedInOnAnotherDevice: {
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
                required: true
            },

            disabled: {
                type: Boolean,
                required: true
            },

            timedIn: {
                type: Boolean,
                required: true
            },
        },

        data() {
            return {
                timeInSource: 0,
                status: false,
                hoverTask: false
            };
        },

        computed: {
            ...mapGetters('Tasks', ['runningTaskAssignment']),
            ...mapGetters('Employment', ['currentWorkforceId']),
            ...mapState('Sites', ['sites']),

            isRunning() {
                if (this.runningTaskAssignment) {
                    return (
                        this.runningTaskAssignment.pk == this.taskAssignment.pk
                        && !this.timedInOnAnotherDevice && this.timedIn
                    );
                }
                return false;
            },

            task() {
                return this.taskAssignment.task;
            },

            taskCreatorName() {
                return this.taskAssignment.task.card_creator.user.full_name;
            },

            taskAssignmentTime() {
                if (this.runningTaskAssignment && this.runningTaskAssignment.pk == this.taskAssignment.pk) {
                    return this.convertNumToTime(this.runningTaskAssignment.time_spent);
                }
                return this.convertNumToTime(this.taskAssignment.time_spent);
                
            },

            shiftRunningTaskAssignmentTime() {
                if (this.runningTaskAssignment && this.runningTaskAssignment.pk == this.taskAssignment.pk) {
                    return this.convertNumToTime(this.taskHoursWorked);
                }
                return this.convertNumToTime(this.taskHoursWorked);
            },

            shiftTaskAssignmentTime() {
                let taskTimeLogs = this.shiftTimeLogs.filter(
                    timeLog => timeLog.task_assignment_id == this.taskAssignment.pk);
                let taskShiftTimeSpent = 0;
                taskTimeLogs.forEach(timeLog => {
                    taskShiftTimeSpent += timeLog.total_time;
                });
                return this.convertNumToTime(taskShiftTimeSpent);
            },

            isPinnedTask() {
                return !!this.taskAssignment.date_pinned;
            },

            taskIsRunning() {
                if (this.isRunning) {
                    return 'transparent primary';
                } else {
                    if (this.disabled) {
                        return 'tertiary disabled';
                    } else {
                        return 'tertiary';
                    }
                }
            }
        },

        methods: {
            ...mapMutations('Tasks', ['setSelectedTaskAssignment']),

            openTaskDetailsInHqzen(task) {
                let companyId = this.currentEmployment.company_id;
                // eslint-disable-next-line max-len
                let link = `${this.sites.HQZEN_URL}/company/${companyId}/workforce/${this.currentWorkforceId}/board/${task.board_id}/card/${task.card_id}`;
                if(this.currentWorkforceId) this.openExternalLink(link);
            },

            toggleTask() {
                /**
                 * When a task is clicked,
                 * send a TIME IN request.
                 * If it's the current task, send a TIME IN request with no task.
                 */
                if (this.isRunning) {
                    console.log('toggle fired ...')
                    this.$emit('pause-tracking');
                } else {
                    console.log('toggle else fired ...')
                    this.setSelectedTaskAssignment(this.taskAssignment);
                    this.$emit('toggle', true);
                }
            },

            convertNumToTime(number) {
                let hours = Math.floor(number);
                let hoursPadded = hours < 10 ? '0' + hours : hours;
                let n = new Date(0,0);
                n.setSeconds(+number * 60 * 60);
                let time = n.toTimeString().slice(2, 8);

                return hoursPadded + time;
            },

            pinTaskHandler() {
                this.$emit('pin-task', this.taskAssignment.pk);
            }
        }
    };


</script>
<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    li {
        display: flex;
        align-items: center;
        padding: 12px;
        box-shadow: inset 0px -1px 0px $quaternary;

        &:first-child {
            margin-top: 1px;
        }

        .task {
            &__name {
                font-size: 14px;
            }

            &__info {
                font-size: 12px;
                color: $secondary;
            }

            &__time{
                margin: 0 4px;
                padding: 6px 8px;
                display: inline-block;
                border-radius: 4px;

                .time {
                    font-weight: 500;
                    color: $secondary;
                }

                &:hover {
                    background: lighten($quaternary, 5%);
                }
            }
        }

        /deep/ button.iconic {
            height: 28px;
            width: 28px;

            .icon {
                font-size: 20px;
            }

            &:hover {
                background: $accent !important;
                color: white;
            }

            &.track {
                border-radius: 50%;

                &:hover {
                    background: $success !important;
                    color: $white;
                }

                &.disabled {
                    &:hover {
                        background: $quaternary !important;
                        color: $tertiary;
                    }
                }
            }
        }

        .information {
            flex: 1;
            padding: 0 12px;

            p {
                margin: 0;
            }

            p + p {
                padding-top: 4px;
            }
        }

        &.active {
            background: $accent-highlight;
            box-shadow: inset 0px -1px 0px $accent, inset 0px 1px 0px $accent;

            .task__name {
                font-weight: bold;
            }

            .task__time:hover {
                background: #B3DDF3;
            }

            .task__name,
            .task__info,
            .task__time .time {
                color: $accent;
            }

            /deep/ button.iconic {
                &.track:hover {
                    background: $error !important;
                }
            }
        }
    }

    .tooltip {
        pointer-events: none;
    }

    .disabled {
        cursor: not-allowed;
    }
</style>