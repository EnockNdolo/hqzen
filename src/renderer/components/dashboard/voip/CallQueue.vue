<template>
    <section class="call-queue">
        <header @click="openQueue = !openQueue">
            <div>
                Calls Queued
                <span :class="{ empty: calls.length == 0 }">
                    {{ calls.length }}
                </span>
            </div>
            <div class="show-queue">
                Show Queue
            </div>
        </header>

        <section :class="{ expanded: openQueue }" class="calls">
            <p v-if="calls.length == 0" class="empty">
                No Calls in Queue
            </p>
            <template v-else>
                <Call
                    v-for="(call, index) in calls"
                    :key="`call-${index}-${call.number}`"
                    :call="call"
                />
            </template>
        </section>
    </section>
</template>

<script>
    import Call from '@/components/dashboard/voip/Call.vue';

    export default {
        name: 'CallQueue',

        components: {
            Call
        },

        data() {
            return {
                openQueue: false,
                calls: [
                    {
                        number: 532039772,
                        status: '3'
                    }, {
                        number: 270289287,
                        status: '2'
                    }, {
                        number: 670699013,
                        status: '1'
                    }, {
                        number: 796346938,
                        status: '1'
                    }, {
                        number: 167417825,
                        status: '1'
                    },
                ],
            };
        },
    };
</script>

<style scoped>
    .call-queue {
        margin-top: 12px;
    }

    header {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        cursor: pointer;
    }

    header span {
        display: inline-block;
        margin-left: 8px;
        font-weight: bold;
    }

    header .empty {
        color: var(--black-secondary);
    }

    header span:not(.empty) {
        color: var(--primary);
    }

    .show-queue {
        text-transform: uppercase;
        font-weight: bold;
        color: var(--primary);
    }

    .calls {
        background-color: var(--white-primary);
        margin-top: 0;
        padding: 0 8px;
        max-height: 0;
        overflow: auto;
        border-radius: 4px;
        transition: all var(--transition);
    }

    .expanded {
        margin-top: 12px;
        padding-top: 8px;
        padding-bottom: 8px;
        max-height: 160px;
    }

    .calls .empty {
        margin: 8px 0;
        text-align: center;
        font-size: 12px;
        color: var(--black-disabled);
    }
</style>
