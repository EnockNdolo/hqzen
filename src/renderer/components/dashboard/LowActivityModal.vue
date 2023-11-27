<template>
    <AlertModal
        :icon="timeBeforeTimeOut > 0 ? '' : 'clock-out'"
        color="red"
        size="tiny"
        :message-primary="timeBeforeTimeOut > 0 ? 'Are you still working?' : 'You were timed out.'"
        :message-secondary="timeBeforeTimeOut > 0 ? 'You will be timed out after'
            : 'Time tracking was stopped due to inactivity.'"
    >
        <template
            v-if="timeBeforeTimeOut > 0"
            slot="details"
        >
            <div class="countdown-timer">
                <svg
                    class="countdown-timer__svg"
                    viewBox="0 0 100 100"
                >
                    <g class="countdown-timer__circle">
                        <circle
                            class="countdown-timer__path-elapsed"
                            cx="50"
                            cy="50"
                            r="45"
                        />
                        <path
                            id="countdown-timer-path-remaining"
                            :class="'countdown-timer__path-remaining ' + remainingPathColor"
                            :stroke-dasharray="circleDashArray"
                            d="
                                M 50, 50
                                m -45, 0
                                a 45, 45 0 1, 0 90, 0
                                a 45, 45 0 1, 0 -90, 0
                            "
                        />
                    </g>
                </svg>
                <span id="countdown-timer-label" class="countdown-timer__label">
                    {{ timeBeforeTimeOut }}
                </span>
            </div>
        </template>
        <template
            slot="footer"
        >
            <div
                v-if="timeBeforeTimeOut > 0"
                class="footer-block"
            >
                <Button
                    class="error large block bold"
                    @click="$emit('not-working')"
                >
                    No
                </Button>
                <Button
                    class="success large block bold"
                    @click="$emit('close')"
                >
                    Yes
                </Button>
            </div>
            <div
                v-else
                class="footer-block"
            >
                <Button
                    class="highlight secondary large block"
                    @click="$emit('close')"
                >
                    Dismiss
                </Button>
            </div>
        </template>
    </AlertModal>
</template>

<script>
    import { ipcRenderer } from 'electron';
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import Button from '@/components/_generics/Button.vue';

    const TIME_LIMIT = 60; // in seconds
    const WARNING_THRESHOLD = TIME_LIMIT * 0.5;
    const ALERT_THRESHOLD = TIME_LIMIT * 0.25;
    const FULL_DASH_ARRAY = 283;
    const COLOR_CODES = {
        info: {
            color: 'green'
        },
        warning: {
            color: 'orange',
            threshold: WARNING_THRESHOLD
        },
        alert: {
            color: 'red',
            threshold: ALERT_THRESHOLD
        }
    };

    export default {
        name: 'LowActivityModal',

        components: {
            AlertModal,
            Button,
        },

        data() {
            return {
                timeBeforeTimeOut: TIME_LIMIT,
                timer: null,
                timedOut: false
            };
        },

        computed: {
            remainingPathColor() {
                let { alert, warning, info } = COLOR_CODES;
                if (this.timeBeforeTimeOut <= alert.threshold) {
                    return alert.color;
                } else if (this.timeBeforeTimeOut <= warning.threshold) {
                    return warning.color;
                }
                return info.color;
            },

            timeFraction() {
                let rawTime = this.timeBeforeTimeOut / TIME_LIMIT;
                return rawTime - (1 - rawTime) * (1 / TIME_LIMIT);
            },

            circleDashArray() {
                return `${(
                    this.timeFraction * FULL_DASH_ARRAY
                ).toFixed(0)} 283`;
            }
        },

        created() {
            ipcRenderer.send('toggle-always-on-top', true);
            this.startCountdownTimer();
        },

        beforeDestroy() {
            clearInterval(this.timer);
            this.timer = null;
        },

        methods: {
            startCountdownTimer() {
                this.timer = setInterval(() => {
                    this.timeBeforeTimeOut--;
                    if (this.timeBeforeTimeOut <= 0) {
                        this.$emit('auto-timeout');
                        clearInterval(this.timer);
                    }
                    this.circleDashArray;
                }, 1000);
            },
        }
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    /* Container height and width */
    .countdown-timer {
        width: 150px;
        height: 150px;
        margin: 40px auto 20px;
        position: relative;
    }

    /* Remove SVG styling */
    .countdown-timer__circle {
        fill: none;
        stroke: none;
    }

    /* Timer progress */
    .countdown-timer__path-elapsed {
        stroke: #cbd3d6;
        stroke-width: 10px;
    }

    .countdown-timer__label {
        position: absolute;

        /* Match the parent container */
        width: 150px;
        height: 150px;

        /* Align to the top */
        top: 0;

        /* Center content vertically and horizontally */
        display: flex;
        align-items: center;
        justify-content: center;

        /* Arbitrary number */
        font-size: 50px;
        font-weight: 600;
    }

    .countdown-timer__path-remaining {
        /* Same as the original ring */
        stroke-width: 10px;

        /* Rounds the line endings */
        stroke-linecap: round;

        /* Start animation at the top of the circle */
        transform: rotate(90deg);
        transform-origin: center;

        /* One second aligns with the speed of the countdown timer */
        transition: 1s linear all;

        /* Change color when the color updates */
        stroke: currentColor;
    }

    .countdown-timer__svg {
        /* Animation from left-to-right */
        transform: scaleX(-1);
    }

    .countdown-timer__path-remaining.green {
        color: var(--success)
    }

    .countdown-timer__path-remaining.orange {
        color: var(--warning);
    }

    .countdown-timer__path-remaining.red {
        color: var(--error);
    }

</style>
