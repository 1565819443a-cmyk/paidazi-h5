import storageService from './storageService';

const KEY = 'todos';

export const todoService = {
  getAll() {
    return storageService.get(KEY, []);
  },
  add(todo) {
    const todos = this.getAll();
    todos.unshift({ ...todo, id: 'td' + Date.now(), done: false, createdAt: new Date().toISOString().slice(0, 10) });
    storageService.set(KEY, todos);
    return todos;
  },
  toggle(id) {
    const todos = this.getAll();
    const t = todos.find((t) => t.id === id);
    if (t) t.done = !t.done;
    storageService.set(KEY, todos);
    return todos;
  },
  remove(id) {
    const todos = this.getAll().filter((t) => t.id !== id);
    storageService.set(KEY, todos);
    return todos;
  },
};

export default todoService;
