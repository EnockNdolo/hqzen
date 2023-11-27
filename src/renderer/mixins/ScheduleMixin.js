const REGULAR = 1;

import TimezoneMixin from '@/mixins/TimezoneMixin';
import { mapGetters } from 'vuex';

const SECONDS_IN_HOUR = 3600;

export default {
    name: 'ScheduleMixin',

    mixins: [
        TimezoneMixin
    ],

    data() {
        return {
            currentTimeInterval: null,
            now: this.getMomentInstance()
        };
    },

    computed: {
        ...mapGetters('Employment', ['currentShiftOvertime']),

        shifts() {
            /**
             * shifts in the current week with proper dates
             */
            let today = new Date();
            let dayToday = today.getDay(); // 0 index

            let shifts = {};
            let sortedShifts = {};

            let employeeScheduleGroup = this.employment.schedule;

            employeeScheduleGroup.schedules.forEach(schedule => {
                let duration = this.getMomentInstance(schedule.end_time).diff(this.getMomentInstance(schedule.start_time));
                /**
                 * set date of schedule start time to today
                 */
                let startTime = this.getMomentInstance(schedule.start_time).set({
                    year: this.now.get('year'),
                    month: this.now.get('month'),
                    date: this.now.get('date')
                });

                let endTime = startTime.clone().add(duration, 'ms');

                schedule.days.forEach(day => {
                    /**
                     * makes shifts based on schedule's day
                     * difference from today's day
                     */
                    let daysToAdd = day - dayToday;
                    shifts[day] = {
                        startTime: startTime.clone().add(daysToAdd, 'days'),
                        endTime: endTime.clone().add(daysToAdd, 'days'),
                        schedule: schedule
                    }
                });

                // sort shifts to make sure they're arranged accordingly
                sortedShifts = Object.keys(shifts).sort().reduce((sortedShifts, key) => {
                    sortedShifts[key] = shifts[key];
                    return sortedShifts;
                }, {});

                Object.keys(sortedShifts).forEach(key => {
                    let current = sortedShifts[key];
                    let previous = sortedShifts[parseInt(key) - 1];
                    let next = sortedShifts[parseInt(key) + 1];

                    let medianStart = current.startTime;
                    let medianEnd = current.endTime;

                    /**
                     * compute for median between each shift
                     */
                    if (current.schedule.type_display !== 'Relax Flexi') {
                        medianStart = medianStart.clone().set({
                            hours: 0,
                            minutes: 0,
                            seconds: 0,
                            milliseconds: 0
                        });
                        medianEnd = medianEnd.clone().set({
                            hours: 23,
                            minutes: 59,
                            seconds: 59,
                            milliseconds: 59
                        });
                        if (previous) {
                            let durationBetweenPreviousShift = current.startTime.diff(previous.endTime);
                            let medianBetweenPreviousShift = Math.abs(durationBetweenPreviousShift / 2)
                            medianStart = current.startTime.clone().subtract(medianBetweenPreviousShift, 'ms');
                        }
                        if (next) {
                            let durationBetweenNextShift = next.startTime.diff(current.endTime);
                            let medianBetweenNextShift = Math.abs(durationBetweenNextShift / 2)
                            medianEnd = current.endTime.clone().add(medianBetweenNextShift, 'ms');
                        }
                    }

                    sortedShifts[key] = {
                        ...current,
                        medianStart,
                        medianEnd
                    }

                    return sortedShifts[key];
                });
            });
            return sortedShifts;
        },

        scheduleToday() {
            let schedule = null;
            if (this.employment) {
                Object.values(this.shifts).forEach(shift => {
                    let { medianStart, medianEnd } = shift;
                    if (medianStart && medianEnd && this.now.isBetween(medianStart, medianEnd)) {
                        schedule = shift;
                    }
                });
            }
            return schedule;
        },

        nextSchedule() {
            if (this.scheduleToday && this.now.isBefore(this.startTimeWithGracePeriod)) {
                return this.scheduleToday.startTime;
            }

            let today = new Date();
            let dayToday = today.getDay();

            let shiftDays = Object.keys(this.shifts);

            if (dayToday >= parseInt(shiftDays[shiftDays.length - 1])) {
                let firstDayOfTheWeek = shiftDays[0];
                return this.shifts[firstDayOfTheWeek].startTime.clone().add(7, 'days');
            }
            let nextShiftDay = shiftDays.find(day => {
                return parseInt(day) > dayToday;
            });

            return this.shifts[nextShiftDay].startTime;
        },

        startTimeWithGracePeriod() {
            if (this.scheduleToday) {
                let scheduleWithDates = this.scheduleToday;

                let gracePeriod = this.workforceEmployeeSettings.desktop_time_in_grace_period; // in seconds
                let startWithGracePeriod = scheduleWithDates.startTime.clone().subtract(gracePeriod, 'seconds');

                return startWithGracePeriod;
            }
            return null;
        },

        isOutsideSchedule() {
            if (this.scheduleToday && this.scheduleToday.schedule.breaks) {
                let shiftEndTime = this.scheduleToday.endTime;
                if (!!this.currentBreakTime) {
                    return true;
                }

                if (!this.now.isBetween(this.startTimeWithGracePeriod, shiftEndTime) && (this.shiftTimeLogs.length < 1)) {
                    return true;
                }

                if (!this.currentShiftOvertime) {
                    return !this.now.isBetween(this.startTimeWithGracePeriod, shiftEndTime);
                }
                return (this.currentShiftOvertime && this.remainingApprovedOvertime <= 0);

            }
            return true;
        },

        upcomingBreak() {
            if (this.scheduleToday && this.scheduleToday.schedule.breaks) {
                let upcomingBreak = null;
                this.scheduleToday.schedule.breaks.forEach(breakPeriod => {
                    let properScheduleBreak = this.getStartTimeAndEndTimeWithProperDate(
                        breakPeriod.start_time,
                        breakPeriod.end_time
                    );
                    let breakStartTime = properScheduleBreak.startTime;
                    let timeBeforeBreak = breakStartTime.diff(this.now, 'seconds');

                    if ( timeBeforeBreak <= 300 && timeBeforeBreak > 0) {
                        upcomingBreak = breakStartTime;
                        return;
                    }
                });
                return upcomingBreak;
            }

            return null;
        },

        currentBreakTime() {
            if (this.scheduleToday && this.scheduleToday.schedule.breaks) {
                let currentBreak = null;
                this.scheduleToday.schedule.breaks.find(breakPeriod => {
                    let properScheduleBreak = this.getStartTimeAndEndTimeWithProperDate(
                        breakPeriod.start_time,
                        breakPeriod.end_time
                    );
                    let breakStartTime = properScheduleBreak.startTime;
                    let breakEndTime = properScheduleBreak.endTime;

                    let gracePeriod = this.workforceEmployeeSettings.desktop_time_in_grace_period; // in seconds
                    let breakWithGracePeriod = breakEndTime.clone().subtract(gracePeriod, 'seconds');

                    if (this.now.isBetween(breakStartTime, breakWithGracePeriod)) {
                        currentBreak = properScheduleBreak;
                        return;
                    }
                });
                return currentBreak;
            }
            return null;
        },

        timeLeftBeforeBreak() {
            if (this.upcomingBreak) {
                return this.upcomingBreak.diff(this.now, 'seconds');
            }
            return -1;
        },

        timeLeftBeforeEndOfShift() {
            if (this.scheduleToday) {
                return this.scheduleToday.endTime.diff(this.now, 'seconds');
            }
            return -1;
        },

        remainingApprovedOvertime() {
            let otInSeconds = 0;
            if (this.currentShiftOvertime) {
                let { hours, minutes } = this.currentShiftOvertime;
                otInSeconds = (hours * 3600) + (minutes * 60);
            }

            return otInSeconds - (this.afterShiftHoursWorked * 3600); //in seconds
        },

        afterShiftHoursWorked() {
            if (!this.scheduleToday) return 0;
            let shiftStartTime = this.scheduleToday.startTime;
            let shiftEndTime = this.scheduleToday.endTime;

            let totalOvertime = this.shiftTimeLogs.reduce((totalOvertime, log) => {
                let timeIn = this.getMomentInstance(log.time_in);
                let timeOut = this.getMomentInstance(log.time_out);

                if (log.time_out && (timeOut.isBefore(shiftEndTime) && !timeOut.isBefore(shiftStartTime))) {
                    return totalOvertime;
                }

                if (!log.time_out && (this.now.isBefore(shiftEndTime) && !this.now.isBefore(shiftStartTime))) {
                    return totalOvertime;
                }

                if (log.time_out) {
                    if (timeIn.isBefore(shiftEndTime)) {
                        totalOvertime += timeOut.diff(shiftEndTime, 'seconds');
                    } else {
                        totalOvertime += (log.total_time * SECONDS_IN_HOUR);
                    }
                } else {
                    if (timeIn.isBefore(shiftEndTime)) {
                        totalOvertime += this.now.diff(shiftEndTime, 'seconds');
                    } else {
                        totalOvertime += this.now.diff(timeIn, 'seconds');
                    }
                }
                return totalOvertime;
            }, 0);

            return totalOvertime / SECONDS_IN_HOUR;
        },
    },

    created() {
        this.currentTimeInterval = setInterval(() => {
            this.now = this.getMomentInstance();
        }, 1000);
    },

    beforeDestroy() {
        clearInterval(this.currentTimeInterval);
        this.currentTimeInterval = null;
    },

    methods: {
        getStartTimeAndEndTimeWithProperDate(start, end) {
            let startTime = this.getMomentInstance(start).format('HH:mm A');
            let endTime = this.getMomentInstance(end).format('HH:mm A');
            if (endTime < startTime) {
                endTime = this.getMomentInstance(end).set({
                    year: this.now.get('year'),
                    month: this.now.get('month'),
                    date: this.now.get('date') + 1
                });
            } else {
                endTime = this.getMomentInstance(end).set({
                    year: this.now.get('year'),
                    month: this.now.get('month'),
                    date: this.now.get('date')
                });
            }
            startTime = this.getMomentInstance(start).set({
                year: this.now.get('year'),
                month: this.now.get('month'),
                date: this.now.get('date')
            });

            return {
                startTime: startTime,
                endTime: endTime
            }
        }
    }
}
