import { create } from "zustand";
import type { Category, Task } from "../types/task";

// No auth/backend yet — placeholder until Person A's identity slice lands.
const LOCAL_USER_ID = "local-user";

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
          userId: LOCAL_USER_ID,
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
        userId: LOCAL_USER_ID,
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
}));
