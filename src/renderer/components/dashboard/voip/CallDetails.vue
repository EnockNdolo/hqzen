<template>
    <section class="call-details">
        <div class="content">
            <div class="call">
                <h4>Call # 123456789</h4>
                <p>+ 63 917 585 8846</p>

                <div class="status">
                    <div v-if="status == 2" class="incoming">
                        Incoming
                    </div>
                    <div v-else-if="status == 3" class="time">
                        01:56
                        <span v-if="paused" class="paused">
                            Paused
                        </span>
                        <span v-if="recording" class="recording">
                            {{ recordingDur }} Rec.
                        </span>
                    </div>
                </div>
            </div>

            <div class="controls">
                <div
                    :class="{ pickup: status == 2, hangup: status == 3 }"
                    class="control-button main"
                >
                    <button @click="toggleStatus">
                        <i class="material-icons">call</i>
                    </button>
                    <small v-if="status == 2">Pick up</small>
                    <small v-else-if="status == 3">Hang up</small>
                </div>

                <div class="control-button record">
                    <button v-if="status != 3" class="disabled">
                        <i class="icon">record</i>
                    </button>
                    <button v-else @click="recording = !recording">
                        <i :class="{ stop: recording }" class="icon">record</i>
                    </button>
                    <small v-if="!recording">Start Recording</small>
                    <small v-else>Stop Recording</small>
                </div>

                <div class="control-button hold">
                    <button v-if="status != 3" class="disabled">
                        <i class="material-icons">pause</i>
                    </button>
                    <button v-else @click="paused = !paused">
                        <i v-if="!paused" class="material-icons">pause</i>
                        <i v-else class="material-icons">play_arrow</i>
                    </button>
                    <small v-if="!paused">Pause</small>
                    <small v-else>Resume</small>
                </div>

                <div class="control-button forward">
                    <button>
                        <i class="material-icons">forward</i>
                    </button>
                    <small>Forward</small>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
    export default {
        name: 'CallDetails',

        data() {
            return {
                status: '2',
                duration: '1:56',
                paused: false,
                recording: false,
                recordingDur: '1:00',
            };
        },

        methods: {
            toggleStatus() {
                if (this.status === 2) {
                    this.status = 3;
                } else {
                    this.status = 2;
                }
            },
        },
    };
</script>

<style scoped>
    .call-details {
        margin-top: 12px;
        padding: 12px 0;
    }

    .content {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    h4 {
        margin: 0;
        font-weight: 500;
        font-size: 16px;
    }

    h4 + p {
        margin: 0;
        color: var(--black-secondary);
    }

    .call {
        min-width: 160px;
    }

    .status {
        margin-top: 12px;
        text-transform: uppercase;
        font-weight: 500;
        font-size: 12px;
    }

    .incoming {
        color: var(--primary);
    }

    .time {
        display: flex;
        color: var(--black-secondary);
    }

    .paused {
        display: inline-block;
        margin-left: 8px;
        color: var(--black-disabled);
        animation: breathe 1.3s infinite ease;
    }

    @keyframes breathe {
        0%, 100% {
            opacity: 1;
        }

        50% {
            opacity: 0;
        }
    }

    .recording {
        margin-left: auto;
        color: var(--error);
    }

    .controls {
        display: flex;
        align-items: center;
    }

    .control-button {
        position: relative;
        padding-bottom: 34px;
    }

    .control-button:not(:first-child) {
        margin-left: 18px;
    }

    .main button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        width: 48px;
        height: 48px;
        line-height: 48px;
        color: var(--white-primary);
        border-radius: 50%;
    }

    .pickup button {
        background-color: var(--success);
    }

    .hangup button {
        background-color: var(--error);
    }

    .main .material-icons {
        transition: transform var(--transition);
    }

    .hangup .material-icons {
        transform: rotate(135deg);
    }

    .control-button small {
        position: absolute;
        left: 0;
        right: 0;
        top: calc(48px + 8px);
        text-align: center;
        font-size: 11px;
        color: var(--black-disabled);
    }

    .record small {
        top: calc(48px + 3px);
    }

    .control-button:not(.main) button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        width: 48px;
        height: 48px;
        line-height: inherit;
    }

    .record .icon {
        background-color: var(--body-bg);
        display: inline-block;
        position: relative;
        width: 16px;
        height: 16px;
        font-size: 0;
        border: 2px solid var(--black-primary);
    }

    .record .icon::after {
        content: "";
        background-color: var(--black-primary);
        position: absolute;
        display: block;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: auto;
        width: 10px;
        height: 10px;
    }

    .record .icon,
    .record .icon::after {
        border-radius: 50%;
        transition: border-radius var(--transition);
    }

    .icon.stop {
        width: 12px;
        height: 12px;
    }

    .icon.stop,
    .icon.stop::after {
        background-color: var(--black-primary);
        border-radius: 0%;
    }

    .disabled {
        --black-primary: var(--black-disabled);
        color: var(--black-primary);
    }
</style>
