<template>
    <div
        ref="modal"
        :class="['modal', size, type]"
        @click="outsideClickHandler($event)"
    >
        <slot />
        <div v-if="hasHeader || hasBody || hasFooter" class="modal-content">
            <div v-if="hasHeader" class="modal-header">
                <slot name="header" />
            </div>
            <div v-if="hasBody" class="modal-body">
                <slot name="body" />
            </div>
            <div v-if="hasFooter" class="modal-footer">
                <slot name="footer" />
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'BaseModal',

        props: {
            allowOutsideClick: {
                type: Boolean,
                default() {
                    return true;
                }
            },

            size: {
                type: String,
                required: false
            },

            type: {
                type: String,
                required: false
            }
        },

        computed: {
            hasHeader() {
                return !!this.$slots.header;
            },

            hasBody() {
                return !!this.$slots.body;
            },

            hasFooter() {
                return !!this.$slots.footer;
            }
        },

        mounted() {
            document.body.style.overflow = 'hidden';
        },

        destroyed() {
            document.body.style.overflow = 'visible';
        },

        methods: {
            outsideClickHandler(event) {
                if (this.allowOutsideClick) {
                    if (event.target === this.$refs.modal) {
                        this.$emit('close');
                    }
                }
            },
        },
    };
</script>

<style scoped lang="scss">
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';
    @import '@/stylesheets/sass/abstract/mixins.scss';

    .modal-open {
        overflow: hidden;
    }

    .modal {
        position: fixed;
        z-index: 101;
        left: 0;
        top: 0;
        @include width-height(100%);
        overflow: auto;
        background: rgba($black, .3);

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

        &.large .modal-content {
            width: 840px;
        }

        &.Xlarge .modal-content {
            width: 1040px;
        }

        &.unclip .modal-content {
            overflow: initial;
        }

        .video-content {
            margin: 0 auto;
            color: $white;
        }
    }

    .modal-content {
        background: $white;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: $shadow-modal;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .modal-loading {
        @include flex-align-justify-center();
        .spinner {
            margin: 32px;
        }

        & ~ * {
            display: none !important;
        }
    }

    .modal-header {
        position: relative;
        width: 100%;
        padding: 20px 24px 0;

        .header-title {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: -0.02rem;
            color: $primary;
        }

        .header-subtitle {
            color: $secondary;
        }

        .header-wrapper {
            :not(:first-child) {
                padding-top: 4px;
            }
        }

        .header-action-wrapper {
            display: flex;
            align-items: flex-start;

            .header-title {
                flex: 1;
            }

            .header-wrapper {
                flex: 1;
                padding-right: 8px;

                .header-title {
                    flex: 0;
                }
            }
        }

        .header-avatar-wrapper {
            display: flex;

            .avatar + .header-wrapper,
            .avatar + .header-title,
            .sign + .header-wrapper,
            .sign + .header-title {
                padding-left: 12px;
                flex: 1;
            }

            .avatar + .header-title,
            .sign + .header-title {
                align-self: center;
            }
        }
    }

    .modal-body,
    .modal-body-alt {
        position: relative;
        padding: 20px 24px;

        & + .modal-footer {
            padding: 0 24px 20px;
        }

        .warning-text {
            color: $error;
        }

        .blue-text {
            color: $accent;
        }

        .alert {
            margin-bottom: 8px;
        }

        > * {
            margin-bottom: 8px;

            &:last-child {
                margin-bottom: 0;
            }
        }

        .subheader-title {
            font-size: 16px;
            color: $secondary;
            margin-bottom: 16px;
        }

        .subheader-subtitle {
            font-size: 14px;
            color: $secondary;
            margin-bottom: 16px;
        }

        .subheader-wrapper {
            margin-bottom: 16px;

            .subheader-title,
            .subheader-subtitle {
                margin-bottom: 0;
            }

            :not(:first-child) {
                padding-top: 2px;
            }
        }

        .subheader-action-wrapper {
            display: flex;
            margin-bottom: 16px;

            .subheader-title {
                flex: 1;
            }

            .subheader-wrapper {
                flex: 1;
                padding-right: 8px;
                margin-bottom: 0;

                .subheader-title {
                    flex: 0;
                }
            }

            a {
                text-decoration: none;
                cursor: pointer;
            }
        }

        .control-group {
            margin-bottom: 20px;
            padding-top: 12px;

            &:first-child {
                padding-top: 0;
            }

            &:last-child {
                margin-bottom: 0;
            }

            .control-group-header .subheader-wrapper,
            .control-group-header .subheader-action-wrapper,
            .control-group-header .subheader-title,
            .control-group-header .subheader-subtitle {
                margin-bottom: 0;
            }

            .control-group-header + .control-group-body {
                padding-top: 16px;
            }
        }
    }

    .modal-footer {
        display: flex;
        justify-content: space-between;
        padding: 20px 24px;

        .footer-left {
            margin-right: auto;
            @include flex-align-center();

            button,
            input,
            p,
            a,
            .base-check,
            .base-radio {
                margin-right: 8px;

                &:last-child {
                    margin-right: 0;
                }
            }
        }

        .footer-block {
            width: 100%;
            display: flex;

            button,
            .button {
                flex: 1;
                margin-left: 4px;
                margin-right: 4px;

                &:first-child {
                    margin-left: 0;
                }

                &:last-child {
                    margin-right: 0;
                }
            }
        }

        .footer-right {
            margin-left: auto;
            @include flex-align-center();

            button,
            input,
            p,
            a,
            .base-check,
            .base-radio {
                margin-left: 8px;

                &:first-child {
                    margin-left: 0;
                }
            }
        }

        .footer-stack {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;

            button,
            a {
                margin-bottom: 8px;

                &:last-child {
                    margin-bottom: 0;
                }
            }

            button + button {
                margin-left: 0;
            }
            a {
                display: block;
            }
        }
    }

</style>
