"use client";

import { Suspense } from "react";
import type { ComponentType } from "react";
import { useSearchParams } from "next/navigation";

type ComponentRegistry = Record<string, ComponentType<Record<string, unknown>>>;

function ComponentRenderer({ registry }: { registry: ComponentRegistry }) {
  const params = useSearchParams();
  const name = params.get("name");

  if (!name) {
    return (
      <div style={{ padding: 24, fontFamily: "monospace" }}>
        <h2>Available components:</h2>
        <ul>
          {Object.keys(registry).map((n) => (
            <li key={n}>
              <a href={`?name=${n}`}>{n}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const Component = registry[name];
  if (!Component) {
    return <div style={{ padding: 24, color: "red" }}>Unknown component: {name}</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <Component />
    </div>
  );
}

export function PreviewPage({ registry }: { registry: ComponentRegistry }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentRenderer registry={registry} />
    </Suspense>
  );
}
