<template>
    <div class="loading-spinner">
        <div class="spinner"></div>
    </div>
</template>

<script>
    export default {
        name: 'LoadingSpinner',
    };
</script>

<style scoped lang="scss">
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .loading-spinner {
        display: flex;
        align-items: center;
        justify-content: center;

        &.tiny > .spinner {
            @include width-height(16px);

            &:after,
            &:before {
                border-width: 2px;
                @include width-height(16px);
            }
        }

        &.small > .spinner {
            @include width-height(20px);

            &:after,
            &:before {
                border-width: 3px;
                @include width-height(20px);
            }
        }

        &.large > .spinner {
            @include width-height(52px);

            &:after,
            &:before {
                border-width: 6px;
                @include width-height(52px);
            }
        }

        &.larger > .spinner {
            @include width-height(72px);

            &:after,
            &:before {
                border-width: 8px;
                @include width-height(72px);
            }
        }

        &.white > .spinner {
            &:before {
                border-color: rgba($white, .5);
            }

            &:after {
                border-top-color: $white;
                border-bottom-color: $white;
            }
        }
    }

    .spinner {
        @include width-height(32px);
        border-radius: 50%;
        position: relative;
        display: inline-block;

        &:after,
        &:before {
            content: '';
            display: block;
            @include width-height(32px);
            border-radius: 50%;
        }

        &:before {
            position: absolute;
            top: 0;
            left: 0;
            border: 4px solid rgba($accent, .5);
        }

        &:after {
            position: absolute;
            top: 0;
            left: 0;
            border: 4px solid transparent;
            border-top-color: $accent;
            border-bottom-color: $accent;
            animation: spin 1s ease-in-out infinite;
        }
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }

        100% {
            transform: rotate(360deg);
        }
    }
</style>
