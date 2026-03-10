"use client";

import { useState } from "react";
import { RDNA_REVIEW_CHECKLIST, type ChecklistItem } from "../lib/review-checklist";

export function ReviewChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(
    RDNA_REVIEW_CHECKLIST.map((item) => ({ ...item })),
  );

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="border-t border-edge-primary p-3">
      <h3 className="mb-2 font-heading text-xs uppercase tracking-tight text-content-muted">
        Review Checklist ({checkedCount}/{items.length})
      </h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggle(item.id)}
                className="mt-0.5 accent-action-primary"
              />
              <span>
                <span className={`font-medium ${item.checked ? "text-content-muted line-through" : "text-content-primary"}`}>
                  {item.label}
                </span>
                <br />
                <span className="text-content-muted">{item.description}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
