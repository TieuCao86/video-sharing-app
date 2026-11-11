import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

const RECORDINGS_DIRECTORY = 'recordings';

function recordingsDirectory() {
  const directory = new Directory(Paths.document, RECORDINGS_DIRECTORY);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

function isWithin(uri: string, directoryUri: string) {
  const prefix = directoryUri.endsWith('/') ? directoryUri : `${directoryUri}/`;
  return uri === directoryUri || uri.startsWith(prefix);
}

/** Copy temporary camera or picker files to app documents so drafts survive cache cleanup. */
export async function persistRecording(sourceUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return sourceUri;
  }

  const source = new File(sourceUri);
  if (!source.exists) {
    throw new Error('The selected video file is missing.');
  }

  const directory = recordingsDirectory();
  if (isWithin(source.uri, directory.uri)) {
    return source.uri;
  }

  const extension = source.name.match(/\.([a-zA-Z0-9]{1,8})$/)?.[1] ?? 'mp4';
  const filename = `recording-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const destination = new File(directory, filename);
  await source.copy(destination);
  return destination.uri;
}

/** Remove temporary recorder files and app-owned recordings, but never arbitrary user files. */
export function deleteRecording(uri: string) {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const managedDirectory = new Directory(Paths.document, RECORDINGS_DIRECTORY);
    if (!isWithin(uri, Paths.cache.uri) && !isWithin(uri, managedDirectory.uri)) {
      return;
    }

    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('Failed to delete recording:', error);
  }
}
