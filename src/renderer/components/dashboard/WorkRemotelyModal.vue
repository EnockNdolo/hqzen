<template>
    <AlertModal
        icon="home-remove-outline"
        color="tertiary"
        size="tiny"
        message-primary="You are not allowed to work remotely."
        message-secondary="To have your IP address whitelisted, send an automated email to your HR / Executive."
    >
        <template slot="details">
            <p class="m-h2 ip-address">
                {{ ipAddress }}
            </p>
        </template>
        <template slot="footer">
            <div class="footer-stack">
                <Button
                    class="primary bold large block"
                    @click="$emit('send-email')"
                >
                    Send Email
                </Button>
                <Button
                    class="highlight secondary bold large block"
                    @click="$emit('close')"
                >
                    Close
                </Button>
            </div>
        </template>
    </AlertModal>
</template>

<script>
    import { mapGetters } from 'vuex';
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import Button from '@/components/_generics/Button.vue';

    export default {
        name: 'WorkRemotelyModal',

        components: {
            AlertModal,
            Button,
        },

        props: {
            ipAddress: {
                type: String,
                required: true
            },
        },

        computed: {
            ...mapGetters('Employment', ['currentWorkforceId']),
        }
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/base/reset.scss';

    .ip-address {
        text-align: center;
    }
</style>