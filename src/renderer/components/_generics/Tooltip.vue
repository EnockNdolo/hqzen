<template>
    <div class="tooltip">
        <slot />
    </div>
</template>

<script>
    export default {
        name: 'Tooltip',

        props: {
            width: {
                type: String,
            }
        }
    };
</script>

<style scoped lang="scss">
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .tooltip {
        position: absolute;
        width: max-content;
        box-sizing: content-box;
        background-color: rgba($secondary, .8);
        color: $white;
        border-radius: $corner-radius;
        padding: 4px 8px;
        z-index: 1;

        p {
            margin: 0;
        }

        &.right {
            right: 0;
        }

        &.left {
            left: 0;
        }

        &.center {
            left: 50%;
            transform: translateX(-50%);
        }

        &.top {
            bottom: calc(100% + 4px);
        }

        &.bottom {
            top: calc(100% + 4px);
        }

        &.side {
            &#{-left} {
                top: 0;
                right: calc(100% + 4px);
            }

            &#{-right} {
                top: 0;
                left: calc(100% + 4px);
            }
        }
    }
</style>
