<template>
    <li>
        <p class="information">
            {{ task.title }}
        </p>
        <p class="secondary">
            {{ getScheduleTime(scheduledTask) }}
        </p>
    </li>
</template>
<script>
    import TimezoneMixin from '@/mixins/TimezoneMixin';
    export default {
        name: 'ScheduledTaskItem',

        components: {
        },

        mixins: [
            TimezoneMixin
        ],

        props: {
            taskAssignment: {
                type: Object,
                required: true,
            }
        },

        computed: {
            task() {
                return this.taskAssignment.task;
            },

            scheduledTask() {
                return this.taskAssignment.task.scheduled_task;
            }
        },

        methods: {
            getScheduleTime(schedule) {
                return `
                    ${this.timezoneFormat(schedule.start_time, 'hh:mm A')} -
                    ${this.timezoneFormat(schedule.end_time, 'hh:mm A')}
                `;
            },
        }
    };
</script>
<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    li {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        box-shadow: inset 0px -1px 0px $quaternary;

        .information {
            flex: 1;
            padding-right: 12px;
        }

        .secondary {
            color: $tertiary;
        }
    }
</style>