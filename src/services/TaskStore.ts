import Task, { TaskData, TaskStatus, TaskPriority } from "../models/Task.js";

const STORAGE_KEY = "kanbanTasks";

export default class TaskStore {
  private tasks: Task[];

  constructor() {
    this.tasks = this.load();
  }

  private load(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed: TaskData[] = JSON.parse(raw);
      return parsed.map((data) => Task.fromData(data));
    } catch (err) {
      console.error("Failed to load tasks from localStorage:", err);
      return [];
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
  }

  getAll(): Task[] {
    return [...this.tasks];
  }

  getByStatus(status: TaskStatus): Task[] {
    return this.tasks.filter((task) => task.status === status);
  }

  findById(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  
  add(
    title: string,
    description: string,
    priority: TaskPriority,
    dueDate: string | null = null,
    status: TaskStatus = "todo"
  ): Task {
    const task = new Task(title, description, priority, dueDate, status);
    this.tasks.push(task);
    this.save();
    return task;
  }

  
  update(
    id: string,
    updates: Partial<Pick<Task, "title" | "description" | "priority" | "status" | "dueDate">>
  ): Task | null {
    const task = this.findById(id);
    if (!task) return null;

    Object.assign(task, updates);
    this.save();
    return task;
  }

  
  moveTask(id: string, newStatus: TaskStatus): Task | null {
    return this.update(id, { status: newStatus });
  }

  
  delete(id: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter((task) => task.id !== id);

    if (this.tasks.length < initialLength) {
      this.save();
      return true;
    }
    return false;
  }
}