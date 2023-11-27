<template>
    <AlertModal
        size="small"
        message-primary="Before you continue, please choose your next task to time in."
    >
        <template slot="details">
            <div class="search-bar">
                <SearchBar
                    v-model="searchTask"
                    placeholder="Search task or card title"
                />
            </div>
            <ul class="tasks">
                <template v-if="filteredTaskAssignments.length">
                    <NextTaskItem
                        v-for="taskAssignment in filteredTaskAssignments"
                        :key="`task-assignment-${taskAssignment.pk}`"
                        :task-assignment="taskAssignment"
                        :is-selected="taskAssignment.pk == selectedTaskAssignmentPk"
                        @select-task="selectedTaskAssignmentPk = $event"
                    />
                </template>
                <EmptyState
                    v-else
                    icon="clipboard-text-outline"
                    size="compact"
                    primary="No tasks"
                />
            </ul>
        </template>
        <template slot="footer">
            <div class="footer-stack">
                <Button
                    v-if="selectedTaskAssignmentPk == null"
                    class="block primary border large"
                    @click="$emit('next-task')"
                >
                    Continue with No Task
                </Button>
                <Button
                    v-else
                    class="block primary border large"
                    @click="$emit('next-task', selectedTaskAssignmentPk)"
                >
                    Continue with Selected Task
                </Button>
                <Button
                    class="block border error large"
                    @click="$emit('time-out')"
                >
                    Time Out
                </Button>
                <Button
                    class="block border large"
                    @click="$emit('cancel')"
                >
                    Cancel
                </Button>
            </div>
        </template>
    </AlertModal>
</template>

<script>
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import SearchBar from '@/components/_generics/SearchBar.vue';
    import Button from '@/components/_generics/Button.vue';
    import NextTaskItem from '@/components/dashboard/tasks/NextTaskItem.vue';
    import EmptyState from '@/components/_generics/EmptyState.vue';


    export default {
        name: 'NextTaskModal',

        components: {
            AlertModal,
            Button,
            SearchBar,
            NextTaskItem,
            EmptyState,
        },

        props: {
            taskAssignments: {
                type: Array,
                required: true
            },

            currentTask: {
                type: Object,
                required: true
            }
        },

        data() {
            return {
                searchTask: '',
                selectedTaskAssignmentPk: null,
            };
        },

        computed: {
            filteredTaskAssignments() {
                return this.taskAssignments.filter(taskAssignment => {
                    let searchKey = this.searchTask.toLowerCase();
                    let inTaskTitle = taskAssignment.task.title.toLowerCase().includes(searchKey);
                    let inCardTitle = taskAssignment.task.card_title.toLowerCase().includes(searchKey);
                    return (inTaskTitle || inCardTitle) && taskAssignment.pk != this.currentTask.pk;
                });
            },
        }
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .search-bar {
        position: sticky;
        top: 0;
        display: flex;
        align-content: center;
        border: none;
        border-top: 1px solid $quaternary;
        border-bottom: 1px solid $quaternary;
        background: $white;

        i {
            font-size: 18px;
            color: $tertiary;
            padding: 12px 0px 0px 8px;
        }

        p {
            font-size: 14px;
            color: $tertiary;
            margin-left: 12px;
        }
    }

    ::v-deep .search {
        width: 100%;
        position: sticky;
        top: 20px;

        input {
            border: none;
            height: 44px;
            position: sticky;
            top: 20px;
        }
    }

    .tasks {
        @include clear-list-formatting();
        @include scrollbar-thin();
        height: 215px;
        overflow-y: scroll;
    }
</style>
