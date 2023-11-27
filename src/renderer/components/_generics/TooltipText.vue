<template>
    <div class="tooltip">
        <slot />
    </div>
</template>

<script>
    export default {
        name: 'TooltipText'
    };
</script>

<style scoped lang="scss">
    .tooltip {
        background-color: rgba(68, 79, 84, 0.5);
        position: absolute;
        text-align: center;
        padding: 4px 8px;
        max-width: 100%;
        font-size: 11px;
        color: var(--white-primary);
        border-radius: 5px;
        z-index: 9;
    }

    .tooltip::after {
        content: '';
        position: absolute;
        bottom: -10px;
        border: 5px solid transparent;
    }

    /**
     * Top / Bottom: Tooltip is on top/bottom of wrapper
     * Left / Right / Center: Tooltip is on the far left/right/center of wrapper
     */

    .tooltip.top {
        bottom: calc(100% + 4px);
    }

    .tooltip.top::after {
        border-top-color: rgba(68, 79, 84, 0.5);
    }

    .tooltip.bottom {
        top: calc(100% + 4px);
    }

    .tooltip.bottom::after {
        bottom: 100%;
    }

    .tooltip.right {
        right: 0;
    }

    .tooltip.right::after {
        right: 4px;
    }

    .tooltip.left {
        left: 0;
    }

    .tooltip.left::after {
        left: 4px;
    }

    .tooltip.center,
    .tooltip.center::after {
        left: 50%;
        transform: translateX(-50%);
    }
</style>
