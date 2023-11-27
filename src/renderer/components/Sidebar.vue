<template>
    <aside
        class="sidebar"
        :class="{ expanded: openSidebar }"
    >
        <button class="toggle" @click="handleClick">
            <i class="mdi mdi-chevron-right"></i>
        </button>

        <div class="sidebar-item user">
            <img
                v-if="user.user_profile.avatar_url"
                class="avatar"
                :alt="`${user.first_name}'s Avatar`"
                :src="user.user_profile.avatar_url"
                @click="gotoExternalLink('/dashboard/profile')"
            />
            <img
                v-else
                class="avatar"
                src="@/assets/default-avatar.png"
                @click="gotoExternalLink('/dashboard/profile')"
            />
            <span>
                {{ user.first_name }}
                <!-- <small>Internal ID {{ user.user_profile.internal_id }}</small> -->
                <small>
                    <i class="mdi mdi-star-circle"></i>
                    <strong>{{ totalPointsEarned ? totalPointsEarned : 0 }} pts</strong>
                </small>
            </span>
        </div>

        <p class="points-col">
            <template v-if="!openSidebar">
                <i class="mdi mdi-star-circle"></i>
                <strong>{{ totalPointsEarned ? totalPointsEarned : 0 }}</strong>
            </template>
        </p>
        <div class="sidebar-items-container">
            <div class="top-items">
                <div class="tooltip-wrapper">
                    <button
                        :disabled="timedIn"
                        class="sidebar-item dashboard"
                        @click="$emit('select-workforce')"
                    >
                        <i class="material-icons mdi mdi-sitemap"></i>
                        <span>Workforces</span>
                    </button>
                    <Tooltip
                        v-if="!openSidebar"
                        class="side-right tooltip-side-center"
                    >
                        Workforces
                    </Tooltip>
                </div>

                <hr />

                <div class="tooltip-wrapper">
                    <a class="sidebar-item dashboard" @click="gotoExternalLink(linkToBoard)">
                        <i class="material-icons mdi mdi-view-column-outline"></i>
                        <span>Board
                            <i class="external-icon mdi mdi-launch"></i>
                        </span>
                    </a>
                    <Tooltip v-if="!openSidebar" class="side-right tooltip-side-center">
                        Board
                    </Tooltip>
                </div>

                <div class="tooltip-wrapper">
                    <a class="sidebar-item dashboard" @click="gotoExternalLink('/profile/notifications')">
                        <div v-if="hasNotification" class="badge"></div>
                        <i class="material-icons mdi mdi-bell-outline"></i>
                        <span>
                            Notifications
                            <i class="external-icon mdi mdi-launch"></i>
                        </span>
                    </a>
                    <Tooltip v-if="!openSidebar" class="side-right tooltip-side-center">
                        Notifications
                    </Tooltip>
                </div>

                <hr />

                <div class="pages">
                    <div class="tooltip-wrapper">
                        <button
                            :disabled="isDisabled"
                            :active="$route.name == 'tasks'"
                            class="sidebar-item"
                            @click="goto('tasks')"
                        >
                            <i class="material-icons mdi mdi-clipboard-text-outline"></i>
                            <span>Tasks</span>
                        </button>
                        <Tooltip v-if="!openSidebar" class="side-right tooltip-side-center">
                            Tasks
                        </Tooltip>
                    </div>
                    <div class="tooltip-wrapper">
                        <button
                            :disabled="isDisabled"
                            :active="$route.name == 'timelogs'"
                            class="sidebar-item"
                            @click="goto('timelogs')"
                        >
                            <i class="material-icons mdi mdi-briefcase-outline"></i>
                            <span>Employment</span>
                        </button>
                        <Tooltip v-if="!openSidebar" class="side-right tooltip-side-center">
                            Employment
                        </Tooltip>
                    </div>

                    <!-- <button
                        :disabled="isSyncing"
                        :active="$route.name == 'voip'"
                        class="sidebar-item"
                        @click="goto('voip')"
                    >
                        <i class="material-icons">call</i>
                        <span>VOIP</span>
                    </button> -->

                    <div class="tooltip-wrapper">
                        <button
                            :disabled="isDisabled"
                            :active="$route.name == 'settings'"
                            class="sidebar-item"
                            @click="goto('settings')"
                        >
                            <i class="material-icons mdi mdi-cog-outline"></i>
                            <span>Settings</span>
                        </button>
                        <Tooltip v-if="!openSidebar" class="side-right tooltip-side-center">
                            Settings
                        </Tooltip>
                    </div>
                </div>
            </div>

            <div
                class="tooltip-wrapper"
                :class="{ disabled: timedIn }"
            >
                <button
                    class="sidebar-item signout"
                    :disabled="(timedIn && !timedInOnAnotherDevice) || isSyncing"
                    @click="performLogoutHandler"
                >
                    <i class="material-icons mdi mdi-login-variant"></i>
                    <span>Sign Out</span>
                </button>
                <TooltipText v-if="timedIn" class="top left">
                    You are timed in!
                </TooltipText>
            </div>
        </div>
    </aside>
</template>

<script>
    import { mapState, mapActions, mapGetters } from 'vuex';
    import { ipcRenderer } from 'electron';
    import ExternalLinkMixin from '@/mixins/ExternalLinkMixin';
    import LoadingSpinner from '@/components/_generics/LoadingSpinner.vue';
    import TooltipText from '@/components/_generics/TooltipText.vue';
    import Tooltip from '@/components/_generics/Tooltip.vue';

    export default {
        name: 'Sidebar',

        components: {
            TooltipText,
            Tooltip
        },

        mixins: [
            ExternalLinkMixin,
            LoadingSpinner,
        ],

        props: {
            timedIn: {
                type: Boolean,
                required: true
            },
            isSyncing: {
                type: Boolean,
                required: true
            },
            workforces: {
                type: Array,
                required: true
            },

            totalPointsEarned: Number,
            timedInOnAnotherDevice: Boolean
        },

        data() {
            return {
                openSidebar: false,
                hasNotification: false,
                notifInterval: 3,
                currentUnseenNotif: null
            };
        },

        computed: {
            ...mapState('Auth', ['user']),
            ...mapState('Sites', ['sites']),
            ...mapGetters('Employment', ['currentWorkforceId']),
            ...mapGetters('Employment', ['currentBoardId']),
            ...mapGetters('Employment', ['currentEmployment']),


            isDisabled() {
                return !this.workforces || this.isSyncing;
            },

            companyId() {
                return this.currentEmployment.company_id;
            },

            linkToBoard() {
                return `/company/${this.companyId}/workforce/${this.currentWorkforceId}/board/${this.currentBoardId}`;
            },
        },

        created() {
            this.getNotifications();
            ipcRenderer.on('redirect-notif', () => {
                this.gotoExternalLink('/profile/notifications');
            });
        },

        eventBusCallbacks: {
            'new-notification': 'getNotifications'
        },

        methods: {
            ...mapActions('Auth', ['performLogout']),
            ...mapActions('Notifications', ['fetchNotifications']),

            performLogoutHandler() {
                clearTimeout(sessionStorage['screenshotTimer']);
                sessionStorage.setItem('screenshotTimerIsRunning', false);
                ipcRenderer.send('destroy-activity-bar');
                this.performLogout();
            },

            gotoExternalLink(link) {
                if (link.includes('workforce')) {
                    this.openExternalLink(this.sites.HQZEN_URL + link);
                } else if (link.includes('notifications')) {
                    this.openExternalLink(this.sites.APPLYBPO_URL + link);
                    this.hasNotification = false;
                } else {
                    this.openExternalLink(this.sites.APPLYBPO_URL + link);
                }
            },

            goto(path) {
                if (this.$route.name != path) {
                    this.$router.push({
                        name: path
                    });
                }
            },

            handleClick() {
                this.openSidebar = !this.openSidebar;
                this.$emit('sidebar-expand', this.openSidebar);
            },

            async getNotifications() {
                let response = await this.fetchNotifications({'read': 'False'});

                // Fetch top 6 notif then check if there is at least 1 unseen
                response.notifications.every((notif, index) => {
                    if (JSON.stringify(notif) != JSON.stringify(this.currentUnseenNotif)) {
                        if (!notif.seen) {
                            this.hasNotification = true;
                            this.notifInterval = 3;
                            this.currentUnseenNotif = notif;

                            let data = {
                                notification: notif,
                                unseenCount: response.unseen_count,
                                screenshotNotif: false
                            };

                            ipcRenderer.send('create-notif', data);
                            return false;
                        } else {
                            this.hasNotification = false;
                            this.currentUnseenNotif = null;
                            return true;
                        }
                    }
                });
            }
        }
    };
</script>

<style scoped>
    .sidebar {
        background-color: var(--primary);
        position: relative;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        padding: 12px;
        max-width: calc(64px - 24px);
        width: 100%;
        height: calc(100vh - 24px);
        color: var(--white-primary);
        user-select: none;
        transition: max-width var(--transition);
        z-index: 2;
    }

    .expanded {
        max-width: calc(180px - 24px);
    }

    .toggle {
        background-color: var(--primary);
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        top: 0;
        right: -16px;
        bottom: 0;
        margin: auto 0;
        padding: 0;
        width: 16px;
        height: 40px;
        line-height: inherit;
        color: var(--white-primary);
        border-radius: 0 4px 4px 0;
        transition: all var(--transition);
        z-index: 1;
    }

    .toggle i {
        margin-left: -5px;
        font-size: 28px;
    }

    .expanded .toggle i {
        transform: rotate(-180deg);
    }

    .points-col {
        text-align: center;
        font-size: 10px;
        color: #ffff00;
        margin: 4px -12px -6px;
        min-height: 14px;
    }

    .points-col i {
        font-size: 10px;
        margin-right: -2px;
    }

    .sidebar-item {
        display: flex;
        align-items: center;
        width: 100%;
        color: var(--white-primary);
        border-radius: 4px;
        overflow: hidden;
    }

    .sidebar-item:not(.user) {
        margin-top: 8px;
        padding: 0 10px;
        width: calc(100% - 20px);
        height: 40px;
        line-height: 40px;
    }

    button.sidebar-item:not(.user) {
        width: 100%;
    }

    .sidebar-item:not(.user):hover,
    .router-link-exact-active {
        background-color: var(--white-border);
    }

    .user {
        padding: 3px 0px;
        width: 100%;
    }

    .avatar {
        background-color: var(--white-primary);
        width: 40px;
        height: 40px;
        object-fit: cover;
        object-position: center;
        border-radius: 50%;
        cursor: pointer;
    }

    .sidebar-item span {
        margin-left: 8px;
        width: max-content;
        text-align: left;
        white-space: nowrap;
        opacity: 0;
        transition: opacity var(--transition);
    }

    .expanded .sidebar-item span {
        opacity: 1;
    }

    .user small {
        display: block;
        margin-top: 2px;
        font-size: 12px;
        color: #ffff00;
    }

    .sidebar-item > .material-icons {
        width: 20px;
        font-size: 20px;
    }

    .dashboard {
        position: relative;
        margin-top: 12px;
        cursor: pointer;
        width: 100%;
    }

    .external-icon {
        position: absolute;
        top: 0;
        right: 6px;
        bottom: 0;
        margin: auto 0;
        height: max-content;
        font-size: 14px;
        color: var(--white-disabled);
    }

    hr {
        margin: 8px 0 0;
        border: 0.5px solid var(--white-border);
    }

    .signout.signout {
        margin-top: auto;
        width: 100%;
    }

    button[disabled]{
        pointer-events: none;
        opacity: .5;
        cursor: not-allowed;
    }

    button[active]{
        background-color: var(--white-border);
    }

    .tooltip-wrapper {
        margin-top: auto;
        position: relative;
    }

    .tooltip-wrapper .tooltip-side-center {
        transform: translateY(24%);
        z-index: 2;
    }

    .tooltip-wrapper .tooltip {
        visibility: hidden;
    }

    .tooltip-wrapper.disabled:hover .tooltip {
        visibility: visible;
    }

    .tooltip-wrapper:hover .tooltip {
        visibility: visible !important;
    }

    .badge {
        height: 8px;
        min-width: 8px;
        border-radius: 50%;
        background: red;
        color: white;
        position: absolute;
        top: 24px;
        left: 22px;
    }

    .sidebar-items-container {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
    }
</style>
