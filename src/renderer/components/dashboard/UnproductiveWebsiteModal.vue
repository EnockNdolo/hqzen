<template>
    <AlertModal
        icon="alert-circle-outline"
        color="yellow"
        size="tiny"
        :message-primary="`${websiteName} is tagged as unproductive.`"
        message-secondary="If you think this is wrong, please contact your employer."
    >
        <template slot="footer">
            <div class="footer-stack">
                <Button
                    class="warning bold large block"
                    @click="$emit('time-out')"
                >
                    Time Out
                </Button>
                <Button
                    class="secondary highlight bold large block"
                    @click="$emit('close')"
                >
                    Dismiss
                </Button>
            </div>
        </template>
    </AlertModal>
</template>

<script>
    import { ipcRenderer } from 'electron';
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import Button from '@/components/_generics/Button.vue';

    export default {
        name: 'UnproductiveWebsiteModal',

        components: {
            AlertModal,
            Button
        },

        props: {
            websiteName: {
                type: String,
                required: true
            }
        },

        created() {
            ipcRenderer.send('toggle-always-on-top', true);
        }
    };
</script>
