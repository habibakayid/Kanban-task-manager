import Task from "../models/Task.js";
const STORAGE_KEY = "kanbanTasks";
export default class TaskStore {
    constructor() {
        this.tasks = this.load();
    }
    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw)
                return [];
            const parsed = JSON.parse(raw);
            return parsed.map((data) => Task.fromData(data));
        }
        catch (err) {
            console.error("Failed to load tasks from localStorage:", err);
            return [];
        }
    }
    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
    }
    getAll() {
        return [...this.tasks];
    }
    getByStatus(status) {
        return this.tasks.filter((task) => task.status === status);
    }
    findById(id) {
        return this.tasks.find((task) => task.id === id);
    }
    add(title, description, priority, status = "todo") {
        const task = new Task(title, description, priority, status);
        this.tasks.push(task);
        this.save();
        return task;
    }
    update(id, updates) {
        const task = this.findById(id);
        if (!task)
            return null;
        Object.assign(task, updates);
        this.save();
        return task;
    }
    moveTask(id, newStatus) {
        return this.update(id, { status: newStatus });
    }
    delete(id) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter((task) => task.id !== id);
        if (this.tasks.length < initialLength) {
            this.save();
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=TaskStore.js.map