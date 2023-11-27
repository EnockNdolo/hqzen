<template>
    <section v-if="employment" class="schedule-item">
        <div
            v-for="schedule of employment.schedule.schedules"
            :key="schedule.pk"
            class="schedule-container"
        >
            <header>
                {{ showDays(schedule.days_str) }}
            </header>

            <div class="row">
                <div
                    v-if="!employment.is_flexible"
                    class="col"
                >
                    <i class="material-icons mdi mdi-timelapse"></i>
                    <div class="time">
                        {{ getScheduleTime(schedule.start_time) }} to
                        {{ getScheduleTime(schedule.end_time) }}
                    </div>
                </div>
                <div
                    v-else
                    class="col"
                >
                    <i class="material-icons mdi mdi-timelapse"></i>
                    <div class="time">
                        Flexible Schedule
                    </div>
                </div>

                <div v-if="!employment.is_flexible" class="col break-col">
                    <i class="material-icons mdi mdi-coffee-outline"></i>
                    <div class="time">
                        Break:
                    </div>
                    <div class="break-time">
                        <div
                            v-for="breakTime of schedule.breaks"
                            :key="breakTime.pk"
                        >
                            <template v-if="breakTime.start_time && breakTime.end_time">
                                <div class="time">
                                    {{ getScheduleTime(breakTime.start_time) }} to
                                    {{ getScheduleTime(breakTime.end_time) }}
                                </div>
                            </template>
                            <template v-else>
                                <div class="time">
                                    {{ breakTime.duration }} minutes
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
                <div v-else class="col">
                    <i class="material-icons">local_cafe</i>
                    No Break Schedule
                </div>
            </div>
        </div>
        <div
            v-if="employment.schedule.schedule_type_display == 'Strict Flexi'"
            class="row buffer"
        >
            <span class="buffer-time">Buffer Time: </span>
            <span class="buffer-hours"> {{ employment.schedule.buffer_hours }}
                {{ employment.schedule.buffer_hours > 1 ? 'Hours' : 'Hour' }}
            </span>
        </div>

        <footer>
            <a class="external-link" @click="goToShift">
                See Current Shift
                <i class="material-icons mdi mdi-launch"></i>
            </a>
        </footer>
    </section>
</template>

<script>
    import { mapGetters, mapActions, mapState } from 'vuex';
    import TimezoneMixin from '@/mixins/TimezoneMixin';
    import ExternalLinkMixin from '@/mixins/ExternalLinkMixin';

    export default {
        name: 'ScheduleItem',

        mixins: [
            TimezoneMixin,
            ExternalLinkMixin
        ],

        props: {
            employment: {
                type: Object,
                required: true
            }
        },

        computed: {
            ...mapState('Sites', ['sites']),
            ...mapGetters('Employment', ['currentEmployment']),
        },

        methods: {
            ...mapActions('Employment', ['fetchEmploymentData']),

            getScheduleTime(schedule) {
                return this.timezoneFormat(schedule, 'hh:mm A');
            },

            showDays(days) {
                if (days.length > 1) {
                    return days.slice(0, days.length - 1).join(', ') + ', and ' + days[days.length - 1];
                }
                return days[0];
            },

            goToShift() {
                this.openExternalLink(this.sites.APPLYBPO_URL + '/dashboard/employments');
            }
        },
    };
</script>

<style scoped>
    header {
        font-weight: bold;
        margin-bottom: -2px;
    }

    .schedule-item {
        background-color: var(--primary-l95);
        margin-top: 8px;
        padding: 12px;
    }

    .schedule-container:not(:first-child) {
        margin-top: 16px;
    }

    .row {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
    }

    .col {
        display: flex;
        align-items: flex-start;
        padding: 8px 0;
        width: 50%;
    }

    .time {
        line-height: 28px;
    }

    .material-icons {
        margin-right: 12px;
        font-size: 20px;
        color: var(--black-disabled);
    }

    footer {
        margin-top: 16px;
    }

    .external-link {
        cursor: pointer;
    }

    .external-link i {
        vertical-align: sub;
        margin-left: 6px;
        font-size: 15px;
        color: inherit;
    }

    .break-time {
        display: flex;
        flex-direction: column;
        margin-left: 12px;
    }

    .buffer {
        display: flex;
        justify-content: flex-start;
    }

    .buffer-time {
        font-weight: bold;
        margin-right: 6px;
    }

    .buffer-hours {
        color: var(--primary);
        font-weight: bold;
    }

    .break-col {
        display: flex;
        align-items: flex-start;
    }
</style>
