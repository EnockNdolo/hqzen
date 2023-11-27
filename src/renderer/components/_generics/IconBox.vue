<template>
    <div
        :class="[size, color]"
        class="icon-box"
    >
        <i
            v-if="icon"
            :class="'mdi mdi-' + icon"
        ></i>
    </div>
</template>

<script>
    export default {
        name: 'IconBox',

        props: {
            size: {
                type: String,
                required: false
            },

            color: {
                type: String,
                required: false,
                default: 'secondary'
            },

            icon: {
                type: String,
                required: true
            }
        }
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .icon-box {
        width: 40px;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;

        i {
            font-size: 24px;
        }

        &.primary {
            background: $accent-container;
            color: $accent;
        }

        &.secondary {
            background: $primary-container;
            color: $secondary;
        }

        &.error {
            background: $error-container;
            color: $error;
        }

        &.success {
            background: $success-container;
            color: $success;
        }

        &.warning {
            background: $warning-container;
            color: $warning;
        }

        &.violet {
            background: $violet-container;
            color: $violet;
        }

        &.tiny {
            width: 18px;
            height: 18px;

            i {
                font-size: 14px;
            }
        }

        &.small {
            width: 28px;
            height: 28px;

            i {
                font-size: 16px;
            }
        }

        &.medium {
            width: 48px;
            height: 48px;

            i {
                font-size: 24px;
            }
        }

        &.large {
            width: 56px;
            height: 56px;

            i {
                font-size: 32px;
            }
        }

        &.x-large {
            width: 126px;
            height: 126px;

            i {
                font-size: 56px;
            }
        }

        &.xx-large {
            width: 168px;
            height: 168px;

            i {
                font-size: 96px;
            }
        }
    }
</style>
