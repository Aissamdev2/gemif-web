


export function generateFolderName(): string {
  // Edge-compatible unique-ish string
  const timestamp = Date.now().toString(36);        // Base36 timestamp
  const randomPart = Math.floor(Math.random() * 1e8).toString(36); // random base36 number
  return `${timestamp}-${randomPart}`;
}