import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import type { Category, SubStep, Task } from "../types/task";

// Falls back to a shared local id when signed out, so dev/testing doesn't
// require logging in every time. Still no backend — signed-in tasks live
// only in memory, tagged with the real user id for whenever persistence
// lands.
const LOCAL_USER_ID = "local-user";
const currentUserId = () => useAuthStore.getState().user?.id ?? LOCAL_USER_ID;

export interface NewTaskInput {
  title: string;
  category: Category;
  priority: Task["priority"];
  load: number;
  dueAt?: string;
}

export interface CalendarImportInput {
  title: string;
  category: Category;
  priority: Task["priority"];
  load: number;
  dueAt?: string;
  externalId: string;
}

interface TaskStore {
  tasks: Task[];
  isTaskModalOpen: boolean;
  activeCategory: Category | null;
  openTaskModal: (category: Category) => void;
  closeTaskModal: () => void;
  addTask: (input: NewTaskInput) => void;
  removeTask: (id: string) => void;
  clearTasks: () => void;
  /** Adds calendar events as tasks, skipping any whose externalId already
   * exists (re-sync dedupe). Returns the number of tasks actually added. */
  importCalendarTasks: (events: CalendarImportInput[]) => number;
  setTaskSubSteps: (taskId: string, subSteps: SubStep[]) => void;
  toggleSubStepDone: (taskId: string, subStepId: string) => void;
  /** Increments deferCount and optionally moves dueAt out to deferUntil.
   * Status stays "active" — deferring isn't completing or abandoning it. */
  deferTask: (taskId: string, deferUntil?: string) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isTaskModalOpen: false,
  activeCategory: null,

  openTaskModal: (category) =>
    set({ isTaskModalOpen: true, activeCategory: category }),
  closeTaskModal: () => set({ isTaskModalOpen: false, activeCategory: null }),

  addTask: (input) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          id: crypto.randomUUID(),
          userId: currentUserId(),
          title: input.title,
          category: input.category,
          priority: input.priority,
          load: input.load,
          status: "active",
          deferCount: 0,
          source: "manual",
          createdAt: new Date().toISOString(),
          dueAt: input.dueAt,
        },
      ],
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),

  clearTasks: () => set({ tasks: [] }),

  importCalendarTasks: (events) => {
    const existingExternalIds = new Set(
      get()
        .tasks.filter((task) => task.externalId)
        .map((task) => task.externalId),
    );

    const newTasks: Task[] = events
      .filter((event) => !existingExternalIds.has(event.externalId))
      .map((event) => ({
        id: crypto.randomUUID(),
        userId: currentUserId(),
        title: event.title,
        category: event.category,
        priority: event.priority,
        load: event.load,
        status: "active",
        deferCount: 0,
        source: "calendar_sync",
        createdAt: new Date().toISOString(),
        dueAt: event.dueAt,
        externalId: event.externalId,
      }));

    if (newTasks.length > 0) {
      set((state) => ({ tasks: [...state.tasks, ...newTasks] }));
    }

    return newTasks.length;
  },

  setTaskSubSteps: (taskId, subSteps) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, subSteps } : task,
      ),
    })),

  toggleSubStepDone: (taskId, subStepId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subSteps: task.subSteps?.map((step) =>
                step.id === subStepId ? { ...step, done: !step.done } : step,
              ),
            }
          : task,
      ),
    })),

  deferTask: (taskId, deferUntil) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              deferCount: task.deferCount + 1,
              dueAt: deferUntil ?? task.dueAt,
            }
          : task,
      ),
    })),
}));
