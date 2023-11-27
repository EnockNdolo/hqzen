<template>
    <AlertModal
        icon="cellphone"
        size="tiny"
        message-secondary="You are currently working on"
    >
        <template slot="details">
            <p class="m-h2 mobile">
                Mobile
            </p>
            <p class="m-h2 task">
                {{ runningTask }}
            </p>
        </template>
        <template slot="footer">
            <Button
                class="primary large block"
                @click="$emit('switch')"
            >
                Switch to Desktop
            </Button>
        </template>
    </AlertModal>
</template>

<script>
    import { ipcRenderer } from 'electron';
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import Button from '@/components/_generics/Button.vue';

    export default {
        name: 'WorkingOnMobileModal',

        components: {
            AlertModal,
            Button,
        },

        props: {
            runningTask: {
                type: String,
                default: 'No Task Selected'
            },
        },

        created() {
            ipcRenderer.send('toggle-always-on-top', true);
        },
    };
</script>

<style scoped>
    .mobile {
        text-align: center;
        font-size: 20px;
        font-weight: 600;
        color: black;
        margin: 0px;
    }

    .task {
        text-align: center;
        font-size: 14px;
        font-weight: 300;
        color: var(--secondary);
        margin: 10px;
    }
</style>
