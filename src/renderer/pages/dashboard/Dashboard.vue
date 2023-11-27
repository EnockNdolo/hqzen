<template>
    <div class="main-content">
        <Sidebar
            v-if="employment"
            :timed-in="timedIn"
            :is-syncing="syncing"
            :total-points-earned="employment.current_points_earned"
            :timed-in-on-another-device="timedInOnAnotherDevice"
            :workforces="workforces"
            @sidebar-expand="$emit('sidebar-expand', $event)"
            @select-workforce="modalToShow = 'selectWorkforceModal'"
        />
        <template v-if="syncing || sending">
            <div class="loading-wrapper">
                <LoadingSpinner class="large" />
            </div>
        </template>
        <template v-else-if="!(employment && workforces)">
            <div class="message-container">
                <div class="message-contents">
                    <i class="mdi mdi-alert-circle-outline message-icon"></i>
                    <div>
                        <div>
                            <h1 class="message p-h1">
                                Your employment hasn't been finalized yet.
                            </h1>
                            <p class="subtext ">
                                Please contact your employer for more information or email bugreport@bposeats.com
                                if you think this is wrong.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template v-else>
            <main>
                <router-view
                    v-if="canTimeIn"
                    ref="view"
                    :employment="employment"
                    :timed-in="timedIn"
                    :timed-in-on-another-device="timedInOnAnotherDevice"
                    :running-time-device="latestTimeLogDeviceName"
                    :is-syncing="syncing"
                    :is-timing-in-out="isTimingInOut"
                    :hours-worked="hoursWorked"
                    :task-hours-worked="taskHoursWorked"
                    :is-overtime="overtimeLeft <= 0"
                    :is-online="isOnline"
                    :can-time-in="canTimeIn"
                    :on-unauthorized-network="onUnauthorizedNetwork"
                    :current-task-assignment-pk="currentTaskAssignmentPk"
                    :workforce-employee-settings="workforceEmployeeSettings"
                    :workforce-name="currentWorkforceName"
                    :is-mobile-timelogging-allowed="allowedPlatform.mobile"
                    :is-desktop-timelogging-allowed="allowedPlatform.desktop"
                    :shift-time-logs="shiftTimeLogs"
                    @perform-sync="fetchData"
                    @toggle-time-switch="toggleTimeSwitch"
                    @switch-platform="switchPlatform($event)"
                    @pause-time-tracking="showPauseTimeTrackingModal = true"
                />
            </main>
        </template>
        <UnproductiveWebsiteModal
            v-if="modalToShow === 'unproductiveWebsiteModal'"
            :website-name="currentUnproductiveSite"
            @close="handleUnproductiveAlertBehavior(false)"
            @time-out="handleUnproductiveAlertBehavior(true)"
        />
        <SingleDeviceWarningModal
            v-if="modalToShow === 'singleDeviceWarningModal'"
            :device-name="latestTimeLogDeviceName"
            @dismiss="modalToShow = ''"
            @time-in-on-current-device="forceTimeInOnCurrentDevice"
        />
        <CustomModal
            v-if="customPopupMessage"
            :message-primary="customPopupMessage"
            :message-secondary="messageSecondary"
            :icon="customModalIcon"
            :is-dismissable="customModalMessageIsDismissable"
            :icon-color="iconColor"
            :go-to-apply-bpo="goToApplyBpo"
            @close="customPopupMessage = ''"
            @redirect="goToApplyBpoHandler"
        />
        <LowActivityModal
            v-if="modalToShow === 'lowActivityModal'"
            @close="handleLowActivityAlertBehaviour(false, true)"
            @not-working="handleLowActivityAlertBehaviour(true, true)"
            @auto-timeout="handleLowActivityAlertBehaviour(true, false)"
        />
        <SelectWorkforceModal
            v-if="workforces && modalToShow === 'selectWorkforceModal'"
            :workforces="workforces"
            :current-workforce-id="currentWorkforceId"
            @close="closeSelectWorkforceModal"
        />
        <WorkingOnMobileModal
            v-if="mobileTimeIn && !closeSwitchToDesktopModal"
            :running-task="runningTaskTitle"
            @switch="switchToDesktop"
        />
        <WorkRemotelyModal
            v-if="modalToShow === 'workRemotelyModal'"
            :ip-address="ipAddress"
            @send-email="sendEmailToWorkRemotely"
            @close="closeWorkRemotelyModal"
        />
        <NoConnectionModal
            :timed-in="timedIn"
            @connection-status-change="isOnline = $event"
            @offline-time="offlineTime = $event"
        />
        <PauseTimeTrackingModal
            v-if="showPauseTimeTrackingModal"
            @pause-time-tracking="pauseTrackingOnTask"
            @close="showPauseTimeTrackingModal = false"
        />
    </div>
</template>

<script>
    import electron, {ipcRenderer} from 'electron';
    import { mapActions, mapState, mapGetters, mapMutations } from 'vuex';
    import publicIP from 'public-ip';
    import os from 'os';
    import Sidebar from '@/components/Sidebar.vue';
    import SelectWorkforceModal from '@/components/dashboard/SelectWorkforceModal.vue';
    import SingleDeviceWarningModal from '@/components/dashboard/SingleDeviceWarningModal.vue';
    import log from 'electron-log';
    import LoadingSpinner from '@/components/_generics/LoadingSpinner.vue';
    import UnproductiveWebsiteModal from '@/components/dashboard/UnproductiveWebsiteModal.vue';
    import LowActivityModal from '@/components/dashboard/LowActivityModal.vue';
    import WorkRemotelyModal from '@/components/dashboard/WorkRemotelyModal.vue';
    import NoConnectionModal from '@/components/dashboard/NoConnectionModal.vue';
    import WorkingOnMobileModal from '@/components/dashboard/WorkingOnMobileModal.vue';
    import CustomModal from '@/components/dashboard/CustomModal.vue';
    import PauseTimeTrackingModal from '@/components/dashboard/PauseTimeTrackingModal.vue';

    import ScreenshotMixin from '@/mixins/ScreenshotMixin';
    import TrackUserActivityMixin from '@/mixins/TrackUserActivityMixin';
    import CurrencyMixin from '@/mixins/CurrencyMixin';
    import PayrollMixin from '@/mixins/PayrollMixin';
    import ScheduleMixin from '@/mixins/ScheduleMixin';
    import MouseKeyboardActivityMixin from '@/mixins/MouseKeyboardActivityMixin';
    import ExternalLinkMixin from '@/mixins/ExternalLinkMixin';
    import AutoClickerMixin from '@/mixins/AutoClickerMixin';

    const DESKTOP = 1;
    const MOBILE = 2;
    const SECONDS_IN_MINUTE = 60;
    const IDLE_TIME_LOWER_LIMIT = 7.6;  // in minutes
    const IDLE_TIME_UPPER_LIMIT = 11.5;  // in minutes
    const ACTIVE_TIME_LOWER_LIMIT = 1.4;  // in minutes
    const ACTIVE_TIME_UPPER_LIMIT = 2.5;  // in minutes
    const INCREMENT_LOWER_LIMIT = 1; // in minutes
    const INCREMENT_UPPER_LIMIT = 1.3; // in minutes

    const EMPTY_MAC_ADDRESS = '00:00:00:00:00:00';
    const LOCALHOST_ADDRESS = '127.0.0.1';


    export default {
        name: 'Dashboard',

        components: {
            Sidebar,
            LoadingSpinner,
            SingleDeviceWarningModal,
            UnproductiveWebsiteModal,
            LowActivityModal,
            WorkRemotelyModal,
            NoConnectionModal,
            WorkingOnMobileModal,
            CustomModal,
            SelectWorkforceModal,
            PauseTimeTrackingModal,
        },

        mixins: [
            ScreenshotMixin,
            TrackUserActivityMixin,
            CurrencyMixin,
            MouseKeyboardActivityMixin,
            PayrollMixin,
            ScheduleMixin,
            ExternalLinkMixin,
            AutoClickerMixin,
        ],

        data() {
            return {
                modalToShow: '',
                employment: null,
                syncing: false,
                activityInterval: null,
                updateActivitiesInterval: null,
                subtractSecondsInterval: null,
                idleTimeInterval: null,
                hoursWorked: 0,
                overtimeLeft: 0,
                unproductiveAlertTime: 0,
                currentUnproductiveSite: null,
                startMouseKeyboard: false,
                canTimeIn: null,
                onUnauthorizedNetwork: false,
                allowedPlatformModalShown: false,
                customPopupMessage: '',
                messageSecondary: '',
                customModalIcon: '',
                iconColor: 'red',
                runningTaskTitle: 'No task selected',
                initialTaskTimeSpent: 0,
                workforces: [],
                workforceEmployeeSettings: null,
                shiftTimeLogs: [],
                taskShiftTimeLogs: [],
                isTimingInOut: false,
                closeSwitchToDesktopModal: false,
                taskHoursWorked: 0,
                checkForAutoClickers: null,
                autoClickers: null,
                isOnline: null,
                offlineTime: null,
                sending:false,
                ipAddress:'',
                idleStatesCount: 0,
                activeStatesCount: 0,
                showPauseTimeTrackingModal: false,
                customModalMessageIsDismissable: true
            };
        },

        eventBusCallbacks: {
            'workforce-employee-settings-changed': 'fetchWorkforceSettings',
            'employment-changed': 'fetchEmployment',
            'user-timed-in-out': 'fetchShiftTimeLogs',
            'socket-connection-open': 'fetchData',
            'clear-acknowledgements': 'clearAcknowledgements',
            'new-ir-with-required-acknowledgement': 'notifyRequiredAcknowledgements',
            'new-memo-posted': 'notifyRequiredAcknowledgements'
        },

        computed: {
            ...mapState('Auth', ['user']),
            ...mapState('Sites', ['sites']),
            ...mapGetters('Employment', ['currentEmployment', 'currentWorkforceId', 'currentShiftOvertime']),
            ...mapGetters('Tasks', ['runningTaskAssignment']),

            hourlySalaryRate() {
                return this.computeHourlySalary(this.employment.salary_amount);
            },

            isTaskInactivityAllowed() {
                return (this.runningTaskAssignment
                    && this.runningTaskAssignment.task.scheduled_task
                    && this.runningTaskAssignment.task.scheduled_task.is_inactivity_allowed);
            },


            // ------------------------------------------------HERE------------------------------------------------

            latestTimeLog() {
                if (this.shiftTimeLogs.length > 0) {
                    console.log('hee ', this.shiftTimeLogs[this.shiftTimeLogs.length - 1])
                    return this.shiftTimeLogs[this.shiftTimeLogs.length - 1];
                }
                return null;
            },

            latestRunningTaskTimeLog() {
                if (this.taskShiftTimeLogs.length > 0) {
                    console.log('hee taskShiftTimeLogs ', this.taskShiftTimeLogs[this.taskShiftTimeLogs.length - 1])
                    return this.taskShiftTimeLogs[this.taskShiftTimeLogs.length - 1];
                }
                console.log('this.shiftTimeLogs ', this.shiftTimeLogs)
                if (this.runningTaskAssignment){
                    let runningTaskAssignment = JSON.parse(JSON.stringify(this.runningTaskAssignment))
                    console.log('this.taskShiftTimeLogs ---->>>>', this.taskShiftTimeLogs)
                    console.log('this.runningTaskAssignment.task.pk ', runningTaskAssignment.task.pk)
                    //fetch timelogs for this task
                    // get last one
                    // filter with its pk
                    // this.taskShiftTimeLogs = await this.fetchTimeLogs({
                    //     'employment_id': this.currentEmployment.pk,
                    //     'task_id': runningTaskAssignment.task.pk
                    // })
                    // console.log('check this 13 ', this.taskShiftTimeLogs)
                    const matchesRunninTaskAssignmentPK = () => {
                        // console.log('check this ', runningTaskAssignment)
                        return (shiftTimeLog) => shiftTimeLog.task.pk == runningTaskAssignment.task.pk;
                    }
                    let latestRunningTimelog = this.taskShiftTimeLogs
                        .slice()
                        .reverse()
                        .find(matchesRunninTaskAssignmentPK);
                    console.log('latestRunningTimelog ', latestRunningTimelog)
                    return latestRunningTimelog;
                }
            },


            latestTimeLogDeviceName() {
                if (this.latestTimeLog) {
                    if (this.latestTimeLog.time_in_source_display === 'Mobile') {
                        return 'Mobile';
                    }
                    return this.latestTimeLog.device_host_name;
                }
                return '';
            },


            shiftHoursWorked() {
                let result = 0;
                if (this.shiftTimeLogs.length > 0) {
                    this.shiftTimeLogs.forEach(timeLog => {
                        result += timeLog.total_time;
                    });
                }
                return result;
            },

            currentWorkforceName() {
                let currentWorkforce = this.workforces.filter(workforce => {
                    return workforce.pk == this.currentWorkforceId;
                });
                if (currentWorkforce.length) {
                    return currentWorkforce[0].name;
                }
                return '';
            },

            mobileTimeIn() {
                return (this.latestTimeLog
                    && this.latestTimeLog.time_in_source == MOBILE
                    && this.timedIn);
            },

            taskShiftTimeSpent() {
                let taskTimeLogs = this.shiftTimeLogs.filter(
                    timeLog => timeLog.task_assignment_id == this.currentTaskAssignmentPk);
                let shiftTimeSpent = 0;
                taskTimeLogs.forEach(timeLog => {
                    shiftTimeSpent += timeLog.total_time;
                });
                return shiftTimeSpent;
            },

            allowedPlatform() {
                let allowedPlatform = {
                    'mobile': this.workforceEmployeeSettings.is_mobile_timelogging_allowed,
                    'desktop': this.workforceEmployeeSettings.is_desktop_timelogging_allowed,
                };
                return allowedPlatform;
            },

            timedIn() {
                return this.latestTimeLog ? !this.latestTimeLog.time_out : false;
            },

            currentTaskAssignmentPk() {
                return this.latestTimeLog ? this.latestTimeLog.task_assignment_id : null;
            },

            timedInOnAnotherDevice() {
                return !!(
                    this.latestTimeLog &&
                    !this.latestTimeLog.time_out &&
                    this.latestTimeLogDeviceName != this.currentDeviceHostName
                );
            },

            currentMACAddress() {
                let networkInterfaces = os.networkInterfaces();
                let mac = '';
                Object.values(networkInterfaces).forEach(networkInterface => {
                    networkInterface.forEach(network =>  {
                        if (network.family !== 'IPv4'
                            && network.mac !== EMPTY_MAC_ADDRESS
                            && network.address !== LOCALHOST_ADDRESS
                        ) {
                            mac = network.mac;
                        }
                    });
                });
                return mac;
            },

            currentDeviceHostName() {
                let hostName = os.hostname();
                let platform = os.platform();
                let knownPlatforms = {
                    darwin: 'Mac',
                    win32: 'Windows',
                    linux: 'Linux'
                };
                platform = platform.replace(platform, knownPlatforms[platform]);
                hostName = hostName.endsWith('s') ? `${hostName}'` : `${hostName}'s`;
                return `${hostName} ${platform} Desktop`;
            }
        },

        watch: {
            async isOnline() {
                if (this.isOnline) {
                    await this.fetchData();
                    if (this.timedIn) {
                        this.startIntervals();
                    }
                } else {
                    this.modalToShow = '';
                    if (this.timedIn) {
                        this.clearIntervals();
                    }
                }
            },

            async offlineTime() {
                if (this.offlineTime <= 0) {
                    let data = { 'value': false };
                    await this.toggleTimeSwitch(data);
                    this.clearIntervals();
                }
            },

            runningTaskAssignment(value) {
                if (value) {
                    this.initialTaskTimeSpent = this.runningTaskAssignment.time_spent;
                    this.runningTaskTitle = this.runningTaskAssignment.task.title;
                } else {
                    this.runningTaskTitle = 'No task selected';
                }
                // update the activity bar
                ipcRenderer.send('sync-main', {
                    canTimeIn: this.canTimeIn.success,
                    isSyncing: this.syncing,
                    isTimedIn: this.timedIn,
                    taskName: this.runningTaskTitle,
                    hoursWorked: this.hoursWorked
                });
            },

            hoursWorked() {
                // update the activity bar
                ipcRenderer.send('sync-main', {
                    canTimeIn: this.canTimeIn.success,
                    isTimedIn: this.timedIn,
                    taskName: this.runningTaskTitle,
                    hoursWorked: this.hoursWorked
                });
            },

            async canTimeIn() {
                if (this.canTimeIn && !this.canTimeIn.success) {
                    this.modalToShow = '';
                    this.allowedPlatformModalShown = false;
                    this.customPopupMessage = '';
                    if (this.canTimeIn.error_message == 'Unauthorized Network') {
                        this.onUnauthorizedNetwork = true;
                        if (this.timedIn) {
                            let data = { 'value': false };
                            await this.toggleTimeSwitch(data);
                        }
                        if (this.modalToShow !== 'workRemotelyModal') {
                            this.modalToShow = 'workRemotelyModal';
                            ipcRenderer.send('show-window');
                        }
                    } else if (this.canTimeIn.error_message == 'Unauthorized Platform') {
                        if (!this.allowedPlatformModalShown) {
                            this.customPopupMessage = 'You are not allowed to time in.';
                            this.messageSecondary = 'Timelogging is only allowed in the mobile application.';
                            this.customModalIcon = 'timer-off-outline';
                            this.goToApplyBpo = false;
                            this.allowedPlatformModalShown = true;
                            ipcRenderer.send('show-window');
                        }
                    } else if (this.canTimeIn.error_message == 'Employment Locked') {
                        this.customPopupMessage = 'Finalizing your employment.';
                        this.messageSecondary = 'Will notify you as soon as you\'re good to go.';
                        this.customModalIcon = 'briefcase-clock-outline';
                        this.iconColor = 'yellow';
                        this.goToApplyBpo = false;
                    }

                    if (this.timedIn) {
                        let data = { 'value': false };
                        await this.toggleTimeSwitch(data);
                    }
                }
            },

            timedIn: {
                handler() {
                    if (this.timedIn && !this.timedInOnAnotherDevice) {
                        this.startIntervals();
                        this.startUpdateActivitiesInterval();
                        this.startMouseKeyboard = true;
                    } else {
                        if (!this.timedInOnAnotherDevice) {
                            this.setSelectedTaskAssignment(null);
                        }
                        this.clearIntervals();
                        this.updateActivities();
                        this.startMouseKeyboard = false;
                    }

                    this.updateTrayDisplay();
                    localStorage.setItem('timedIn', this.timedIn);
                    this.$emit('switched-time', this.timedIn);
                },
                deep: true,
                immediate: true
            },

            runningTaskTitle() {
                this.updateTrayDisplay();
            },

            startMouseKeyboard() {
                if (this.startMouseKeyboard
                    && this.workforceEmployeeSettings.is_desktop_mouse_keyboard_collection_allowed
                    && this.timedIn) {
                    this.startMKTracker();
                } else {
                    this.stopMKTracker();
                }
            },

            workforceEmployeeSettings: {
                handler() {
                    this.updateIntervals();
                    if (this.timedIn) {
                        this.startMouseKeyboard = this.workforceEmployeeSettings.
                            is_desktop_mouse_keyboard_collection_allowed;
                    }
                },

                deep: true
            },

            mobileTimeIn() {
                if (this.mobileTimeIn) {
                    this.closeSwitchToDesktopModal = false;
                }
            }
        },

        async created() {
            await this.fetchData();
            this.clearSubtractSecondsInterval();
            this.startSubtractSecondsInterval();

            sessionStorage.setItem('screenshotTimerIsRunning', false);

            ipcRenderer.on('toggle-timelog', async (event, arg) => {
                this.customPopupMessage = '';
                this.modalToShow = '';
                let data = { 'value': arg };
                await this.toggleTimeSwitch(data);
                this.setSelectedTaskAssignment(null);
            });

            ipcRenderer.on('sync', async (event, arg) => {
                await this.fetchData();
            });

            ipcRenderer.send('create-activity-bar');
        },

        beforeDestroy() {
            this.clearIntervals();
            this.clearSubtractSecondsInterval();
            this.setScheduledTasks(null);
        },

        methods: {
            ...mapActions('Employment', ['fetchEmploymentData', 'fetchOvertimeRequests']),
            ...mapActions('Auth', ['performLogout']),
            ...mapActions('Settings', ['fetchWorkforceEmployeeSettings', 'createRequestToWorkRemotelyEmail']),
            ...mapActions('Timelogging', [
                'performTimeIn',
                'performTimeOut',
                'fetchTimeLogs',
                'createEmployeeTimeLogActivities']),
            ...mapActions('generics', ['initiateWebsocketConnection']),
            ...mapActions('AutoClickers', ['fetchAutoClickers']),
            ...mapMutations('Tasks', [
                'setSelectedTaskAssignment', 'setTaskAssignmentTimeSpent', 'setSubtractedHours',
                'setScheduledTasks']),
            ...mapMutations('Employment', ['setWorkforceId', 'setCurrentShiftOvertime']),
            ...mapMutations('AutoClickers', ['setAutoClickersList']),

            async toggleTimeSwitch(data, forceTimeInOnThisDevice = false) {
                let timedIn = data.value;

                if (this.isOnline) {
                    let response;
                    let message;

                    try {
                        this.isTimingInOut = true;
                        let payload = {
                            employment: this.currentEmployment.pk,
                            device_host_name: this.currentDeviceHostName,
                            device_mac_address: this.currentMACAddress
                        };

                        // determines whether or not it's switch task or not
                        if (this.runningTaskAssignment || forceTimeInOnThisDevice) {
                            if (this.runningTaskAssignment) {
                                payload['task_assignment'] = this.runningTaskAssignment.pk;
                            }
                        }

                        if (this.timedInOnAnotherDevice && !forceTimeInOnThisDevice) {
                            this.modalToShow = 'singleDeviceWarningModal';
                            return;
                        }

                        if (timedIn) {
                            response = await this.performTimeIn(payload);
                        } else {
                            response = await this.performTimeOut(payload);
                        }

                    } catch (e) {
                        response = e;
                        try {
                            message = JSON.parse(response.response).message;
                        } catch (e) {
                            log.error(e);
                        }
                    } finally {
                        this.isTimingInOut = false;
                        await this.fetchShiftTimeLogs();
                    }

                    if (response.status === 403 && message.includes('expired')) {
                        ipcRenderer.send('show-window');
                        this.performLogout();
                    }
                }
            },

            updateTrayDisplay() {
                let arg = {
                    'timedIn': this.timedIn,
                    'taskName': this.runningTaskTitle
                };
                ipcRenderer.send('timelog-status-change', arg);
            },

            async forceTimeInOnCurrentDevice() {
                let data = { 'value': true };
                await this.toggleTimeSwitch(data, true);
                this.modalToShow = '';
            },

            /**
                Fetch functions
            **/
            async fetchShiftTimeLogs() {
                try {
                    console.log('clicked  ', this.isTimingInOut)
                    this.isTimingInOut = true;
                    console.log('midclick  ', this.isTimingInOut)
                    this.shiftTimeLogs = await this.fetchTimeLogs({'employment_id': this.currentEmployment.pk});
                    this.hoursWorked = this.shiftHoursWorked;
                    this.isTimingInOut = false;
                    console.log('after click  ', this.isTimingInOut)
                } catch (e) {
                    log.error(e);
                }
            },

            // async fetchTaskShiftTimeLogs() {
            //     try {
            //         if (this.runningTaskAssignment){
            //             let runningTaskAssignment = JSON.parse(JSON.stringify(this.runningTaskAssignment))
            //             console.log('this.runningTaskAssignment.task.pk ', runningTaskAssignment.task.pk)
            //             this.isTimingInOut = true;
            //             this.shiftTimeLogs = await this.fetchTimeLogs({
            //                 'employment_id': this.currentEmployment.pk,
            //                 'task_id': runningTaskAssignment.task.pk
            //             });
            //             this.hoursWorked = this.shiftHoursWorked;
            //             this.isTimingInOut = false;
            //         }
            //     } catch (e) {
            //         log.error(e);
            //     }
            // },

            async fetchEmployment() {
                try {
                    let response = await this.fetchEmploymentData(this.currentEmployment.pk);

                    if (response) {
                        this.employment = response;
                        this.workforces = response.applicant.user_profile.workforces;

                        if (!this.currentWorkforceId && this.workforces) {
                            this.setWorkforceId(this.workforces[0].pk);
                        }
                        if (this.employment.applicant.has_required_acknowledgements) {
                            this.notifyRequiredAcknowledgements();
                        }
                    }
                } catch (e) {
                    log.error(e);
                }
            },

            async fetchWorkforceSettings() {
                try {
                    this.ipAddress = await publicIP.v4();
                    let response = await this.fetchWorkforceEmployeeSettings({
                        'workforce_id': this.currentWorkforceId,
                        'ip_address': this.ipAddress
                    });

                    if (response) {
                        this.workforceEmployeeSettings = response[0];
                        this.canTimeIn = this.workforceEmployeeSettings.desktop_can_time_in;
                    }
                } catch (e) {
                    log.error(e);
                }
            },

            async fetchAutoClickersList() {
                try {
                    let autoClickers = await this.fetchAutoClickers();
                    this.setAutoClickersList(autoClickers);
                } catch (e) {
                    log.error(e);
                }
            },

            async fetchOvertimeRequest() {
                try {
                    let response = await this.fetchOvertimeRequests({
                        'employment_id': this.currentEmployment.pk
                    });

                    if (response) {
                        this.setCurrentShiftOvertime(response[0]);
                    }
                } catch (e) {
                    log.error(e);
                }
            },

            async fetchData() {
                if (!this.syncing) {
                    this.syncing = true;
                    try {
                        await this.fetchEmployment();
                        await this.fetchWorkforceSettings();
                        await this.fetchShiftTimeLogs();
                        // await this.fetchTaskShiftTimeLogs();
                        await this.fetchAutoClickersList();
                        await this.fetchOvertimeRequest();
                    } catch (e) {
                        log.error(e);
                        try {
                            let message = JSON.parse(e.response).message;
                            if (e.status === 403 && message.includes('expired')) {
                                ipcRenderer.send('show-window');
                                this.performLogout();
                            }
                        } catch (e) {
                            log.error(e);
                        }
                    } finally {
                        this.syncing = false;
                    }
                }
            },

            /**
                Interval functions
            **/
            timedInTimeTick() {
                if (this.employment && this.latestTimeLog) {
                    let diff = Date.now() - Date.parse(this.latestTimeLog.time_in);
                    let seconds = Math.floor(diff / 1000);
                    let hoursDiff = seconds / 60 / 60;
                    this.hoursWorked = this.shiftHoursWorked + hoursDiff;
                    if (this.runningTaskAssignment) {
                        this.setTaskAssignmentTimeSpent(this.initialTaskTimeSpent + hoursDiff);
                    }
                }
            },

            taskShiftTimeTick() {
                console.log('taskShiftTimeTick  223 ', this.latestRunningTaskTimeLog)
                if (this.employment && this.latestRunningTaskTimeLog) {
                    let diff = Date.now() - Date.parse(this.latestRunningTaskTimeLog.time_in);
                    let seconds = Math.floor(diff / 1000);
                    let hoursDiff = seconds / 60 / 60;
                    this.taskHoursWorked = this.taskShiftTimeSpent + hoursDiff;
                    console.log('latestRunningTaskTimeLog   ', this.latestRunningTaskTimeLog)
                    console.log('hours worked   ', this.taskHoursWorked)
                    console.log('this.taskShiftTimeSpent   ', this.taskShiftTimeSpent)
                    console.log('hoursDiff   ', hoursDiff)
                }
            },

            clearIntervals() {
                if (this.isOnline || !this.timedIn) {
                    this.clearActivityInterval();
                    this.clearScreenshotInterval();
                    this.clearIdleTimeInterval();
                    clearInterval(this.checkForAutoClickers);
                }
            },

            clearScreenshotInterval() {
                this.endRandomScreenshot();
            },

            clearActivityInterval() {
                clearInterval(this.activityInterval);
                clearInterval(this.updateActivitiesInterval);
                this.unproductiveAlertTime = 0;
                this.activityInterval = null;
                this.updateActivitiesInterval = null;
            },

            clearSubtractSecondsInterval() {
                clearInterval(this.subtractSecondsInterval);
                this.subtractSecondsInterval = null;
            },

            clearIdleTimeInterval() {
                clearInterval(this.idleTimeInterval);
                this.idleTimeInterval = null;
                this.idleStatesCount = 0;
                this.activeStatesCount = 0;
            },

            startIntervals() {
                if (!this.timedInOnAnotherDevice) {
                    this.startActivityInterval();
                    this.startScreenshotInterval();
                    this.checkProcessesForAutoClickers();
                    this.startIdleTimeInterval();
                }
            },

            startIdleTimeInterval() {
                if (!this.idleTimeInterval) {
                    let counter = 0;
                    let idleTimeThreshold = this.getRandomNumber(IDLE_TIME_LOWER_LIMIT, IDLE_TIME_UPPER_LIMIT);
                    let activeTimeThreshold = this.getRandomNumber(ACTIVE_TIME_LOWER_LIMIT, ACTIVE_TIME_UPPER_LIMIT);

                    this.idleTimeInterval = setInterval(() => {
                        let idleState = electron.remote.powerMonitor.getSystemIdleState(1);

                        if (idleState === 'locked') { // trigger timeout countdown on lock state
                            ipcRenderer.send('show-window');
                            this.modalToShow = 'lowActivityModal';
                        }

                        if (idleState == 'active') {
                            this.activeStatesCount++;
                        }

                        if (idleState == 'idle') {
                            this.idleStatesCount++;
                        }

                        /**
                         * When the active state count reaches the active time threshold,
                         * both the activeStatesCount and the idleStatesCount is reset to 0
                         * and new values for both thresholds are computed. This will make sure
                         * that when the user is surely active, the idleStatesCount won't keep on adding up.
                         */
                        if (this.activeStatesCount >= activeTimeThreshold) {
                            this.activeStatesCount = 0;
                            this.idleStatesCount = 0;
                            idleTimeThreshold = this.getRandomNumber(
                                IDLE_TIME_LOWER_LIMIT, IDLE_TIME_UPPER_LIMIT);
                            activeTimeThreshold = this.getRandomNumber(
                                ACTIVE_TIME_LOWER_LIMIT, ACTIVE_TIME_UPPER_LIMIT);
                        }

                        /**
                         * The lowActivityModal popup is dependent on isIdle. When isIdle is true,
                         * the modal is shown given that it satisfies the other necessary conditions.
                         */
                        let isIdle = this.idleStatesCount >= idleTimeThreshold;

                        if (this.modalToShow !== 'lowActivityModal'
                            && this.isOnline
                            && this.workforceEmployeeSettings.is_track_idle_time_allowed
                            && !this.isTaskInactivityAllowed
                            && isIdle && this.latestTimeLog.time_in_source == DESKTOP) {
                            // SHOW ALERT OF LOW ACTIVITY LEVEL
                            ipcRenderer.send('show-window');
                            this.modalToShow = 'lowActivityModal';

                            /**
                             * When the modal pops up, an amount of time (around a minute) is added to idleTimeThreshold
                             * for another popup to make sure that the user is really active after clicking 'Yes'.
                             * When the second modal is shown, idleStatesCount is reset to 0.
                             */
                            if (counter < 1) {
                                idleTimeThreshold = idleTimeThreshold + this.getRandomNumber(
                                    INCREMENT_LOWER_LIMIT, INCREMENT_UPPER_LIMIT);
                                counter++;
                            } else {
                                this.idleStatesCount = 0;
                                idleTimeThreshold = this.getRandomNumber(
                                    IDLE_TIME_LOWER_LIMIT, IDLE_TIME_UPPER_LIMIT);
                                counter = 0;
                            }
                        }
                    }, 1000);
                }
            },

            startScreenshotInterval() {
                if (sessionStorage.getItem('screenshotTimerIsRunning') != 'true'
                    && this.workforceEmployeeSettings.is_desktop_screenshot_collection_allowed) {
                    this.startRandomScreenshot(
                        this.workforceEmployeeSettings.screenshot_interval_lower,
                        this.workforceEmployeeSettings.screenshot_interval_upper
                    );
                }
            },

            startActivityInterval() {
                console.log('startActivityInterval fried')
                if (!this.activityInterval) {
                    this.activityInterval = setInterval(async () => {
                        if (this.workforceEmployeeSettings.is_desktop_user_activity_collection_allowed
                        ) {
                            this.getCurrentActiveWindow();
                            let currentWebsite = await this.getActiveBrowserTabURL(
                                this.workforceEmployeeSettings.restricted_websites,
                                this.workforceEmployeeSettings.is_desktop_sites_restricted
                            );

                            if (currentWebsite) {
                                // reset unproductive alert count and site when user switches to another site
                                if (this.currentUnproductiveSite != currentWebsite.siteName) {
                                    this.unproductiveAlertTime = 0;
                                    if (currentWebsite.isUnproductive) {
                                        this.currentUnproductiveSite = currentWebsite.siteName;
                                    } else {
                                        this.currentUnproductiveSite = '';
                                        this.modalToShow = '';
                                    }
                                }
                                // after spending 5 minutes on unproductive site, alert again
                                if (this.unproductiveAlertTime % (60 * 5) === 0 && currentWebsite.isUnproductive) {
                                    this.currentUnproductiveSite = currentWebsite.siteName;
                                    ipcRenderer.send('show-window');
                                    this.modalToShow = 'unproductiveWebsiteModal';
                                }
                                this.unproductiveAlertTime++;
                            }
                        }

                        if (this.$route.name == 'timelogs' || this.$route.name == 'tasks') {
                            this.timedInTimeTick();
                            this.taskShiftTimeTick();
                        }
                    }, 1000);
                }
            },

            startUpdateActivitiesInterval() {
                if (!this.updateActivitiesInterval) {
                    this.updateActivitiesInterval = setInterval(async() => {
                        if (this.timedIn) {
                            await this.updateActivities();
                        }
                    }, 1000 * 60 * 5);  // 5 minutes
                }
            },

            startSubtractSecondsInterval() {
                if (!this.subtractSecondsInterval) {
                    this.subtractSecondsInterval = setInterval(async() => {
                        this.setSubtractedHours();
                    }, 1000);
                }
            },

            checkProcessesForAutoClickers() {
                if (this.timedIn) {
                    this.checkForAutoClickers = setInterval(async() => {
                        this.handleAutoClickerDetection();
                    }, 1000 * 60 * 3);
                }
            },

            /**
                Update functions
            **/
            async updateActivities() {
                if (this.timedIn) {
                    await this.createEmployeeTimeLogActivities({
                        'employment':  this.employment.pk,
                        'activities': JSON.parse(sessionStorage.getItem('userActivities'))
                    });
                }
            },

            updateIntervals() {
                if (this.workforceEmployeeSettings.is_desktop_screenshot_collection_allowed
                    && this.timedIn
                    && sessionStorage.getItem('screenshotTimerIsRunning') != 'true') {
                    this.startScreenshotInterval();
                } else if (!this.workforceEmployeeSettings.is_desktop_screenshot_collection_allowed
                    && sessionStorage.getItem('screenshotTimerIsRunning') == 'true') {
                    this.clearScreenshotInterval();
                }
            },

            /**
                Handler functions
            **/
            async handleUnproductiveAlertBehavior(willTimeout) {
                ipcRenderer.send('toggle-always-on-top', false);
                this.modalToShow = '';
                if (willTimeout) {
                    let data = { 'value': false };
                    await this.toggleTimeSwitch(data);
                }
            },

            async handleLowActivityAlertBehaviour(willTimeout, closeModal) {
                if (closeModal) {
                    ipcRenderer.send('toggle-always-on-top', false);
                    this.modalToShow = '';
                }
                if (willTimeout) {
                    let data = { 'value': false };
                    await this.toggleTimeSwitch(data);
                    this.idleStatesCount = 0;
                    this.activeStatesCount = 0;
                }
            },

            goToApplyBpoHandler() {
                this.openExternalLink(this.sites.APPLYBPO_URL + '/dashboard/employments');
            },

            closeSelectWorkforceModal(workforceId) {
                this.modalToShow = '';
                if (workforceId) {
                    this.setWorkforceId(workforceId);
                    this.fetchData();
                }
            },

            async switchToDesktop() {
                let data = {
                    employment: this.currentEmployment.pk,
                    device_host_name: this.currentDeviceHostName,
                    device_mac_address: this.currentMACAddress
                };
                if (this.runningTaskAssignment) {
                    data['task_assignment'] = this.runningTaskAssignment.pk;
                }
                try {
                    await this.performTimeOut(data);
                    await this.performTimeIn(data);
                } catch (error) {
                    console.error(error);
                } finally {
                    this.closeSwitchToDesktopPopup = true;
                }
            },

            async sendEmailToWorkRemotely() {
                this.modalToShow = '';
                let data = {
                    'employment_id': this.currentEmployment.pk,
                    'ip_address': this.ipAddress
                };
                if (!this.sending) {
                    this.sending = true;
                    try {
                        await this.createRequestToWorkRemotelyEmail(data);
                    } catch (e) {
                        log.error(e);
                    } finally {
                        this.sending = false;
                    }
                }
            },

            closeWorkRemotelyModal() {
                this.modalToShow = '';
            },

            async switchPlatform(data) {
                let payload = {
                    employment: this.currentEmployment.pk,
                    task_assignment: this.runningTaskAssignment.pk
                };

                if (data.isTaskPivoted) {
                    payload['time_source'] = MOBILE;
                }

                try {
                    await this.performTimeOut(payload);

                    if (!data.isTaskPivoted) { // if switching to desktop application
                        payload = {
                            ...payload,
                            device_host_name: this.currentDeviceHostName,
                            device_mac_address: this.currentMACAddress
                        };
                    }

                    await this.performTimeIn(payload);
                } catch (error) {
                    console.error(error);
                }
            },

            clearAcknowledgements() {
                this.customPopupMessage = '';
                this.messageSecondary = '';
                this.customModalIcon = '';
                this.customModalMessageIsDismissable = true;
            },

            notifyRequiredAcknowledgements() {
                this.customPopupMessage = 'You have important notifications.';
                this.messageSecondary = 'Go to ApplyBPO to acknowledge them.';
                this.customModalIcon = 'bell-alert-outline';
                this.customModalMessageIsDismissable = false;
                this.goToApplyBpo = true;
                ipcRenderer.send('show-window');
            },

            async pauseTrackingOnTask() {
                this.setSelectedTaskAssignment(null);
                let data = { 'value': true };
                await this.toggleTimeSwitch(data);
                this.showPauseTimeTrackingModal = false;
            },

            /**
                Helper functions
            **/
            getRandomNumber(lowerLimit, upperLimit) {
                /**
                 * Calculates for a random number in between 2 given values -
                 * the upper limit and the lower limit.
                 */
                let threshold = Math.floor(Math.random() * (
                    SECONDS_IN_MINUTE * upperLimit - SECONDS_IN_MINUTE * lowerLimit)
                    + (SECONDS_IN_MINUTE * lowerLimit));

                return threshold;
            }
        }
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .main-content {
        display: flex;
    }

    main {
        padding: 0 24px 24px;
        width: 100%;
        max-height: calc(100vh - 24px);
        overflow-y: auto;
        @include scrollbar();
    }

    .vertical-container {
        width: 64px;
    }

    .message-container {
        display: flex;
        width: 50%;
        height: 80vh;
        align-items: center;
        justify-content: center;
        text-align: center;
        margin-top: -$sp-64;
        margin: auto;
    }

    .warning {
        color: black;
        padding: 24px 0 20px;
    }

    .message {
        line-height: 150%;
        font-size: 24px;
        font-weight: 600px;
        color: $secondary;
    }

    .subtext {
        margin-top: 24px;
        line-height: 150%;
        color: $tertiary;
    }

    /deep/ .main-title {
        padding: 24px 0 24px;
    }

    .message-icon {
        font-size: 96px;
        color: $secondary;
    }

    .loading-wrapper {
        display: flex;
        margin: auto;
        position: absolute;
        top: 50%;
        left: 50%;
    }
</style>
