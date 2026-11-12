export const deleted: string[] = [];
export async function persistRecording(uri: string) { return uri; }
export function deleteRecording(uri: string) { deleted.push(uri); }
