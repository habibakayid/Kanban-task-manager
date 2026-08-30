export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskData {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
}

export default class Task implements TaskData {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;

  constructor(
    title: string,
    description: string,
    priority: TaskPriority,
    status: TaskStatus = "todo",
    id?: string,
    createdAt?: string
  ) {
    this.id = id ?? Task.generateId();
    this.title = title;
    this.description = description;
    this.priority = priority;
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
      data.status,
      data.id,
      data.createdAt
    );
  }
}