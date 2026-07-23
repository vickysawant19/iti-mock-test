export class RollbackStack {
  constructor(log) {
    this.tasks = [];
    this.log = log || console.log;
  }

  add(rollbackFn, name = 'unnamed step') {
    this.tasks.push({ fn: rollbackFn, name });
  }

  async execute() {
    this.log(`[RollbackStack] Executing ${this.tasks.length} compensation tasks in reverse order...`);
    while (this.tasks.length > 0) {
      const task = this.tasks.pop();
      try {
        this.log(`[RollbackStack] Compensating: ${task.name}`);
        await task.fn();
      } catch (err) {
        this.log(`[RollbackStack] Error in rollback step "${task.name}": ${err.message}`);
      }
    }
  }
}
