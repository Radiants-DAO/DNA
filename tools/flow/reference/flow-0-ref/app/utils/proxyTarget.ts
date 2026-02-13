import { invoke } from "@tauri-apps/api/core";

export async function writeProxyTarget(port: number): Promise<void> {
  try {
    await invoke("write_proxy_target", {
      config: JSON.stringify({ port, timestamp: Date.now() }),
    });
    console.log(`[proxyTarget] Set proxy target to port ${port}`);
  } catch (err) {
    console.error("[proxyTarget] Failed to write proxy config:", err);
  }
}

export async function clearProxyTarget(): Promise<void> {
  try {
    await invoke("clear_proxy_target");
  } catch (err) {
    console.error("[proxyTarget] Failed to clear proxy config:", err);
  }
}
