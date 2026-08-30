export default class Task {
    constructor(title, description, priority, status = "todo", id, createdAt) {
        this.id = id !== null && id !== void 0 ? id : Task.generateId();
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.status = status;
        this.createdAt = createdAt !== null && createdAt !== void 0 ? createdAt : new Date().toISOString();
    }
    static generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    static fromData(data) {
        return new Task(data.title, data.description, data.priority, data.status, data.id, data.createdAt);
    }
}
//# sourceMappingURL=Task.js.map