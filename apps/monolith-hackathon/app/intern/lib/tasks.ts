// app/intern/lib/tasks.ts
import type { Task } from '../types/typefully';

/**
 * Parse tasks from Typefully scratchpad_text
 * Format: "[ ] Task text @assignee" or "[x] Completed task @assignee"
 */
export function parseTasks(scratchpadText: string | null): Task[] {
  if (!scratchpadText) return [];

  const lines = scratchpadText.split('\n');
  const tasks: Task[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Match checkbox pattern: [ ] or [x] or [X]
    const match = trimmed.match(/^\[([ xX])\]\s*(.+)$/);
    if (!match) continue;

    const completed = match[1].toLowerCase() === 'x';
    const content = match[2];

    // Extract @mention for assignee
    const assigneeMatch = content.match(/@(\w+)/);
    const assignee = assigneeMatch ? assigneeMatch[1].toLowerCase() : null;

    // Remove @mention from text for cleaner display
    const text = content.replace(/@\w+/g, '').trim();

    tasks.push({
      id: `task-${tasks.length}`,
      text,
      assignee,
      completed,
    });
  }

  return tasks;
}

/**
 * Serialize tasks back to scratchpad_text format
 */
export function serializeTasks(tasks: Task[]): string {
  return tasks
    .map((task) => {
      const checkbox = task.completed ? '[x]' : '[ ]';
      const assignee = task.assignee ? ` @${task.assignee}` : '';
      return `${checkbox} ${task.text}${assignee}`;
    })
    .join('\n');
}

/**
 * Toggle a task's completion status
 */
export function toggleTask(scratchpadText: string | null, taskIndex: number): string {
  const tasks = parseTasks(scratchpadText);
  if (taskIndex >= 0 && taskIndex < tasks.length) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
  }
  return serializeTasks(tasks);
}

/**
 * Add a new task to the scratchpad
 */
export function addTask(
  scratchpadText: string | null,
  text: string,
  assignee?: string
): string {
  const existing = scratchpadText?.trim() || '';
  const newTask = `[ ] ${text}${assignee ? ` @${assignee}` : ''}`;
  return existing ? `${existing}\n${newTask}` : newTask;
}
