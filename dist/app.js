import TaskStore from "./services/TaskStore.js";
class KanbanApp {
    constructor() {
        this.editingTaskId = null;
        this.draggedTaskId = null;
        this.store = new TaskStore();
        this.columns = {
            todo: this.getColumnBody("todo"),
            "in-progress": this.getColumnBody("in-progress"),
            done: this.getColumnBody("done"),
        };
        this.counters = {
            todo: document.querySelector('[data-count="todo"]'),
            "in-progress": document.querySelector('[data-count="in-progress"]'),
            done: document.querySelector('[data-count="done"]'),
        };
        this.modal = document.getElementById("taskModal");
        this.form = document.getElementById("taskForm");
        this.modalTitle = document.getElementById("modalTitle");
        this.titleInput = document.getElementById("taskTitle");
        this.descInput = document.getElementById("taskDescription");
        this.priorityInput = document.getElementById("taskPriority");
        this.statusInput = document.getElementById("taskStatus");
        this.dueDateInput = document.getElementById("taskDueDate");
        this.descCounter = document.getElementById("descCounter");
        this.submitBtn = document.getElementById("submitBtn");
        this.bindEvents();
        this.render();
    }
    getColumnBody(status) {
        const column = document.querySelector(`[data-column="${status}"] .column-body`);
        if (!column)
            throw new Error(`Column body for "${status}" not found in the DOM.`);
        return column;
    }
    bindEvents() {
        document.getElementById("addTaskBtn").addEventListener("click", () => this.openModal());
        document.getElementById("closeModalBtn").addEventListener("click", () => this.closeModal());
        document.getElementById("cancelBtn").addEventListener("click", () => this.closeModal());
        this.modal.addEventListener("click", (e) => {
            if (e.target === this.modal)
                this.closeModal();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.modal.classList.contains("open")) {
                this.closeModal();
            }
        });
        this.form.addEventListener("submit", (e) => this.handleSubmit(e));
        this.descInput.addEventListener("input", () => this.updateCharCounter());
        Object.keys(this.columns).forEach((status) => {
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
    openModal(task) {
        var _a;
        this.form.reset();
        if (task) {
            this.editingTaskId = task.id;
            this.modalTitle.textContent = "Edit Task";
            this.submitBtn.textContent = "Save Changes";
            this.titleInput.value = task.title;
            this.descInput.value = task.description;
            this.priorityInput.value = task.priority;
            this.statusInput.value = task.status;
            this.dueDateInput.value = (_a = task.dueDate) !== null && _a !== void 0 ? _a : "";
        }
        else {
            this.editingTaskId = null;
            this.modalTitle.textContent = "Add New Task";
            this.submitBtn.textContent = "Add Task";
            this.statusInput.value = "todo";
        }
        this.updateCharCounter();
        this.modal.classList.add("open");
        this.titleInput.focus();
    }
    closeModal() {
        this.modal.classList.remove("open");
        this.editingTaskId = null;
    }
    updateCharCounter() {
        const max = 500;
        const len = this.descInput.value.length;
        this.descCounter.textContent = `${len}/${max}`;
        this.descCounter.classList.toggle("limit-near", len > max * 0.9);
    }
    handleSubmit(e) {
        e.preventDefault();
        const title = this.titleInput.value.trim();
        const description = this.descInput.value.trim();
        const priority = this.priorityInput.value;
        const status = this.statusInput.value;
        const dueDate = this.dueDateInput.value || null;
        if (!title)
            return;
        if (this.editingTaskId) {
            this.store.update(this.editingTaskId, { title, description, priority, status, dueDate });
        }
        else {
            this.store.add(title, description, priority, dueDate, status);
        }
        this.closeModal();
        this.render();
    }
    handleDelete(id) {
        if (confirm("Are you sure you want to delete this task?")) {
            this.store.delete(id);
            this.render();
        }
    }
    createTaskCard(task) {
        var _a, _b;
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

      ${task.dueDate
            ? `<div class="task-due-date${this.isOverdue(task.dueDate, task.status) ? " overdue" : ""}">
               <i class="fa-regular fa-calendar"></i> Due ${this.formatDueDate(task.dueDate)}
             </div>`
            : ""}

      <div class="task-card-divider"></div>

      <div class="task-quick-actions">
        ${task.status === "todo"
            ? `<button type="button" class="btn-quick btn-start"><i class="fa-solid fa-play"></i> Start</button>`
            : ""}
        ${task.status !== "done"
            ? `<button type="button" class="btn-quick btn-complete"><i class="fa-solid fa-check"></i> Complete</button>`
            : ""}
      </div>
    `;
        card.addEventListener("dragstart", () => {
            this.draggedTaskId = task.id;
            card.classList.add("dragging");
        });
        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
        });
        card.querySelector(".edit-btn").addEventListener("click", () => this.openModal(task));
        card.querySelector(".delete-btn").addEventListener("click", () => this.handleDelete(task.id));
        (_a = card.querySelector(".btn-start")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            this.store.moveTask(task.id, "in-progress");
            this.render();
        });
        (_b = card.querySelector(".btn-complete")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
            this.store.moveTask(task.id, "done");
            this.render();
        });
        return card;
    }
    getTaskNumber(id) {
        const allTasks = this.store.getAll();
        const index = allTasks.findIndex((t) => t.id === id);
        return String(index + 1).padStart(3, "0");
    }
    render() {
        Object.keys(this.columns).forEach((status) => {
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
            }
            else {
                tasks.forEach((task) => columnEl.appendChild(this.createTaskCard(task)));
            }
            this.counters[status].textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
        });
    }
    escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }
    formatDueDate(dateStr) {
        const date = new Date(`${dateStr}T00:00:00`);
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }
    isOverdue(dateStr, status) {
        if (status === "done")
            return false;
        const due = new Date(`${dateStr}T23:59:59`);
        return due.getTime() < Date.now();
    }
    formatRelativeTime(iso) {
        const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (seconds < 60)
            return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60)
            return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24)
            return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
}
document.addEventListener("DOMContentLoaded", () => {
    new KanbanApp();
});
//# sourceMappingURL=app.js.map