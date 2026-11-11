import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RecordingTimerProps {
  isRecording: boolean;
  /** Seconds reported by the native recorder. */
  durationSeconds: number;
}

const MAX_SECONDS = 180;

export const RecordingTimer: React.FC<RecordingTimerProps> = ({
  isRecording,
  durationSeconds,
}) => {
  if (!isRecording) return null;

  const capped = Math.min(MAX_SECONDS, Math.max(0, Math.floor(durationSeconds)));
  const mins = Math.floor(capped / 60);
  const secs = capped % 60;
  const label = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <View style={styles.recordingDot} />
      <Text style={styles.timeText}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B5C',
  },
  timeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
