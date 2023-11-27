<template>
    <AlertModal
        :icon="icon"
        :color="iconColor"
        :message-primary="messagePrimary"
        :message-secondary="messageSecondary"
        size="tiny"
    >
        <template
            slot="footer"
        >
            <div
                class="footer-stack"
            >
                <Button
                    v-if="goToApplyBpo"
                    class="primary large block bold"
                    @click="$emit('redirect')"
                >
                    Go to ApplyBPO
                </Button>
                <Button
                    v-if="isDismissable"
                    class="highlight secondary large block"
                    @click="$emit('close')"
                >
                    Dismiss
                </Button>
            </div>
        </template>
    </AlertModal>
</template>

<script>
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import Button from '@/components/_generics/Button.vue';

    export default {
        name: 'CustomModal',

        components: {
            AlertModal,
            Button,
        },

        props: {
            messagePrimary: {
                type: String,
                required: true
            },

            messageSecondary: {
                type: String,
                required: false,
                default: ''
            },

            icon: {
                type: String,
                required: true
            },

            iconColor: {
                type: String,
                required: false,
                default: 'red'
            },

            goToApplyBpo: {
                type: Boolean,
                required: false,
                default: false,
            },

            isDismissable: {
                type: Boolean,
                default: true
            }
        },
    };
</script>
