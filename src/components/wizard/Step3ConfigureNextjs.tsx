import { useState, useCallback } from "react";

interface Step3ConfigureNextjsProps {
  onComplete: () => void;
  onBack: () => void;
  confirmed: boolean;
  setConfirmed: (confirmed: boolean) => void;
}

const CONFIG_CODE = `// next.config.js
const { withRadflow } = require('@radflow/bridge');

module.exports = withRadflow({
  // your existing config
});`;

const CONFIG_CODE_ESM = `// next.config.mjs
import { withRadflow } from '@radflow/bridge';

export default withRadflow({
  // your existing config
});`;

/**
 * Step 3: Configure Next.js
 *
 * Shows the required config change for next.config.js and provides
 * copy-to-clipboard functionality.
 */
export function Step3ConfigureNextjs({
  onComplete,
  onBack,
  confirmed,
  setConfirmed,
}: Step3ConfigureNextjsProps) {
  const [copied, setCopied] = useState(false);
  const [configType, setConfigType] = useState<"cjs" | "esm">("cjs");

  const currentCode = configType === "cjs" ? CONFIG_CODE : CONFIG_CODE_ESM;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [currentCode]);

  const handleConfirmToggle = useCallback(() => {
    setConfirmed(!confirmed);
  }, [confirmed, setConfirmed]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Configure Next.js</h2>
        <p className="text-text-muted text-sm">
          Update your Next.js config to enable the RadFlow bridge
        </p>
      </div>

      {/* Config Type Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setConfigType("cjs")}
          className={`px-4 py-1.5 rounded text-sm transition-colors ${
            configType === "cjs"
              ? "bg-primary text-white"
              : "bg-surface text-text-muted hover:text-text"
          }`}
        >
          CommonJS (.js)
        </button>
        <button
          onClick={() => setConfigType("esm")}
          className={`px-4 py-1.5 rounded text-sm transition-colors ${
            configType === "esm"
              ? "bg-primary text-white"
              : "bg-surface text-text-muted hover:text-text"
          }`}
        >
          ES Modules (.mjs)
        </button>
      </div>

      {/* Code Block */}
      <div className="bg-gray-900 rounded-lg border border-white/10 overflow-hidden">
        <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs text-text-muted font-medium">
            {configType === "cjs" ? "next.config.js" : "next.config.mjs"}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <CheckIcon className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="p-4 font-mono text-sm text-text overflow-x-auto">
          <code>{currentCode}</code>
        </pre>
      </div>

      {/* Instructions */}
      <div className="bg-surface rounded-lg border border-white/10 p-4 space-y-3">
        <h3 className="font-medium text-sm">Instructions</h3>
        <ol className="text-sm text-text-muted space-y-2 list-decimal list-inside">
          <li>Open your <code className="text-primary">next.config.{configType === "cjs" ? "js" : "mjs"}</code> file</li>
          <li>Wrap your existing config with <code className="text-primary">withRadflow()</code></li>
          <li>If you're using <code className="text-primary">next.config.ts</code>, use the ESM syntax</li>
          <li>Save the file</li>
        </ol>
      </div>

      {/* Confirmation Checkbox */}
      <label className="flex items-center gap-3 cursor-pointer p-4 bg-surface rounded-lg border border-white/10 hover:bg-surface-hover transition-colors">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={handleConfirmToggle}
          className="w-4 h-4 rounded border-white/20 bg-background text-primary focus:ring-primary focus:ring-offset-0"
        />
        <span className="text-sm">I've updated my next.config.js</span>
      </label>

      {/* Help Link */}
      <div className="text-center">
        <a
          href="#"
          className="text-xs text-primary hover:text-primary-hover"
          onClick={(e) => e.preventDefault()}
        >
          Need help? View manual setup guide
        </a>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-text px-4 py-2 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={!confirmed}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function CopyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
