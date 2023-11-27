<template>
    <AlertModal
        v-if="wasTimedOut && isOnline"
        icon="access-point-network"
        color="green"
        size="tiny"
        message-primary="Connection to the server is established."
        message-secondary="You may now time in."
    >
        <template slot="footer">
            <Button
                class="highlight secondary large block"
                @click="handler"
            >
                Close
            </Button>
        </template>
    </AlertModal>
    <AlertModal
        v-else-if="!isOnline && timedIn && timeBeforeTimeOut > 0"
        icon="access-point-network-off"
        color="red"
        size="tiny"
        message-primary="Lost connection to the server."
        :message-secondary="`You will be timed out in ${timeRemaining}.`"
    >
    </AlertModal>
    <AlertModal
        v-else-if="!isOnline && wasTimedOut"
        icon="access-point-network-off"
        color="red"
        size="tiny"
        message-primary="Lost connection to the server."
        message-secondary="You were timed out while trying to reconnect."
    >
    </AlertModal>
</template>

<script>
    import { ipcRenderer } from 'electron';
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import Button from '@/components/_generics/Button.vue';

    const TIME_BEFORE_TIME_OUT = 240; // in seconds

    export default {
        name: 'NoConnectionModal',

        components: {
            AlertModal,
            Button
        },
        props: {
            timedIn: {
                type: Boolean,
                required: true
            }
        },
        data() {
            return {
                isOnline: navigator.onLine,
                timeBeforeTimeOut : TIME_BEFORE_TIME_OUT,
                offlineTimeInterval: null,
                wasTimedOut: false,
                isOnlineTimeout: null,
            };
        },

        eventBusCallbacks: {
            'socket-connection-close': 'socketClose',
            'socket-connection-open': 'socketOpen'
        },

        computed:{
            timeRemaining() {
                let m = Math.floor((this.timeBeforeTimeOut % 3600) / 60);
                let s = this.timeBeforeTimeOut % 60;
                return (m ? m + 'm ' : '') + (s ? s + 's ' : '');
            }
        },
        watch: {
            isOnline(value) {
                this.$emit('connection-status-change', this.isOnline);
                console.log('value kwa isOnline ', value)
                if (!value && this.timedIn) {
                    ipcRenderer.send('show-window');
                    this.wasTimedOut = false;
                    this.startOfflineTimer();
                } else {
                    if (this.wasTimedOut) {
                        ipcRenderer.send('show-window');
                    }
                    clearInterval(this.offlineTimeInterval);
                    this.offlineTimeInterval = null;
                    this.timeBeforeTimeOut = TIME_BEFORE_TIME_OUT;
                }
            }
        },
        created() {
            this.$emit('connection-status-change', this.isOnline);
            this.$emit('offline-time', this.timeBeforeTimeOut);
        },
        methods: {
            socketClose() {
                this.isOnline = false;
            },

            socketOpen() {
                this.isOnline = true;
            },

            startOfflineTimer() {
                this.offlineTimeInterval = setInterval(() => {
                    this.timeBeforeTimeOut--;
                    if (this.timeBeforeTimeOut == 0) {
                        clearInterval(this.offlineTimeInterval);
                        this.offlineTimeInterval = null;
                        ipcRenderer.send('show-window');
                        this.wasTimedOut = true;
                    }
                    this.$emit('offline-time', this.timeBeforeTimeOut);
                }, 1000);
            },

            handler() {
                this.wasTimedOut = false;
            }
        },
    };
</script>
