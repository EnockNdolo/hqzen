<template>
    <div class="timelogs-container">
        <header class="main-title sticky">
            <h1>Employment</h1>
        </header>

        <section class="employment">
            <header class="mini-details">
                <h2>My Job</h2>
                <button
                    :disabled="isSyncing || !isOnline"
                    class="sync"
                    @click="syncHandler"
                >
                    <template v-if="isSyncing">
                        Syncing
                    </template>
                    <template v-else>
                        Sync
                    </template>
                </button>
                <i
                    class="material-icons mdi mdi-sync"
                    :class="{ 'syncing': isSyncing }"
                    @click="syncHandler"
                ></i>
            </header>
            <Timelogger
                :value="timedIn"
                :hours-worked="hoursWorked"
                :task-hours-worked="taskHoursWorked"
                :disabled="isTimingInOut || isSyncing || !isOnline || !canTimeIn.success || !canTimeOut"
                @toggle="toggleTask"
                @mark-task-as-done="markTaskAsDone($event)"
                @switch-scheduled-task="toggleTask"
                @pause-tracking="$emit('pause-time-tracking')"
            />
            <div class="jobs">
                <section class="job-item">
                    <template v-if="employment">
                        <header>
                            <div>
                                <h3>{{ employment.job_position }}</h3>
                                <div>{{ employment.company_name }}</div>
                            </div>
                        </header>

                        <div v-if="employment" class="payroll">
                            Current Payroll: {{ currentPayrollPeriod }}
                            <div class="stats">
                                <div class="col">
                                    Hours worked today
                                    <div class="emphasis">
                                        {{ hoursWorkedToday }}
                                    </div>
                                </div>
                                <div class="col" v-if="!employment.current_salary_rate.is_fixed_rate">
                                    {{ earningsLabel }}
                                    <div class="emphasis">
                                        <BaseCurrency
                                            :value="totalEarnings"
                                            :reference-date="employment.salary_when"
                                        />
                                    </div>
                                </div>
                                <div class="col">
                                    {{ employment.current_salary_rate.is_fixed_rate ?
                                        'Monthly Salary' : 'Hourly Wage' }}
                                    <div class="emphasis">
                                        <BaseCurrency
                                            :value="employment.current_salary_rate.amount"
                                            :reference-date="employment.salary_when"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <footer>
                            <a class="external-link" @click="goToPayrollPeriod">
                                View Payroll Period
                                <i class="mdi mdi-launch"></i>
                            </a>
                        </footer>
                    </template>
                </section>
            </div>
        </section>

        <section v-if="employment" class="schedule">
            <header>
                <h2>Shift Schedule</h2>
            </header>
            <div class="schedules">
                <ScheduleItem :employment="employment" />
            </div>
        </section>
    </div>
</template>

<script>
    import { mapState, mapGetters, mapMutations } from 'vuex';
    import TimezoneMixin from '@/mixins/TimezoneMixin';
    import ExternalLinkMixin from '@/mixins/ExternalLinkMixin';
    import BaseCurrency from '@/components/_generics/BaseCurrency.vue';
    import ScheduleItem from '@/components/dashboard/timelogs/ScheduleItem.vue';
    import Timelogger from '@/components/dashboard/Timelogger.vue';
    import PayrollMixin from '@/mixins/PayrollMixin';

    const COMPENSATION_CHOICE_HOURLY = 'Hourly';
    const COMPENSATION_CHOICE_MONTHLY = 'Monthly';

    export default {
        name: 'TimeLogs',

        components: {
            BaseCurrency,
            ScheduleItem,
            Timelogger
        },

        mixins: [
            ExternalLinkMixin,
            TimezoneMixin,
            PayrollMixin
        ],

        props:{
            employment: {
                type: Object,
                default: null,
            },
            isSyncing: {
                type: Boolean,
                required: true
            },
            timedIn: {
                type: Boolean,
                required: true
            },
            hoursWorked: {
                type: Number,
                required: true
            },
            isOvertime: {
                type: Boolean,
                required: true
            },
            isOnline: {
                type: Boolean,
                required: true
            },
            canTimeIn: {
                type: Object,
                required: true
            },
            isTimingInOut: {
                type: Boolean,
                required: true
            },
            taskHoursWorked: {
                type: Number,
                required: true
            },
        },

        data() {
            return {};
        },

        computed: {
            ...mapState('Sites', ['sites']),
            ...mapGetters('Tasks', ['runningTaskAssignment']),

            currentlySelectedTask () {
                return this.runningTaskAssignment || {};
            },

            currentPayrollPeriod() {
                let payrollPeriod = this.employment.current_payroll_period;
                return this.timezoneFormat(payrollPeriod.start_date, 'MMMM DD (h:mm A)') + ' - ' +
                    this.timezoneFormat(payrollPeriod.end_date, 'MMMM DD (h:mm A)');
            },

            decimalHoursWorked() {
                return this.hoursWorked / 3600;
            },

            hoursWorkedToday() {
                return this.convertNumToTime(this.hoursWorked);
            },

            earningsLabel() {
                return this.employment.current_salary_rate.is_fixed_rate ?
                    'Total Earnings' : 'Today\'s earnings';
            },

            monthlyRate() {
                return this.employment.salary_amount;
            },

            hourlyRate() {
                return this.computeHourlySalary(this.employment.salary_amount);
            },

            // TODO transfer to Dashboard.vue (jc@bposeats.com)
            // lastTimeInSource() {
            //     if (this.payroll.current_shift.last_time_in_source) {
            //         return this.payroll.current_shift.last_time_in_source.toLowerCase();
            //     }
            //     return 'desktop';
            // },

            canTimeOut() {
                // disallow time out when time in is done on another platform

                // TODO transfer to Dashboard.vue (jc@bposeats.com)
                // return this.timedIn ? this.lastTimeInSource == 'desktop' : true;
                return true;
            },

            toolTipText() {
                if (!this.isOnline) {
                    return 'You are offline!';
                } else if (!this.canTimeOut) {
                    return `You are timed in using the ${this.lastTimeInSource} app.`;
                } else if (!this.canTimeIn.success) {
                    let error = this.canTimeIn.error_message;
                    if (error == 'Unauthorized Network') {
                        return 'Cannot work remotely!';
                    } else if (error == 'Unauthorized Platform') {
                        return 'Timelogging is only allowed on the mobile app.';
                    } else {
                        return error;
                    }
                }
                return '';
            },

            totalEarnings() {
                console.log('this.employment ', this.employment);
                console.log('this.employment.salary_amount ', this.employment.salary_amount);
                console.log('this.hoursWorked ', this.hoursWorked);
                let current_salary_rate_obj = this.employment.current_salary_rate;
                if(current_salary_rate_obj.compensation_type_display == COMPENSATION_CHOICE_MONTHLY)
                    return this.employment.salary_amount;
                if(current_salary_rate_obj.compensation_type_display == COMPENSATION_CHOICE_HOURLY)
                    return this.employment.salary_amount * this.hoursWorked;
            },
        },

        methods: {
            ...mapMutations('Tasks', ['setSelectedTaskAssignment']),

            goToPayrollPeriod() {
                this.openExternalLink(
                    this.sites.APPLYBPO_URL + '/employments/'
                        + this.employment.current_employee_payroll_id + '/timelog-page');
            },

            convertNumToTime(number) {
                let hours = Math.floor(number);
                let hoursPadded = hours < 10 ? '0' + hours : hours;
                let n = new Date(0,0);
                n.setMinutes(+number * 60);
                let time = n.toTimeString().slice(3, 5);
                return hoursPadded + ' Hours, ' + time + ' Minutes';
            },

            syncHandler() {
                this.$emit('perform-sync');
            },

            markTaskAsDone(data) {
                this.setSelectedTaskAssignment(null);
                this.$emit('toggle-time-switch', data);
            },

            toggleTask(value) {
                let data = {
                    'componentName': 'Tasks',
                    'value': value
                };
                this.$emit('toggle-time-switch', data);
            }
        },
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';>

    .timelogs-container {
        position: relative;
    }

    .sticky {
        padding-top: 56px;
        padding-bottom: 20px;
        position: sticky;
        top: 0;
        z-index: 4;
        background: $white;
    }

    .employment {
        margin-top: 12px;
    }

    .jobs {
        margin-top: 12px;
    }

    .mini-details {
        display: flex;
    }

    .sync {
        margin-left: auto;
        padding: 0;
        font-weight: 500;
        color: var(--primary);
        cursor: pointer;
    }

    .material-icons {
        vertical-align: sub;
        font-size: 16px;
    }

    h2 {
        margin: 20px 0 0;
        font-weight: bold;
        font-size: 16px;
        color: var(--black-secondary);
    }

    .mini-details h2 {
        margin-top: 0;
    }

    .mini-details i {
        margin-left: 4px;
        color: var(--primary);
        cursor: pointer;
    }

    .syncing {
        animation: rotate 1.8s ease infinite;
    }

    @keyframes rotate {
        from {
            transform: rotate(360deg);
        }

        to {
            transform: rotate(0deg);
        }
    }

    /* Job Item Styles */
    .job-item {
        background-color: var(--primary-l95);
        padding: 12px;
        border-radius: 4px;
    }

    .job-item header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    @media all and (max-width: 560px) {
        .job-item header {
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
        }

        .job-item .indicator-and-switch {
            order: 1;
            margin-left: auto;
        }

        .job-item header > div:not(.indicator-and-switch) {
            order: 2;
            margin-top: 10px;
        }
    }

    h3 {
        margin: 0;
        font-weight: 600;
        font-size: 16px;
    }

    h3 + div {
        margin-top: 4px;
        color: var(--black-secondary);
    }

    .payroll {
        margin-top: 24px;
    }

    .stats {
        display: flex;
        flex-wrap: wrap;
    }

    .stats .col {
        margin-top: 12px;
        text-transform: capitalize;
        width: 50%;
        color: var(--black-secondary);
    }

    .emphasis {
        margin-top: 2px;
        font-size: 16px;
        font-weight: 500;
        color: var(--primary);
    }

    footer {
        margin-top: 24px;
    }

    .external-link {
        cursor: pointer;
    }

    .external-link i {
        vertical-align: sub;
        margin-left: 6px;
        font-size: 15px;
    }

    .indicator-and-switch {
        display: flex;
        flex-shrink: 0;
    }

    .tooltip-wrapper{
        margin-top: auto;
        position: relative;
    }

    .tooltip-wrapper .tooltip {
        visibility: hidden;
    }

    .tooltip-wrapper:hover .tooltip {
        visibility: visible;
    }

    .main-title {
        z-index: 1;
    }
</style>
