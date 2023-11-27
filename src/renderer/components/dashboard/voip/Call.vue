<template>
    <div class="call">
        Call # {{ call.number }}
        <span :class="`status-${call.status}`" class="status">
            {{ getTextStatus }}
        </span>
    </div>
</template>

<script>
    export default {
        name: 'Call',

        props: {
            call: {
                type: Object,
                required: true,
            },
        },

        computed: {
            getTextStatus() {
                if (this.call.status === 1) return 'In Queue';
                else if (this.call.status === 2) return 'Incoming Call';
                else if (this.call.status === 3) return 'On Call';
                return '';
            },
        },
    };
</script>

<style scoped>
    .call {
        background-color: var(--primary-l95);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        font-size: 12px;
        border-radius: 4px;
    }

    .call:not(:first-child) {
        margin-top: 4px;
    }

    .status {
        text-transform: uppercase;
        font-weight: 500;
    }

    .status-1 {
        color: var(--black-secondary);
    }

    .status-2 {
        color: var(--primary);
    }

    .status-3 {
        color: var(--success);
    }
</style>
