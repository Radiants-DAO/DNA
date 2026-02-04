// app/intern/components/TaskList.tsx
'use client';

import type { Task } from '../types/typefully';
import { ASSIGNEE_COLORS } from '../types/typefully';

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskIndex: number) => void;
  disabled?: boolean;
}

export function TaskList({ tasks, onToggle, disabled = false }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="intern-tasks-empty">No tasks</p>;
  }

  return (
    <ul className="intern-tasks-list">
      {tasks.map((task, index) => (
        <li key={task.id} className="intern-task-item">
          <label className="intern-task-label">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggle(index)}
              disabled={disabled}
              className="intern-task-checkbox"
            />
            <span
              className={`intern-task-text ${task.completed ? 'intern-task-text--done' : ''}`}
            >
              {task.text}
            </span>
            {task.assignee && (
              <span
                className="intern-task-assignee"
                style={{
                  backgroundColor: ASSIGNEE_COLORS[task.assignee] || '#666',
                }}
              >
                @{task.assignee}
              </span>
            )}
          </label>
        </li>
      ))}
    </ul>
  );
}
