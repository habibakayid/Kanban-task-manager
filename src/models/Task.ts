export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskData {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
}

export default class Task implements TaskData {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;

  constructor(
    title: string,
    description: string,
    priority: TaskPriority,
    dueDate: string | null = null,
    status: TaskStatus = "todo",
    id?: string,
    createdAt?: string
  ) {
    this.id = id ?? Task.generateId();
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.dueDate = dueDate;
    this.status = status;
    this.createdAt = createdAt ?? new Date().toISOString();
  }

  static generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

 
  static fromData(data: TaskData): Task {
    return new Task(
      data.title,
      data.description,
      data.priority,
      data.dueDate,
      data.status,
      data.id,
      data.createdAt
    );
  }
}