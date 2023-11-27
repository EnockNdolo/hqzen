<template>
    <AlertModal
        icon="clock-alert-outline"
        color="yellow"
        size="tiny"
        message-primary="By clicking pause, time tracking will continue with no task."
        message-secondary="Do you wish to proceed?"
    >
        <template slot="footer">
            <div class="footer-stack">
                <Button
                    class="primary bold large block"
                    @click="$emit('pause-time-tracking')"
                >
                    Yes, continue with no task
                </Button>
                <Button
                    class="highlight secondary bold large block"
                    @click="$emit('close')"
                >
                    Cancel
                </Button>
            </div>
        </template>
    </AlertModal>
</template>

<script>
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import Button from '@/components/_generics/Button.vue';

    export default {
        name: 'PauseTimeTrackingModal',

        components: {
            AlertModal,
            Button,
        },
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/base/reset.scss';

    .ip-address {
        text-align: center;
    }
</style>
