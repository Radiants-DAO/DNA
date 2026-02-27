/**
 * Mock art storage — returns blob URLs for local preview.
 * TODO: Replace with Arweave/Irys upload for production.
 */
export async function uploadArt(file: File): Promise<string> {
  return URL.createObjectURL(file);
}
