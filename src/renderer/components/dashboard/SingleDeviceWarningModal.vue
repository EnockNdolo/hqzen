<template>
    <AlertModal
        :icon="true ? 'monitor' : 'cellphone'"
        color="blue"
        size="tiny"
        :message-primary="`You are currently timed in on ${deviceName}`"
        message-secondary="Would you like to continue?"
    >
        <template slot="footer">
            <div class="footer-stack">
                <Button
                    class="primary bold large block"
                    @click="$emit('time-in-on-current-device')"
                >
                    Continue on this device
                </Button>
                <Button
                    class="highlight secondary bold large block"
                    @click="$emit('dismiss')"
                >
                    Dismiss
                </Button>
            </div>
        </template>
    </AlertModal>
</template>

<script>
    import { mapMutations } from 'vuex';
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import Button from '@/components/_generics/Button.vue';

    export default {
        name: 'SingleDeviceWarningModal',

        components: {
            AlertModal,
            Button
        },


        props: {
            deviceName: {
                type: String,
                required: true
            }
        },

        methods: {
            ...mapMutations('Tasks', ['setSelectedTaskAssignment']),

            continueOnAnotherDevice() {
                this.$emit('close');
            }
        }
    };
</script>
