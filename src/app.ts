import Task, { TaskStatus, TaskPriority } from "./models/Task.js";
import TaskStore from "./services/TaskStore.js";

class KanbanApp {
  private store: TaskStore;

  private columns: Record<TaskStatus, HTMLElement>;
  private counters: Record<TaskStatus, HTMLElement>;

  private modal: HTMLElement;
  private form: HTMLFormElement;
  private modalTitle: HTMLElement;
  private titleInput: HTMLInputElement;
  private descInput: HTMLTextAreaElement;
  private priorityInput: HTMLSelectElement;
  private statusInput: HTMLSelectElement;
  private dueDateInput: HTMLInputElement;
  private descCounter: HTMLElement;
  private submitBtn: HTMLButtonElement;

  private editingTaskId: string | null = null;
  private draggedTaskId: string | null = null;

  constructor() {
    this.store = new TaskStore();

    this.columns = {
      todo: this.getColumnBody("todo"),
      "in-progress": this.getColumnBody("in-progress"),
      done: this.getColumnBody("done"),
    };

    this.counters = {
      todo: document.querySelector('[data-count="todo"]') as HTMLElement,
      "in-progress": document.querySelector('[data-count="in-progress"]') as HTMLElement,
      done: document.querySelector('[data-count="done"]') as HTMLElement,
    };

    this.modal = document.getElementById("taskModal") as HTMLElement;
    this.form = document.getElementById("taskForm") as HTMLFormElement;
    this.modalTitle = document.getElementById("modalTitle") as HTMLElement;
    this.titleInput = document.getElementById("taskTitle") as HTMLInputElement;
    this.descInput = document.getElementById("taskDescription") as HTMLTextAreaElement;
    this.priorityInput = document.getElementById("taskPriority") as HTMLSelectElement;
    this.statusInput = document.getElementById("taskStatus") as HTMLSelectElement;
    this.dueDateInput = document.getElementById("taskDueDate") as HTMLInputElement;
    this.descCounter = document.getElementById("descCounter") as HTMLElement;
    this.submitBtn = document.getElementById("submitBtn") as HTMLButtonElement;

    this.bindEvents();
    this.render();
  }

  private getColumnBody(status: TaskStatus): HTMLElement {
    const column = document.querySelector(`[data-column="${status}"] .column-body`);
    if (!column) throw new Error(`Column body for "${status}" not found in the DOM.`);
    return column as HTMLElement;
  }

  private bindEvents(): void {
    document.getElementById("addTaskBtn")!.addEventListener("click", () => this.openModal());
    document.getElementById("closeModalBtn")!.addEventListener("click", () => this.closeModal());
    document.getElementById("cancelBtn")!.addEventListener("click", () => this.closeModal());

    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("open")) {
        this.closeModal();
      }
    });

    this.form.addEventListener("submit", (e) => this.handleSubmit(e));

    this.descInput.addEventListener("input", () => this.updateCharCounter());

    (Object.keys(this.columns) as TaskStatus[]).forEach((status) => {
      const columnEl = this.columns[status];

      columnEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        columnEl.classList.add("drag-over");
      });

      columnEl.addEventListener("dragleave", () => {
        columnEl.classList.remove("drag-over");
      });

      columnEl.addEventListener("drop", (e) => {
        e.preventDefault();
        columnEl.classList.remove("drag-over");

        if (this.draggedTaskId) {
          this.store.moveTask(this.draggedTaskId, status);
          this.draggedTaskId = null;
          this.render();
        }
      });
    });
  }

  private openModal(task?: Task): void {
    this.form.reset();

    if (task) {
      this.editingTaskId = task.id;
      this.modalTitle.textContent = "Edit Task";
      this.submitBtn.textContent = "Save Changes";
      this.titleInput.value = task.title;
      this.descInput.value = task.description;
      this.priorityInput.value = task.priority;
      this.statusInput.value = task.status;
      this.dueDateInput.value = task.dueDate ?? "";
    } else {
      this.editingTaskId = null;
      this.modalTitle.textContent = "Add New Task";
      this.submitBtn.textContent = "Add Task";
      this.statusInput.value = "todo";
    }

    this.updateCharCounter();
    this.modal.classList.add("open");
    this.titleInput.focus();
  }

  private closeModal(): void {
    this.modal.classList.remove("open");
    this.editingTaskId = null;
  }

  private updateCharCounter(): void {
    const max = 500;
    const len = this.descInput.value.length;
    this.descCounter.textContent = `${len}/${max}`;
    this.descCounter.classList.toggle("limit-near", len > max * 0.9);
  }

  private handleSubmit(e: Event): void {
    e.preventDefault();

    const title = this.titleInput.value.trim();
    const description = this.descInput.value.trim();
    const priority = this.priorityInput.value as TaskPriority;
    const status = this.statusInput.value as TaskStatus;
    const dueDate = this.dueDateInput.value || null;

    if (!title) return;

    if (this.editingTaskId) {
      this.store.update(this.editingTaskId, { title, description, priority, status, dueDate });
    } else {
      this.store.add(title, description, priority, dueDate, status);
    }

    this.closeModal();
    this.render();
  }

  private handleDelete(id: string): void {
    if (confirm("Are you sure you want to delete this task?")) {
      this.store.delete(id);
      this.render();
    }
  }

  private createTaskCard(task: Task): HTMLElement {
    const card = document.createElement("div");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.id = task.id;

    const taskNumber = this.getTaskNumber(task.id);

    card.innerHTML = `
      <div class="task-card-top">
        <span class="task-number">
          <span class="status-dot status-${task.status}"></span>
          #${taskNumber}
        </span>
        <div class="task-card-actions">
          <button type="button" class="task-action-btn edit-btn" aria-label="Edit task">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="task-action-btn delete-btn" aria-label="Delete task">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
      ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ""}

      <span class="priority-badge priority-${task.priority}">
        <span class="priority-dot"></span> ${task.priority.toUpperCase()} PRIORITY
      </span>

      <div class="task-time">
        <i class="fa-regular fa-clock"></i> ${this.formatRelativeTime(task.createdAt)}
      </div>

      ${
        task.dueDate
          ? `<div class="task-due-date${this.isOverdue(task.dueDate, task.status) ? " overdue" : ""}">
               <i class="fa-regular fa-calendar"></i> Due ${this.formatDueDate(task.dueDate)}
             </div>`
          : ""
      }

      <div class="task-card-divider"></div>

      <div class="task-quick-actions">
        ${
          task.status === "todo"
            ? `<button type="button" class="btn-quick btn-start"><i class="fa-solid fa-play"></i> Start</button>`
            : ""
        }
        ${
          task.status !== "done"
            ? `<button type="button" class="btn-quick btn-complete"><i class="fa-solid fa-check"></i> Complete</button>`
            : ""
        }
      </div>
    `;

    card.addEventListener("dragstart", () => {
      this.draggedTaskId = task.id;
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    card.querySelector(".edit-btn")!.addEventListener("click", () => this.openModal(task));
    card.querySelector(".delete-btn")!.addEventListener("click", () => this.handleDelete(task.id));

    card.querySelector(".btn-start")?.addEventListener("click", () => {
      this.store.moveTask(task.id, "in-progress");
      this.render();
    });

    card.querySelector(".btn-complete")?.addEventListener("click", () => {
      this.store.moveTask(task.id, "done");
      this.render();
    });

    return card;
  }

  private getTaskNumber(id: string): string {
    const allTasks = this.store.getAll();
    const index = allTasks.findIndex((t) => t.id === id);
    return String(index + 1).padStart(3, "0");
  }

  private render(): void {
    (Object.keys(this.columns) as TaskStatus[]).forEach((status) => {
      const columnEl = this.columns[status];
      const tasks = this.store.getByStatus(status);

      columnEl.innerHTML = "";

      if (tasks.length === 0) {
        columnEl.innerHTML = `
          <div class="empty-column">
            <i class="fa-regular fa-folder-open"></i>
            <p class="empty-title">No tasks yet</p>
            <p class="empty-hint">Click + to add one</p>
          </div>
        `;
      } else {
        tasks.forEach((task) => columnEl.appendChild(this.createTaskCard(task)));
      }

      this.counters[status].textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
    });
  }

  private escapeHtml(str: string): string {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  private formatDueDate(dateStr: string): string {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  private isOverdue(dateStr: string, status: TaskStatus): boolean {
    if (status === "done") return false;
    const due = new Date(`${dateStr}T23:59:59`);
    return due.getTime() < Date.now();
  }

  private formatRelativeTime(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new KanbanApp();
});