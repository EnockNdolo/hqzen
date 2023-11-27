const MONTHS_OF_YEAR = 12;

import {mapState, mapActions} from 'vuex';
import TimezoneMixin from '@/mixins/TimezoneMixin';

export default {
    name: 'PayrollMixin',

    mixins: [TimezoneMixin],

    computed: {
        ...mapState('Payroll', ['payrollConstants']),
    },

    async created() {
        if (Object.keys(this.payrollConstants).length === 0) {
            await this.fetchPayrollConstants();
        }
    },

    methods: {
        ...mapActions('Payroll', ['fetchPayrollConstants']),

        /**
            Compute hourly salary from given monthly salary.
            @param {String} monthlySalary    The amount of monthly salary
            @param {Object} employment       Employment object of an employee
            returns {String}
        */
        computeHourlySalary(monthlySalary, compensatedDays=5) {
            const {
                FIVE_DAYS_WORKWEEK_WORKING_DAYS_PER_YEAR,
                SIX_DAYS_WORKWEEK_WORKING_DAYS_PER_YEAR,
                REQUIRED_HOURS_DAILY
            } = this.payrollConstants;

            let monthlyAmount = parseFloat(monthlySalary);
            let workingDaysPerWeek = FIVE_DAYS_WORKWEEK_WORKING_DAYS_PER_YEAR;

            if (compensatedDays == 6) {
                workingDaysPerWeek = SIX_DAYS_WORKWEEK_WORKING_DAYS_PER_YEAR;
            }

            let hourly = (monthlyAmount * MONTHS_OF_YEAR)
                / workingDaysPerWeek / REQUIRED_HOURS_DAILY;
            return this.formatValue(hourly);
        },

        /**
            Reduces a given value to two decimal places.
            @param {Float} value
            returns {String}
        */
        formatValue(value) {
            return value.toLocaleString(
                undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6}
            );
        },

        /**
            Compute time difference of current time and given timestamp
            @param {String} timestamp
            returns {Float}
        */
        computeTimeDifferenceInHours(timestamp) {
            let now = this.getMomentInstance();
            let referenceTime = this.getMomentInstance(timestamp);
            return now.diff(referenceTime, 'hours', true);
        },
    },



};
