<template>
    <div
        v-if="variant != 'none'"
        :class="variant"
        class="indicator"
    >
        <i v-if="late" class="mdi mdi-calendar-clock"></i>
        <i v-else-if="overtime" class="mdi mdi-power-sleep"></i>
        <i v-else-if="suspended" class="mdi mdi-exclamation"></i>

        <p v-if="late" class="tooltip__content">
            You were late today.
        </p>
        <p v-else-if="overtime" class="tooltip__content">
            You're working overtime.
        </p>
        <p v-else-if="suspended" class="tooltip__content">
            You were suspended.
        </p>
    </div>
</template>

<script>
    export default {
        name: 'JobStatusIndicator',

        props: {
            variant: {
                type: String,
                required: true,
                validator(value) {
                    return ['late', 'overtime', 'suspended', 'none'].indexOf,(value) !== -1;
                },
            },
        },

        computed: {
            late () {
                return this.variant === 'late';
            },
            overtime() {
                return this.variant === 'overtime';
            },
            suspended() {
                return this.variant === 'suspended';
            },
        },
    };
</script>

<style scoped>
    .indicator {
        background-color: var(--primary);
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 8px;
        width: 32px;
        height: 32px;
        font-size: 18px;
        color: var(--white-primary);
        border-radius: 50%;
    }

    .late {
        background-color: var(--warning);
    }

    .overtime {
        background-color: var(--purple);
    }

    .suspended {
        background-color: var(--error);
        font-size: 22px;
    }

    .tooltip__content {
        background-color: var(--black-disabled);
        position: absolute;
        top: calc(100% + 8px);
        margin: 0;
        padding: 4px 8px;
        white-space: nowrap;
        text-align: center;
        font-size: 11px;
        color: var(--white-primary);
        border-radius: 4px;
        opacity: 0;
        pointer-events: none;
        transition: opacity var(--transition);
    }

    .indicator:hover .tooltip__content {
        opacity: 1;
    }

    .tooltip__content::before {
        content: "";
        display: block;
        position: absolute;
        top: -10px;
        left: 0;
        right: 0;
        margin: 0 auto;
        width: 0;
        height: 0;
        border: 5px solid transparent;
        border-bottom-color: var(--black-disabled);
    }
</style>
