<template>
    <AlertModal
        size="tiny"
        message-primary="New Version Available"
        :message-secondary="`A new version of the application is available. Restarting in ${timeRemaining} seconds`"
    >
        <template slot="footer">
            <Button
                class="success large block"
                @click="restart"
            >
                Restart Now
            </Button>
        </template>
    </AlertModal>
</template>

<script>
    import electron from 'electron';
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import Button from '@/components/_generics/Button.vue';

    const TIME_REMAINING = 60;  // in seconds

    export default {
        name: 'RestartAlertModal',

        components: {
            AlertModal,
            Button
        },

        props: {
            sidebarExpand: {
                type: Boolean,
                default: true
            }
        },

        data() {
            return {
                timeRemaining: TIME_REMAINING
            };
        },

        computed: {
            restartTime() {
                return this.timeRemaining + ' sec';
            }
        },

        created() {
            electron.ipcRenderer.send('show-window');
            this.startTimer();
        },

        methods: {
            restart() {
                electron.ipcRenderer.send('restart');
            },

            startTimer() {
                setInterval(() => {
                    this.timeRemaining--;

                    if (this.timeRemaining <= 0) {
                        this.restart();
                    }
                }, 1000);
            }
        }
    };
</script>
