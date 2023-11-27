<template>
    <BaseModal :class="['alert-modal', size]">
        <div class="modal-content">
            <div class="modal-body">
                <div class="alert-container">
                    <div class="icon-container">
                        <i
                            v-if="icon"
                            :class="[
                                ('mdi mdi-' + icon),
                                color
                            ]"
                        >
                        </i>
                    </div>
                    <div class="confirmation-message">
                        <p v-if="messagePrimary" class="primary-text m-h2 bold c-primary">
                            {{ messagePrimary }}
                        </p>
                        <p v-if="messageSecondary" class="c-secondary">
                            {{ messageSecondary }}
                        </p>
                        <p v-if="hasSecondarySlot" class="c-secondary">
                            <slot name="secondary" />
                        </p>
                    </div>
                    <div v-if="hasDetailsSlot" class="details">
                        <slot name="details" />
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <slot name="footer" />
            </div>
        </div>
    </BaseModal>
</template>

<script>
    import BaseModal from '@/components/_generics/BaseModal.vue';

    export default {
        name: 'AlertModal',

        components: {
            BaseModal
        },

        props: {
            size: {
                type: String,
                default: 'tiny'
            },

            icon: {
                type: String,
                required: false
            },

            color: {
                type: String,
                default: 'blue'
            },

            messagePrimary: {
                type: String,
                required: false
            },

            messageSecondary: {
                type: String,
                required: false
            },
        },


        computed: {
            hasDetailsSlot() {
                return !!this.$slots.details;
            },

            hasSecondarySlot() {
                return !!this.$slots.secondary;
            }
        },
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';
    @import '@/stylesheets/sass/base/reset.scss';

    .modal-content {
        overflow: unset;
    }

    .alert-modal {
        &.tiny .modal-content {
            width: 360px;
        }

        &.small .modal-content,
        &.default .modal-content {
            width: 480px;
        }

        &.medium .modal-content {
            width: 640px;
        }
    }

    button + button{
        margin-left: 0;
    }

    .icon-container {
        text-align: center;

        i {
            font-size: 96px;

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

    .confirmation-message {
        margin-top: 16px;
        text-align: center;

        p + p {
            padding-top: 12px;
        }
    }
</style>
