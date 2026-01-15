import { useState, useEffect } from "react";
import { commands, VersionInfo } from "./bindings";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [version, setVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    commands.getVersion().then(setVersion);
  }, []);

  async function greet() {
    const result = await commands.greet(name);
    setGreetMsg(result);
  }

  return (
    <main className="min-h-screen bg-background text-text p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">RadFlow</h1>
        <p className="text-text-muted mb-8">Visual Design System Editor</p>

        {version && (
          <div className="bg-surface rounded-lg p-4 mb-8">
            <h2 className="text-lg font-semibold mb-2">Version Info</h2>
            <p className="text-sm text-text-muted">
              App: v{version.version} | Tauri: v{version.tauri_version}
            </p>
          </div>
        )}

        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Test IPC</h2>
          <form
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              greet();
            }}
          >
            <input
              className="flex-1 bg-background border border-text-muted/20 rounded px-4 py-2 text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Enter a name..."
              value={name}
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark px-6 py-2 rounded font-medium transition-colors"
            >
              Greet
            </button>
          </form>
          {greetMsg && (
            <p className="mt-4 text-text-muted">{greetMsg}</p>
          )}
        </div>

        <div className="mt-8 text-center text-text-muted text-sm">
          <p>Tauri 2.0 + React 19 + TypeScript + Tailwind v4</p>
          <p className="mt-1">Type-safe IPC via tauri-specta</p>
        </div>
      </div>
    </main>
  );
}

export default App;
