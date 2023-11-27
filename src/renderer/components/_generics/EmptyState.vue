<template>
    <div
        class="empty-state-container"
        :class="size"
    >
        <div v-if="icon" class="icon">
            <i
                :class="[
                    ('mdi mdi-' + icon),
                    color
                ]"
            >
            </i>
        </div>
        <div class="message">
            <p
                v-if="primary"
                class="primary-text secondary"
                :class="(size == 'compact' ? 't-md' : 'm-h2 bold')"
            >
                {{ primary }}
            </p>
            <p v-if="secondary" class="tertiary">
                {{ secondary }}
            </p>
            <slot name="message" />
            <div v-if="hasDetailsSlot" class="details">
                <slot name="details" />
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'EmptyState',

        props: {
            icon: {
                type: String,
                required: false
            },

            color: {
                type: String,
            },

            size: {
                type: String
            },

            primary: {
                type: String,
                required: false
            },

            secondary: {
                type: String,
                required: false
            }
        },

        computed: {
            hasDetailsSlot() {
                return !!this.$slots.details;
            },
        }
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .empty-state-container {
        text-align: center;
        margin: 48px;
        display: flex;
        height: 200px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;

        p {
            margin: 16px 0 0 0;

            &.secondary {
                color: $secondary;
            }

            &.tertiary {
                color: $tertiary;
            }
        }

        .icon {
            i {
                font-size: 96px;
                color: $tertiary;

                &.blue {
                    color: $accent;
                }

                &.red {
                    color: $error;
                }

                &.green {
                    color: $success;
                }

                &.yellow {
                    color: $warning;
                }
            }
        }

        .details {
            margin-top: 24px;
        }

        .message {
            margin-top: 24px;

            p + p {
                padding-top: 12px;
            }
        }

        &.compact {
            margin: 24px;

            .icon i {
                font-size: 48px;
            }

            .message,
            .details {
                margin-top: 16px;
            }
        }
    }
</style>

