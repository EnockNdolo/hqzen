<template>
    <button
        v-bind="$attrs"
        class="base-button"
        v-on="$listeners"
    >
        <slot />
    </button>
</template>

<script>
    export default {
        name: 'BaseButton'
    };
</script>

<style scoped lang="scss">
    @import 'src/renderer/stylesheets/sass/abstract/variables.scss';
    @import 'src/renderer/stylesheets/sass/abstract/mixins.scss';

    input[type=button],
    button,
    .button {
        @include user-select(none);
        height: 36px;
        color: $black;
        background: $white;
        cursor: pointer;
        border: 0;
        border-radius: 4px;
        outline: none;
        display: inline-flex;
        font-size: 14px;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        transition-duration: .2s;
        padding: 0 16px;

        * {
            font-size: inherit;
        }

        .material-icons,
        .mdi {
            font-size: 18px;

            & + span {
                padding-left: 8px;
            }
        }

        &.icon-text {
            .material-icons,
            .mdi {
                margin-left: -4px;
            }
        }

        .badge {
            min-width: 16px;
            height: 16px;
            padding: 0 4px;
            margin-left: 6px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            border-radius: 24px;
            background: $red;
            color: $white;

            &.blue {
                background: $blue;
            }

            &.white {
                background: $white;
                color: $blue;
            }
        }

        @media #{$tablet} {
            padding: 0 12px;
            height: 32px;

            i, span {
                font-size: 14px;
            }
        }

        &.link {
            padding: 0 !important;
            min-height: 0 !important;
            background: none;
        }

        &.link:hover {
            color: $dark-blue;
        }

        &.transparent {
            background: transparent;
            padding: 4px 16px;
            transition: 300ms ease-out background;
        }

        &.transparent:hover {
            background: $gray-95;
        }

        &.create-issue-btn {
            height: 40px;
        }

        &.issue-btn {
            font-size: 14px !important;
            height: 40px;
        }

        &.rounded {
            border-radius: 50px;
        }

        &.circle {
            height: 34px;
            width: 34px;
            padding: 0;
            font-size: 12px;
            color: $gray-50 !important;
        }

        &.nowrap {
            white-space: nowrap;
        }

        &.capitalize {
            text-transform: initial;
        }

        &.regular-text {
            text-transform: none;
        }

        &.small,
        &.medium {
            height: 28px;
            padding: 0 12px;
            font-size: 14px;

            @media #{$tablet} {
                padding: 0 8px;
                height: 24px;
                font-size: 14px;
            }

            .material-icons,
            .mdi {
                font-size: 16px;

                & + span {
                    padding-left: 6px;
                }
            }

            &.icon-text {
                .material-icons,
                .mdi {
                    font-size: 16px;
                }

                span {
                    padding-bottom: 1px;
                }
            }
        }

        &.large {
            height: 44px;
            padding: 0 16px;

            @media #{$tablet} {
                height: 40px;
                font-size: 14px;
            }
        }

        &.wide {
            padding: 0 64px;

            @media #{$tablet} {
                padding: 0 48px;
            }
        }

        &.block {
            width: 100%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }

        &.blue {
            color: $white;
            background: $accent-color;

            &:hover {
                background: $blue-hover;
            }

            &[disabled] {
                background: $blue-disabled;
                cursor: not-allowed;
                pointer-events: none;
            }
        }

        &.purple {
            color: $white;
            background: $violet;

            &.shadow {
                &:hover {
                    box-shadow: 0 0px 5px $violet;
                }

                &:active {
                    box-shadow: 0 0px 10px $violet;
                }
            }

            &:hover {
                background: darken($violet, 5%);
            }

            &:active {
                background: darken($violet, 15%);
            }

            &[disabled] {
                background: lighten($violet, 30%);
                cursor: not-allowed;
                pointer-events: none;
            }
        }

        &.gray {
            color: $darkest-gray;
            background: $gray-95;

            &:hover {
                background: darken($light-gray, 7.5%);
            }

            &[disabled] {
                background: $lightest-gray;
                color: $gray;
                cursor: not-allowed;
                pointer-events: none;
            }
        }

        &.red {
            background: $red;
            color: $white;

            &:hover {
                background: $red-hover;
            }

            &[disabled] {
                background: $red-disabled;
                cursor: not-allowed;
                pointer-events: none;
            }
        }

        &.yellow {
            color: $white;
            background: $yellow;

            &:hover {
                background: $yellow-hover;
            }

            &[disabled] {
                background: $yellow-disabled;
                cursor: not-allowed;
                pointer-events: none;
            }
        }

        &.green {
            color: $white;
            background: $green;

            &:hover {
                background: $green-hover;
            }

            &[disabled] {
                background: $green-disabled;
                cursor: not-allowed;
                pointer-events: none;
            }
        }

        &.white {
            color: $black;
            background: $white;
            border: 1px solid $light-gray;

            &:hover {
                background: $lightest-gray;
            }

            &[disabled] {
                border: 1px solid lighten($light-gray, 5%);
                color: $gray;
                background: lighten($light-gray, 7.5%);
                cursor: not-allowed;
                pointer-events: none;
            }
        }

        // bordered buttons
        &.border {
            border: 1px solid $black;
            background: $white;

            &.blue {
                border: 1px solid $blue;
                color: $blue;

                &:hover {
                    background: $blue-hover-semifilled;
                    box-shadow: none;
                }

                &[disabled] {
                    border-color: $blue-disabled;
                    background: $white;
                    color: $blue-disabled;
                    cursor: not-allowed;
                    pointer-events: none;
                }
            }

            &.red {
                border: 1px solid $red;
                color: $red;

                &:hover {
                    background: $red-hover-semifilled;
                    box-shadow: none;
                }

                &[disabled] {
                    border-color: $red-disabled;
                    background: $white;
                    color: $red-disabled;
                    cursor: not-allowed;
                    pointer-events: none;
                }
            }

            &.green {
                border: 1px solid $green;
                color: $green;

                &:hover {
                    background: $green-hover-semifilled;
                    box-shadow: none;
                }

                &[disabled] {
                    border-color: $green-disabled;
                    background: $white;
                    color: $green-disabled;
                    cursor: not-allowed;
                    pointer-events: none;
                }
            }

            &.yellow {
                border: 1px solid $yellow;
                color: $yellow;

                &:hover {
                    background: $yellow-hover-semifilled;
                    box-shadow: none;
                }

                &[disabled] {
                    border-color: $yellow-disabled;
                    background: $white;
                    color: $yellow-disabled;
                    cursor: not-allowed;
                    pointer-events: none;
                }
            }

            &.gray {
                border: 1px solid $gray-90;
                color: $black;

                &:hover {
                    border: 1px solid $black;
                    background-color: $white;
                }

                &:focus {
                    border: 1px solid $black;
                    outline: none;
                }
            }
        }

        &.highlight {
            background: none;

            @include border-button('white', $white, 0);

            &.blue {
                color: $blue;

                &:hover {
                    background: $blue-hover-semifilled;
                    box-shadow: none;
                }

                &[disabled] {
                    color: $blue-disabled;
                    background: none;
                }
            }

            &.red {
                color: $red;

                &:hover {
                    background: $red-hover-semifilled;
                    box-shadow: none;
                }

                &[disabled] {
                    color: $red-disabled;
                    background: none;
                }
            }

            &.green {
                color: $green;

                &:hover {
                    background: $green-hover-semifilled;
                    box-shadow: none;
                }

                &[disabled] {
                    color: $green-disabled;
                    background: none;
                }
            }

            &.yellow {
                color: $yellow;

                &:hover {
                    background: $yellow-hover-semifilled;
                    box-shadow: none;
                }

                &[disabled] {
                    color: $yellow-disabled;
                    background: none;
                }
            }

            &.gray {
                color: $dark-gray;

                &:hover {
                    background: $light-gray;
                    box-shadow: none;
                }

                &[disabled] {
                    color: $light-gray;
                    background: none;
                }
            }

            &.white {
                color: $white;

                &:hover {
                    background: rgba($white, .25);
                    box-shadow: none;
                }

                &[disabled] {
                    color: $light-gray;
                    background: none;
                }
            }

            &.darker-gray {
                color: $darker-gray;

                &:hover {
                    background: rgba($darker-gray, .25);
                    box-shadow: none;
                }

                &[disabled] {
                    color: $light-gray;
                    background: none;
                }
            }
        }

        &.icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 28px;
            min-width: 28px;
            border-radius: 24px;
            padding: 0;

            &.rect {
                border-radius: 4px;
            }

            &.small {
                height: 20px;
                min-width: 20px;

                i {
                    font-size: 14px;
                }
            }

            &.medium {
                height: 40px;
                min-width: 40px;

                i {
                    font-size: 18px;
                }
            }

            &.large {
                height: 48px;
                min-width: 48px;
                border-radius: 48px;

                i {
                    font-size: 24px;
                }
            }
        }

        &.playback {
            @include width-height(64px);
            @include flex-align-justify-center();
            border-radius: 50%;
            background: rgba($darkest-gray, 0.75);
            color: $white;

            i {
                font-size: 32px;
            }
        }

        &.player-controls {
            @include width-height(36px);
            @include flex-align-justify-center();
            padding: 0;
            background: none;
            color: $white;
            text-shadow: $elevation-default;
        }
    }

    a.button {
        display: inline-flex;
        text-decoration: none;

        &:hover {
            text-decoration: none;
        }
    }

    .go-top {
        @include width-height(48px);
        @include flex-align-justify-center(column);
        @include user-select(none);
        position: fixed;
        text-decoration: none !important;
        user-select: none;
        background: $accent-color;
        color: $white !important;
        border-radius: 50%;
        transition-duration: .2s;
        bottom: 48px;
        right: 128px;
        z-index: 200;
        opacity: 0;

        @media #{$laptop-medium} {
            right: 96px;
        }

        @media #{$laptop} {
            right: 64px;
        }

        @media #{$tablet} {
            right: 48px;
        }

        @media #{$tablet} {
            @include width-height(40px);
            bottom: 32px;
            right: 16px;
        }

        &:hover {
            box-shadow: $elevation-hover;
        }

        &.show {
            opacity: 1;
        }
    }

    .selection-button {
        @include inline-flex-align-center();
        height: 36px;

        @media #{$tablet} {
            height: 32px;
        }

        input[type=checkbox],
        input[type=radio] {
            margin: 0;
            cursor: pointer;
            display: none;

            &:checked ~ label {
                background: $accent-color;
                color: $white;
                border-color: $accent-color;
                box-shadow: 0 0px 10px $accent-color;

                span {
                    display: none;
                }

                &:after {
                    content: 'Selected';
                }
            }
        }

        label {
            @include flex-align-center();
            @include user-select(none);
            height: inherit;
            padding: 0 16px;
            color: $darkest-gray;
            background: $white;
            border: 1px solid $light-gray;
            border-radius: 4px;
            text-transform: uppercase;
            cursor: pointer;
            transition-duration: .2s;

            @media #{$tablet} {
                font-size: 14px;
                padding: 0 12px;
            }

            &:hover {
                background: darken($white, 2.5%);
            }

            &:active {
                background: darken($white, 5%);
            }
        }
    }
</style>
