<template>
    <div>
        <template
            v-if="timeBeforeTimeOut > 0"
        >
            <div
                :class="['countdown-timer', size ? size : '']"
            >
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
                    {{ timeBeforeTimeOutString }}
                </span>
            </div>
        </template>
    </div>
</template>

<script>
    import { ipcRenderer } from 'electron';

    const FULL_DASH_ARRAY = 283;

    export default {
        name: 'CountdownTimer',

        props: {
            time: {
                type: Number,
                required: false,
                default: 60
            },

            overrideCounter: {
                type: Number,
                required: false
            },

            size: {
                type: String,
                required: false,
                default: 'medium'
            }
        },

        data() {
            return {
                timeBeforeTimeOut: this.time,
                timer: null,
                colorCodes: {
                    info: {
                        color: 'green'
                    },
                    warning: {
                        color: 'orange',
                        threshold: this.time * 0.5
                    },
                    alert: {
                        color: 'red',
                        threshold: this.time * 0.25
                    }
                }
            };
        },

        computed: {
            remainingPathColor() {
                let { alert, warning, info } = this.colorCodes;
                if (this.timeBeforeTimeOut <= alert.threshold) {
                    return alert.color;
                } else if (this.timeBeforeTimeOut <= warning.threshold) {
                    return warning.color;
                }
                return info.color;
            },

            timeFraction() {
                let rawTime = this.timeBeforeTimeOut / this.time;
                return rawTime - (1 - rawTime) * (1 / this.time);
            },

            circleDashArray() {
                return `${(
                    this.timeFraction * FULL_DASH_ARRAY
                ).toFixed(0)} 283`;
            },

            timeBeforeTimeOutString() {
                if (Math.floor(this.timeBeforeTimeOut / 60) > 0) {
                    return `${Math.floor(this.timeBeforeTimeOut/60)}m`;
                }
                return this.timeBeforeTimeOut;
            }
        },

        watch: {
            overrideCounter() {
                this.timeBeforeTimeOut = this.overrideCounter;
                if (this.timeBeforeTimeOut <= 0) {
                    this.$emit('auto-timeout');
                }
                this.circleDashArray;
            }
        },

        created() {
            ipcRenderer.send('show-window');
            this.timeBeforeTimeOut = this.time;
            if (!this.overrideCounter) {
                this.startCountdownTimer();
            }
        },

        beforeDestroy() {
            clearInterval(this.timer);
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
    /* Container height and width */
    .countdown-timer {
        width: 90px;
        height: 90px;
        position: relative;

        &.small {
            width: 50px;
            height: 50px;

            & > .countdown-timer__label {
                width: 50px;
                height: 50px;
                font-size: 18px;
                font-weight: 500;
            }
        }

        &.medium {
            // default
        }

        &.large {
            width: 120px;
            height: 120px;

            & > .countdown-timer__label {
                width: 120px;
                height: 120px;
                font-size: 48px;
                font-weight: 500;
            }
        }

        &.xlarge {
            width: 180px;
            height: 180px;

            & > .countdown-timer__label {
                width: 180px;
                height: 180px;
                font-size: 52px;
                font-weight: 500;
            }
        }

        &__label {
            position: absolute;

            /* Match the parent container */
            width: 90px;
            height: 90px;

            /* Align to the top */
            top: 0;

            /* Center content vertically and horizontally */
            display: flex;
            align-items: center;
            justify-content: center;

            /* Arbitrary number */
            font-size: 35px;
            font-weight: 400;
            font-weight: 500;
        }

        /* Remove SVG styling */
        &__circle {
            fill: none;
            stroke: none;
        }

        &__path-elapsed {
            stroke: #cbd3d6;
            stroke-width: 10px;
        }

        &__path-remaining {
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

        &__svg {
            /* Animation from left-to-right */
            transform: scaleX(-1);
        }

        &__path-remaining.green {
            color: var(--success)
        }

        &__path-remaining.orange {
            color: var(--warning);
        }

        &__path-remaining.red {
            color: var(--error);
        }
    }
</style>