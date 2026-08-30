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
        this.form.reset();
        if (task) {
            this.editingTaskId = task.id;
            this.modalTitle.textContent = "Edit Task";
            this.titleInput.value = task.title;
            this.descInput.value = task.description;
            this.priorityInput.value = task.priority;
            this.statusInput.value = task.status;
        }
        else {
            this.editingTaskId = null;
            this.modalTitle.textContent = "Add New Task";
            this.statusInput.value = "todo";
        }
        this.modal.classList.add("open");
        this.titleInput.focus();
    }
    closeModal() {
        this.modal.classList.remove("open");
        this.editingTaskId = null;
    }
    handleSubmit(e) {
        e.preventDefault();
        const title = this.titleInput.value.trim();
        const description = this.descInput.value.trim();
        const priority = this.priorityInput.value;
        const status = this.statusInput.value;
        if (!title)
            return;
        if (this.editingTaskId) {
            this.store.update(this.editingTaskId, { title, description, priority, status });
        }
        else {
            this.store.add(title, description, priority, status);
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
        const card = document.createElement("div");
        card.className = "task-card";
        card.draggable = true;
        card.dataset.id = task.id;
        card.innerHTML = `
      <div class="task-card-header">
        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
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
      <div class="task-card-footer">
        <span class="task-date"><i class="fa-regular fa-clock"></i> ${this.formatDate(task.createdAt)}</span>
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
        return card;
    }
    render() {
        Object.keys(this.columns).forEach((status) => {
            const columnEl = this.columns[status];
            const tasks = this.store.getByStatus(status);
            columnEl.innerHTML = "";
            if (tasks.length === 0) {
                columnEl.innerHTML = `<p class="empty-column">No tasks yet</p>`;
            }
            else {
                tasks.forEach((task) => columnEl.appendChild(this.createTaskCard(task)));
            }
            this.counters[status].textContent = String(tasks.length);
        });
    }
    escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }
    formatDate(iso) {
        const date = new Date(iso);
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
}
document.addEventListener("DOMContentLoaded", () => {
    new KanbanApp();
});
//# sourceMappingURL=app.js.map