<template>
    <li>
        <div class="information">
            <p>{{ task.title }}</p>
            <p class="schedule">
                {{ getScheduleTime(upcomingTask.start_time) }} -
                {{ getScheduleTime(upcomingTask.end_time) }}
            </p>
        </div>
        <Button
            v-if="timeRemaining <= 0"
            class="small compact primary"
            @click="switchTask"
        >
            Switch task
        </Button>
        <p v-else class="time">
            {{ convertSecsToMins(timeRemaining) }}
        </p>
    </li>
</template>

<script>
    import { mapMutations } from 'vuex';
    import TimezoneMixin from '@/mixins/TimezoneMixin';
    import Button from '@/components/_generics/Button.vue';
    export default {
        name: 'UpcomingTaskItem',

        components: {
            Button
        },

        mixins: [
            TimezoneMixin
        ],

        props: {
            upcomingTaskItem: {
                type: Object,
                required: true,
            },

            timedIn: {
                type: Boolean,
                required: true,
            }
        },

        data() {
            return {
            };
        },

        computed: {
            task() {
                return this.upcomingTaskItem.task;
            },

            upcomingTask() {
                return this.upcomingTaskItem.task.scheduled_task;
            },

            timeRemaining() {
                return this.upcomingTaskItem.task.scheduled_task.time_remaining;
            }
        },

        watch: {
            timeRemaining() {
                if (this.timeRemaining <= 0
                    && this.upcomingTask.is_time_sensitive && this.timedIn) {
                    this.switchTask();
                }
            }
        },

        methods: {
            ...mapMutations('Tasks', ['setSelectedTaskAssignment']),

            convertSecsToMins(number) {
                let minutes = Math.floor(number / 60);
                let seconds = Math.floor(number % 60);
                minutes = (minutes < 10) ? '0' + minutes : minutes;
                seconds = (seconds < 10) ? '0' + seconds : seconds;

                return minutes + ':' + seconds;
            },

            getScheduleTime(schedule) {
                return this.timezoneFormat(schedule, 'hh:mm A');
            },

            switchTask() {
                this.setSelectedTaskAssignment(this.upcomingTaskItem);
                this.$emit('switch-task');
            }
        },
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    li {
        border-top: 1px solid $quaternary;
        padding: 6px 16px;
        margin-left: -16px;
        margin-right: -16px;
        display: flex;
        align-items: center;

        .information {
            flex: 1;
            padding-right: 16px;

            .schedule {
                font-size: 12px;
                color: $secondary;
            }
        }

        /deep/ button {
            font-size: 12px;
            font-weight: 500;
            height: 28px;
            padding: 0 8px;
        }

        .time {
            font-size: $tertiary;
        }
    }
</style>