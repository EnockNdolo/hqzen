<template>
    <div class="custom-switch">
        <input
            id="tracker"
            type="checkbox"
            v-bind="$attrs"
            :checked="value"
            @change="$emit('input', $event.target.checked)"
        />
        <label for="tracker">
            <span class="out">Time Out</span>
            <span class="in">Time In</span>
            <div class="handle">
                <i v-if="isLoading" class="mdi mdi-refresh"></i>
            </div>
        </label>

        <div class="note">
            <div v-if="isLoading && !isSyncing">
                Timing
                <span v-if="value">in</span>
                <span v-else>out</span>...
            </div>
            <div v-else>
                Currently timed
                <span v-if="value">in</span>
                <span v-else>out</span>.
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'BaseSwitch',

        props: {
            value: Boolean,
            isLoading: {
                type: Boolean,
                default: false
            },
            isSyncing: {
                type: Boolean,
                default: false
            }
        }
    };
</script>

<style scoped>
    .custom-switch {
        position: relative;
    }

    [type="checkbox"] {
        position: absolute;
        z-index: 0;
        opacity: 0;
    }

    label {
        display: flex;
        align-items: center;
        width: 104px;
        height: 32px;
        color: var(--white-primary);
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
        transition: background-color var(--transition);
    }

    [type="checkbox"]:not(:checked) + label {
        background-color: #A1A1A1;
    }

    [type="checkbox"]:checked + label {
        background-color: var(--success);
    }

    [type="checkbox"]:disabled + label {
        background-color: #E0E0E0;
    }

    .handle {
        content: "";
        background-color: var(--white-primary);
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        height: 24px;
        font-size: 16px;
        border-radius: 50%;
        flex-shrink: 0;
        order: 2;
        color: var(--black-disabled);
    }

    .handle,
    label span {
        transition: transform var(--transition);
    }

    [type="checkbox"]:not(:checked) + label .handle,
    [type="checkbox"]:not(:checked) + label span {
        transform: translateX(calc(-1 * (104px - 24px - 8px)));
    }

    label span {
        flex-shrink: 0;
        text-transform: uppercase;
        text-align: center;
        font-weight: 500;
        font-size: 13px;
        width: calc(100% - 24px - 4px);
    }

    .in {
        order: 3;
    }

    .out {
        order: 1;
    }

    .handle i {
        animation: rotate 2s infinite;
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
    }

    .note {
        margin: 4px auto 0;
        text-align: center;
        font-size: 11px;
        color: var(--black-disabled);
    }
</style>
