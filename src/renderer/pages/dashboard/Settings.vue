<template>
    <div class="settings-container">
        <header class="main-title sticky">
            <h1>Settings</h1>
        </header>

        <section class="config">
            <header>
                <h2>Configurations</h2>
            </header>

            <div class="row">
                <i
                    v-if="isSyncing"
                    class="mdi mdi-sync syncing"
                />
                <i
                    v-else
                    :class="[
                        'mdi', (workforceEmployeeSettings.is_desktop_sites_restricted ? 'mdi-check' : 'mdi-close')
                    ]"
                />
                <div class="details">
                    <strong>Restrict Unproductive Websites
                    </strong>
                    <p v-if="workforceEmployeeSettings">
                        App will
                        {{ workforceEmployeeSettings.is_desktop_sites_restricted ? '' : 'not' }}
                        alert when visiting unproductive websites.
                    </p>
                </div>
            </div>

            <div class="row">
                <i
                    v-if="isSyncing"
                    class="mdi mdi-sync syncing"
                />
                <i
                    v-else
                    :class="[
                        'mdi',
                        (workforceEmployeeSettings.is_desktop_mouse_keyboard_collection_allowed
                            ? 'mdi-check' : 'mdi-close')
                    ]"
                />
                <div class="details">
                    <strong>Track Mouse and Keyboard
                    </strong>
                    <p v-if="workforceEmployeeSettings">
                        App will
                        {{ workforceEmployeeSettings.is_desktop_mouse_keyboard_collection_allowed ? '' : 'not' }}
                        record the number of mouse clicks and keyboard presses.
                    </p>
                </div>
            </div>

            <div class="row">
                <i
                    v-if="isSyncing"
                    class="mdi mdi-sync syncing"
                />
                <i
                    v-else
                    :class="[
                        'mdi',
                        (workforceEmployeeSettings.is_desktop_user_activity_collection_allowed
                            ? 'mdi-check' : 'mdi-close')
                    ]"
                />
                <div class="details">
                    <strong>Track Apps and Websites
                    </strong>
                    <p v-if="workforceEmployeeSettings">
                        App will
                        {{ workforceEmployeeSettings.is_desktop_user_activity_collection_allowed ? '' : 'not' }}
                        record opened applications, websites visited,
                        and time spent on each.
                    </p>
                </div>
            </div>

            <div class="row">
                <i
                    v-if="isSyncing"
                    class="mdi mdi-sync syncing"
                />
                <i
                    v-else
                    :class="[
                        'mdi',
                        (workforceEmployeeSettings.is_desktop_screenshot_collection_allowed
                            ? 'mdi-check' : 'mdi-close')
                    ]"
                />
                <div class="details">
                    <strong>Collect Screenshots
                    </strong>
                    <p v-if="workforceEmployeeSettings">
                        App will
                        {{ workforceEmployeeSettings.is_desktop_screenshot_collection_allowed
                            ? 'periodically' : 'not' }}
                        take screenshots of the computer
                        screen/s.
                    </p>
                </div>
            </div>
        </section>

        <section class="options">
            <header>
                <h2>Options</h2>
            </header>

            <!-- TODO: refactor Keep me signed in implementation (jc@bposeats.com) -->
            <div
                v-if="false"
                class="row toggle"
                @click="rememberMeCheckbox"
            >
                <i
                    :class="['mdi', (rememberMeValue ?
                        'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline')]"
                ></i>
                <div class="details">
                    <strong>Keep me signed in</strong>
                    <p>
                        Toggle to automatically sign in as soon as the app starts.
                    </p>
                </div>
            </div>

            <div
                class="row toggle"
                @click="runAppOnStartup"
            >
                <i
                    :class="['mdi', (startOnStartup ?
                        'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline')]"
                ></i>
                <div class="details">
                    <strong>Start ApplyBPO Time Tracker on Startup</strong>
                    <p>
                        Toggle to automatically run the app as soon as PC starts.
                    </p>
                </div>
            </div>

            <div class="row sync-to" @click="syncHandler">
                <i
                    class="mdi mdi-sync"
                    :class="{ 'syncing': isSyncing }"
                />
                <div class="details">
                    <div>
                        <strong>Sync to ApplyBPO</strong>
                        <p>Update app information.</p>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
    import { ipcRenderer } from 'electron';
    import { mapState } from 'vuex';
    import ExternalLinkMixin from '@/mixins/ExternalLinkMixin';

    export default {

        name: 'Settings',

        mixins: [
            ExternalLinkMixin
        ],

        props:{
            workforceEmployeeSettings: {
                type: Object,
                required: true
            },
            isSyncing: {
                type: Boolean,
                required: true
            }
        },

        data() {
            return {
                startOnStartup: null,
                rememberMeValue: null
            };
        },

        computed: {
            ...mapState('Sites', ['sites']),
        },

        created() {
            this.rememberMeValue = JSON.parse(localStorage.getItem('rememberMeValue')) ? true : false;
            this.startOnStartup = ipcRenderer.sendSync('startup-status');
        },

        methods: {
            rememberMeCheckbox() {
                this.rememberMeValue = !this.rememberMeValue;
                localStorage.setItem('rememberMeValue', this.rememberMeValue);
            },

            runAppOnStartup() {
                this.startOnStartup = !this.startOnStartup;
                if (this.startOnStartup) {
                    // create the shortcut file
                    ipcRenderer.send('run-app-on-startup', true);
                } else {
                    // remove the shortcut file
                    ipcRenderer.send('run-app-on-startup', false);
                }
            },

            syncHandler() {
                this.$emit('perform-sync');
            },
        }
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';>

    .settings-container {
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
    section:first-of-type {
        margin-top: 12px;
    }

    section:not(:first-of-type) {
        margin-top: 24px;
    }

    .options {
        margin-top: 20px;
    }

    h2 {
        margin: 0;
        font-weight: bold;
        font-size: 16px;
        color: var(--black-secondary);
    }

    .row {
        display: flex;
        align-items: flex-start;
        margin-top: 12px;
        color: var(--black-primary);
    }

    .mdi {
        margin: -4px 12px 0 0;
        font-size: 20px;
    }

    .mdi-check {
        color: var(--success);
    }

    .mdi-close {
        color: var(--error);
    }

    .toggle,
    .sync-to {
        user-select: none;
        cursor: pointer;
    }

    .toggle .mdi,
    .mdi-sync {
        color: var(--primary);
    }

    p {
        margin: 4px 0 0;
        font-size: 12px;
        color: var(--black-secondary);
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

    .main-title {
        z-index: 0;
    }
</style>
