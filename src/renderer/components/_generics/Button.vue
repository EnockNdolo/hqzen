<template>
    <!--
        CLASSES
        Sizes: .small .large
        Colors: .primary .secondary .tertiary, .success, .error
        Modifiers: .highlight .border .transparent .compact
        Icon-only: .iconic (NOTE: DO NOT ADD TEXT!)

        PROPERTIES
        icon, icon-right

        ==============================
        CLASS ORDER
        [icon-only (optional)] [size] [modifier (optional)] [color]
        ==============================

        ==============================
        HOW TO ADD ICONS TO BUTTONS:

        Icon + Text
        <Button icon="check">
            Hello World!
        </Button>

        Icon-only
        <Button class="iconic" icon="check" />
        ==============================

        USING COMPACT BUTTONS:
        <Button class="small compact" icon="check">Button</Button>

        Refer to this website for the icon names: https://petershaggynoble.github.io/MDI-Sandbox/
    -->
    <button
        v-bind="$attrs"
        v-on="$listeners"
        :disabled="disabled"
    >
        <i v-if="icon" :class="'icon mdi mdi-' + icon"></i>
        <slot />
        <i v-if="iconRight" :class="'icon right mdi mdi-' + iconRight"></i>
    </button>
</template>

<script>
    export default {
        name: 'Button',

        props: {
            icon: {
                type: String,
                required: false
            },

            iconRight: {
                type: String,
                required: false
            },
            disabled: {
                type: Boolean,
                required: false,
            }
        },

        data() {
            return {};
        }
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';
    @import '@/stylesheets/sass/abstract/variables.scss';

    button {
        display: inline-flex;
        align-items: center;
        height: 40px;
        padding: 0 $sp-20;
        border: 1px solid $quaternary;
        background: $white;
        outline: none;
        transition-duration: .2s;
        border-radius: $corner-radius;
        color: $primary;
        cursor: pointer;
        user-select: none;

        .icon {
            font-size: 18px;
            padding-bottom: 2px;
            padding-right: 10px;
            display: inline-block;
            transform: translateY(1px);

            &.right {
                padding-left: 8px;
                padding-right: 0;
            }
        }

        p, span {
            display: inline-block;
        }

        .badge {
            margin-left: 8px;
        }

        &.rounded {
            border-radius: 56px;
        }

        &.square {
            border-radius: 4px !important;
        }

        &.compact {
            padding: 0 12px;
        }

        &.bold {
            font-weight: 600;
        }

        &.dash {
            border-style: dashed;
        }

        &.thick {
            border-width: 2px;
        }

        &:hover {
            background: lighten($quaternary, 5%);
        }

        @media #{$tablet} {
            height: 36px;
            padding: 0 14px;
        }

        @media #{$mobile-small} {
            height: 34px;
            padding: 0 8px;
        }

        &[disabled] {
            background: #FAFAFA;
            color: #6D7679;
            border-color: #E4E7E8;
            cursor: not-allowed;
        }

        &.c-error {
            color: $error;

            &:hover {
                background: #FDEAEE;
                border-color: $error;
            }

            &[disabled] {
                color: #F9ABBB;
            }
        }

        &.c-success {
            color: $success;

            &:hover {
                background: #E6F8F0;
                border-color: $success;
            }

            &[disabled] {
                color: #9DE2C5;
            }
        }

        &.c-accent {
            color: $accent;

            &:hover {
                background: #EAF6FC;
                border-color: $accent;
            }

            &[disabled] {
                color: #98D1EE;
            }
        }

        &.c-disabled {
            color: $error;

            &[disabled] {
                color: #F9ABBB;
            }
        }

        // Sizes

        &.small {
            height: 32px;
            padding: 0 14px;

            @media #{$tablet} {
                height: 30px;

                .icon {
                    font-size: 13px;
                }
            }
        }

        &.regular {
            // this is the default, no need to define
        }

        &.large {
            height: 48px;

            &.compact {
                padding: 0 16px;
            }

            @media #{$tablet} {
                height: 42px;
                font-size: 14px;
                padding: 0 $sp-16;

                .icon {
                    font-size: 17px;
                }
            }
        }

        &.x-large {
            height: 64px;
        }

        &.block {
            display: block;
            width: 100%;
        }

        // Colors

        &.primary {
            background: $accent;
            color: $white;
            border: 0;

            &:hover {
                background: darken($accent, 10%);
            }

            &[disabled] {
                background: #98D1EE;
            }
        }

        &.secondary {
            // this is the default appearance, no need to define in the class
        }

        &.tertiary {
            background: none;
            border: 0;

            &:hover {
                background: lighten($quaternary, 5%);
            }

            &[disabled] {
                background: #FAFAFA;
                color: #B4B9BB;
            }
        }

        &.success {
            background: $success;
            color: $white;
            border: 0;

            &:hover {
                background: darken($success, 6%);
            }

            &[disabled] {
                background: #9DE2C5;
            }
        }

        &.error {
            background: $error;
            color: $white;
            border: 0;

            &:hover {
                background: darken($error, 6%);
            }

            &[disabled] {
                background: #F9ABBB;
            }
        }

        &.warning {
            background: $warning;
            color: $white;
            border: 0;

            &:hover {
                background: darken($warning, 6%);
            }

            &[disabled] {
                background: #FDF2D3;
            }
        }

        &.white {
            background: none;
            color: $white;
            border: 0;

            &:hover {
                background: rgba($white, .3);
            }

            &[disabled] {
                background: none;
                opacity: .5;
            }
        }

        // Modifiers

        &.border {
            background: $white;

            &.primary {
                border: 1px solid rgba($accent, .7);
                color: $accent;

                &:hover {
                    background: #EAF6FC;
                }

                &[disabled] {
                    background: #FAFAFA;
                    color: #98D1EE;
                    border-color: #98D1EE;
                }
            }

            &.secondary {
                border: 1px solid rgba($secondary, .7);
                color: $primary;

                &:hover {
                    background: lighten($quaternary, 5%);
                }

                &[disabled] {
                    background: #FAFAFA;
                    color: #B4B9BB;
                    border-color: #B4B9BB;
                }
            }

            &.tertiary {
                // Not applicable
            }

            &.success {
                border: 1px solid rgba($success, .7);
                color: $success;

                &:hover {
                    background: #E6F8F0;
                }

                &[disabled] {
                    background: #FAFAFA;
                    color: #9DE2C5;
                    border-color: #9DE2C5;
                }
            }

            &.error {
                border: 1px solid rgba($error, .7);
                color: $error;

                &:hover {
                    background: #FDEAEE;
                }

                &[disabled] {
                    background: #FAFAFA;
                    color: #F9ABBB;
                    border-color: #F9ABBB;
                }
            }

            &.warning {
                border: 1px solid rgba($warning, .7);
                color: $warning;

                &:hover {
                    background: #FDF2D3;
                }

                &[disabled] {
                    background: #FAFAFA;
                    color: #FDF2D3;
                    border-color: #FDF2D3;
                }
            }
        }

        &.highlight {
            &.primary {
                background: $accent-highlight;
                color: $accent;

                &:hover {
                    background: #B3DDF3;
                }

                &[disabled] {
                    background: #EFF8FC;
                    color: #2e3133;
                }
            }

            &.secondary {
                background: $primary-highlight;
                border: none;
                color: $secondary;

                &:hover {
                    background: #DBDDDF;
                }

                &[disabled] {
                    background: #F9FAFA;
                    color: #B4B9BB;
                }
            }

            &.tertiary {
                // Not applicable
            }

            &.success {
                background: $success-highlight;
                color: $success;

                &:hover {
                    background: #A4E4C9;
                }

                &[disabled] {
                    background: #EBF9F3;
                    color: #9DE2C5;
                }
            }

            &.error {
                background: $error-highlight;
                color: $error;

                &:hover {
                    background: #F9B1C0;
                }

                &[disabled] {
                    background: #FFF0F3;
                    color: #F9ABBB;
                }
            }
        }

        &.filter {
            border: 1px solid $gray;
            border-radius: 50px;
            height: 44px;
            padding: 0 16px;

            @media #{$tablet} {
                height: 40px;
                padding: 0 14px;
            }
        }

        &.transparent {
            background: none;

            &.primary {
                color: $accent;

                &:hover {
                    background: #EAF6FC;
                }

                &[disabled] {
                    background: #FAFAFA;
                    color: #98D1EE;
                }
            }

            &.secondary {
                border: none;
                color: $primary;

                &:hover {
                    background: lighten($quaternary, 5%);
                }

                &[disabled] {
                    background: #FAFAFA;
                    color: #B4B9BB;
                }
            }

            &.tertiary {
                // use <Button class="tertiary"> instead
            }

            &.success {
                color: $success;

                &:hover {
                    background: #E6F8F0;
                }

                &[disabled] {
                    background: #FAFAFA;
                    color: #9DE2C5;
                }
            }

            &.error {
                color: $error;

                &:hover {
                    background: #FDEAEE;
                }

                &[disabled] {
                    background: #FAFAFA;
                    color: #F9ABBB;
                }
            }
        }

        // Icon buttons

        &.iconic {
            padding: 0;
            width: 40px;
            border-radius: 4px;
            justify-content: center;

            .icon {
                padding: 0;
                font-size: 24px;
            }

            &.rounded {
                border-radius: 100%;
            }

            @media #{$tablet} {
                width: 36px;
            }

            &.rounded {
                border-radius: 50%;
            }

            &.x-large {
                width: 64px;

                .icon {
                    font-size: 28px;
                }
            }

            &.large {
                width: 48px;

                .icon {
                    font-size: 24px;
                }

                @media #{$tablet} {
                    width: 42px;
                }
            }

            &.medium {
                width: 36px;
                height: 36px;

                .icon {
                    font-size: 20px;
                }

                @media #{$tablet} {
                    width: 30px;
                }
            }

            &.small {
                width: 32px;

                .icon {
                    font-size: 17px;
                }

                @media #{$tablet} {
                    width: 30px;
                }
            }

            &.tiny {
                width: 26px;
                height: 26px;

                .icon {
                    font-size: 18px;
                    margin-bottom: 2px;
                }
            }
        }
    }

    button + button {
        margin-left: 8px;
    }

</style>
