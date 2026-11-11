import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RecordingTimer } from '../../components/RecordingTimer';
import { FilterBottomSheet, Filter } from '../../components/FilterBottomSheet';
import { FilterOverlay } from '../../components/FilterOverlay';
import { TimerBottomSheet, TimerOption } from '../../components/TimerBottomSheet';
import { AudioBottomSheet, AudioTrack } from '../../components/AudioBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteRecording, persistRecording } from '../../utils/persistRecording';

const MAX_DURATION_SECONDS = 180;
const MAX_FILE_BYTES = 100 * 1024 * 1024;

export default function CameraScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const mountedRef = useRef(true);
  const discardRef = useRef(false);
  const recordingLockRef = useRef(false);
  const recordedSecondsRef = useRef(0);
  const stopRequestedRef = useRef(false);
  const selectedAudioIdRef = useRef<string | undefined>(undefined);
  const selectedAudioTitleRef = useRef<string | undefined>(undefined);

  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [torch, setTorch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [showTimerSheet, setShowTimerSheet] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState<TimerOption>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showAudioSheet, setShowAudioSheet] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setCameraReady(false);
        setCountdown(null);
      };
    }, [])
  );

  useEffect(() => {
    selectedAudioIdRef.current = selectedAudio?.id;
    selectedAudioTitleRef.current = selectedAudio?.title;
  }, [selectedAudio]);

  const askedPermissionsRef = useRef(false);

  useEffect(() => {
    if (askedPermissionsRef.current) return;
    askedPermissionsRef.current = true;
    (async () => {
      await requestPermission();
      await requestMicPermission();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaStatus !== 'granted') {
        Alert.alert('Permission needed', 'Media library permission is required to upload a video');
      }
    })();
  }, [requestMicPermission, requestPermission]);

  const startRecordingRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (countdown === null) return;

    const timer = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        void startRecordingRef.current();
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const needsCamera = !permission?.granted;
  const needsMic = !micPermission?.granted;

  const controlsLocked = isRecording || isStopping || countdown !== null;

  const toggleCameraFacing = () => {
    if (controlsLocked) return;
    setCameraReady(false);
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    if (controlsLocked) return;
    const newTorch = !torch;
    setTorch(newTorch);
    setFlash(newTorch ? 'on' : 'off');
  };

  const startRecording = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Record on a phone', 'Video recording needs the iOS or Android app.');
      return;
    }

    if (!cameraRef.current || !cameraReady || recordingLockRef.current) {
      if (!cameraReady && mountedRef.current) {
        Alert.alert('Camera not ready', 'Wait for the preview, then try again.');
      }
      return;
    }

    recordingLockRef.current = true;
    discardRef.current = false;
    stopRequestedRef.current = false;
    recordedSecondsRef.current = 0;
    setRecordedSeconds(0);
    setIsRecording(true);

    const startedAt = Date.now();
    const tick = setInterval(() => {
      const seconds = Math.min(
        MAX_DURATION_SECONDS,
        Math.floor((Date.now() - startedAt) / 1000)
      );
      if (seconds <= recordedSecondsRef.current) return;
      recordedSecondsRef.current = seconds;
      if (mountedRef.current) setRecordedSeconds(seconds);
    }, 250);
    let temporaryVideoUri: string | null = null;
    let savedVideoUri: string | null = null;

    try {
      const recording = cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION_SECONDS,
        maxFileSize: MAX_FILE_BYTES,
        progressUpdateInterval: 0.25,
      });

      // stopRecording is a no-op until the native recorder has started.
      await new Promise((resolve) => setTimeout(resolve, 200));
      if ((stopRequestedRef.current || discardRef.current) && cameraRef.current) {
        cameraRef.current.stopRecording();
      }

      const video = await recording;
      temporaryVideoUri = video?.uri ?? null;

      if (!video?.uri || discardRef.current || !mountedRef.current) {
        if (temporaryVideoUri) deleteRecording(temporaryVideoUri);
        temporaryVideoUri = null;
        if (mountedRef.current && !discardRef.current && !video?.uri) {
          Alert.alert('Recording too short', 'Let it record for a moment, then tap stop again.');
        }
        return;
      }

      const elapsed = Math.max(
        recordedSecondsRef.current,
        Math.round((Date.now() - startedAt) / 1000)
      );
      recordedSecondsRef.current = Math.min(MAX_DURATION_SECONDS, elapsed);

      savedVideoUri = await persistRecording(video.uri);
      if (savedVideoUri !== temporaryVideoUri && temporaryVideoUri) {
        deleteRecording(temporaryVideoUri);
      }
      temporaryVideoUri = null;

      if (!mountedRef.current || discardRef.current) {
        deleteRecording(savedVideoUri);
        savedVideoUri = null;
        return;
      }

      navigation.navigate('RecordPreview', {
        videoUri: savedVideoUri,
        durationSeconds: recordedSecondsRef.current,
        audioTrackId: selectedAudioIdRef.current,
        audioTitle: selectedAudioTitleRef.current,
      });
      savedVideoUri = null;
    } catch (error) {
      console.error('Recording error:', error);
      if (temporaryVideoUri) deleteRecording(temporaryVideoUri);
      if (savedVideoUri) deleteRecording(savedVideoUri);
      if (mountedRef.current && !discardRef.current) {
        Alert.alert('Recording failed', 'Could not record video. Try again on a device with a camera.');
      }
    } finally {
      clearInterval(tick);
      recordingLockRef.current = false;
      stopRequestedRef.current = false;
      if (mountedRef.current) {
        setIsRecording(false);
        setIsStopping(false);
      }
    }
  }, [cameraReady, navigation]);

  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  const handleRecord = () => {
    if (!cameraRef.current || isStopping) return;

    if (countdown !== null) {
      setCountdown(null);
      return;
    }

    if (isRecording) {
      stopRequestedRef.current = true;
      setIsStopping(true);
      cameraRef.current.stopRecording();
      return;
    }

    if (!cameraReady) {
      Alert.alert('Camera not ready', 'Wait for the preview, then try again.');
      return;
    }

    if (selectedTimer && selectedTimer > 0) {
      setCountdown(selectedTimer);
      return;
    }

    void startRecording();
  };

  const handleUpload = async () => {
    if (controlsLocked) return;

    let savedVideoUri: string | null = null;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: MAX_DURATION_SECONDS,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_FILE_BYTES) {
        Alert.alert('Video too large', 'Choose a video under 100 MB.');
        return;
      }

      const durationSeconds = Math.round((asset.duration ?? 0) / 1000);
      if (durationSeconds > MAX_DURATION_SECONDS) {
        Alert.alert('Video too long', 'Choose a video up to 3 minutes.');
        return;
      }

      savedVideoUri = await persistRecording(asset.uri);
      navigation.navigate('RecordPreview', {
        videoUri: savedVideoUri,
        durationSeconds,
        audioTrackId: selectedAudioIdRef.current,
        audioTitle: selectedAudioTitleRef.current,
      });
      savedVideoUri = null;
    } catch (error) {
      if (savedVideoUri) deleteRecording(savedVideoUri);
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const handleAddAudio = () => {
    if (controlsLocked) return;
    setShowAudioSheet(true);
  };

  const handleFilter = () => {
    if (controlsLocked) return;
    setShowFilterSheet(true);
  };

  const handleTimer = () => {
    if (controlsLocked) return;
    setShowTimerSheet(true);
  };

  const handleEffect = () => {
    if (controlsLocked) return;
    Alert.alert('Effect', 'Effects are preview-only and are not saved into the video file.');
  };

  const handleClose = () => {
    if (isRecording) {
      Alert.alert('Discard recording?', 'This video will not be saved.', [
        { text: 'Keep recording', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardRef.current = true;
            stopRequestedRef.current = true;
            cameraRef.current?.stopRecording();
            navigation.goBack();
          },
        },
      ]);
      return;
    }

    setCountdown(null);
    navigation.goBack();
  };

  if (!permission || !micPermission) {
    return <View style={styles.container} />;
  }

  if (needsCamera || needsMic) {
    return (
      <View style={[styles.container, styles.permissionContent]}>
        <Text style={styles.permissionText}>
          Camera and microphone access are required to record video.
        </Text>
        {needsCamera && (
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Allow camera</Text>
          </TouchableOpacity>
        )}
        {needsMic && (
          <TouchableOpacity style={styles.permissionButton} onPress={requestMicPermission}>
            <Text style={styles.permissionButtonText}>Allow microphone</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Camera View */}
      {isFocused ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="video"
          videoQuality="720p"
          flash={flash}
          enableTorch={torch}
          onCameraReady={() => setCameraReady(true)}
          onMountError={() => setCameraReady(false)}
          onRecordingProgress={(event) => {
            const seconds = Math.min(MAX_DURATION_SECONDS, Math.floor(event.duration));
            if (seconds < recordedSecondsRef.current) return;
            recordedSecondsRef.current = seconds;
            setRecordedSeconds(seconds);
          }}
        />
      ) : null}

      {/* Filter Overlay - Apply filter effect on top of camera */}
      <FilterOverlay filter={selectedFilter} />

      {/* Countdown Display */}
      {countdown !== null && countdown > 0 && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Top Bar - Outside CameraView */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 24) }]}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Recording Timer - shows when recording */}
        <RecordingTimer isRecording={isRecording} durationSeconds={recordedSeconds} />

        {/* Add Audio Button - hide when recording */}
        {!isRecording && (
          <View style={styles.addAudioContainer}>
            <TouchableOpacity style={styles.addAudioButton} onPress={handleAddAudio}>
              <Ionicons name="musical-notes" size={18} color="black" />
              <Text style={styles.addAudioText} numberOfLines={1}>
                {selectedAudio ? selectedAudio.title : 'Add audio'}
              </Text>
            </TouchableOpacity>
            {selectedAudio && (
              <TouchableOpacity 
                style={styles.removeAudioButton}
                onPress={() => setSelectedAudio(null)}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Right Side Menu - Outside CameraView */}
      <View style={[styles.rightMenu, controlsLocked && styles.controlsLocked]} pointerEvents={controlsLocked ? 'none' : 'auto'}>
        {/* Flip Camera */}
        <TouchableOpacity style={styles.menuButton} onPress={toggleCameraFacing}>
          <MaterialCommunityIcons name="camera-flip" size={28} color="white" />
          <Text style={styles.menuText}>Flip</Text>
        </TouchableOpacity>

        {/* Filter */}
        <TouchableOpacity style={styles.menuButton} onPress={handleFilter}>
          <View style={[styles.iconWrapper, selectedFilter && styles.iconWrapperActive]}>
            <MaterialCommunityIcons 
              name="tune-vertical" 
              size={28} 
              color={selectedFilter ? '#FF2D55' : 'white'} 
            />
          </View>
          <Text style={[styles.menuText, selectedFilter && styles.menuTextActive]}>
            {selectedFilter ? selectedFilter.name : 'Filter'}
          </Text>
        </TouchableOpacity>

        {/* Timer */}
        <TouchableOpacity style={styles.menuButton} onPress={handleTimer}>
          <View style={[styles.iconWrapper, selectedTimer && styles.iconWrapperActive]}>
            <MaterialIcons 
              name="timer" 
              size={28} 
              color={selectedTimer ? '#FF2D55' : 'white'} 
            />
          </View>
          <Text style={[styles.menuText, selectedTimer && styles.menuTextActive]}>
            {selectedTimer ? `${selectedTimer}s` : 'Timer'}
          </Text>
        </TouchableOpacity>

        {/* Flash */}
        <TouchableOpacity style={styles.menuButton} onPress={toggleFlash}>
          <View style={[styles.iconWrapper, torch && styles.iconWrapperActive]}>
            <Ionicons 
              name={torch ? 'flash' : 'flash-off'} 
              size={28} 
              color={torch ? '#FFD700' : 'white'} 
            />
          </View>
          <Text style={[styles.menuText, torch && styles.menuTextActive]}>
            {torch ? 'On' : 'Off'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls - Outside CameraView */}
      <View style={[styles.bottomControls, { bottom: Math.max(insets.bottom, 24) }]}>
        {/* Effect Button */}
        <TouchableOpacity style={[styles.effectButton, controlsLocked && styles.controlsLocked]} onPress={handleEffect} disabled={controlsLocked}>
          <MaterialCommunityIcons name="emoticon-happy-outline" size={28} color="white" />
          <Text style={styles.bottomButtonText}>Effect</Text>
        </TouchableOpacity>

        {/* Record Button */}
        <TouchableOpacity 
          style={[styles.recordButton, isRecording && styles.recordButtonActive]} 
          onPress={handleRecord}
        >
          <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]} />
        </TouchableOpacity>

        {/* Upload Button */}
        <TouchableOpacity style={[styles.uploadButton, controlsLocked && styles.controlsLocked]} onPress={handleUpload} disabled={controlsLocked}>
          <MaterialIcons name="photo-library" size={28} color="white" />
          <Text style={styles.bottomButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        onSelectFilter={setSelectedFilter}
        selectedFilter={selectedFilter}
      />

      {/* Timer Bottom Sheet */}
      <TimerBottomSheet
        visible={showTimerSheet}
        onClose={() => setShowTimerSheet(false)}
        onSelectTimer={setSelectedTimer}
        selectedTimer={selectedTimer}
      />

      {/* Audio Bottom Sheet */}
      <AudioBottomSheet
        visible={showAudioSheet}
        onClose={() => setShowAudioSheet(false)}
        onSelectAudio={setSelectedAudio}
        selectedAudio={selectedAudio}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  controlsLocked: {
    opacity: 0.35,
  },
  permissionButton: {
    backgroundColor: '#FF3B5C',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  addAudioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    maxWidth: 180,
  },
  addAudioText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  removeAudioButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
  },

  // Right Menu
  rightMenu: {
    position: 'absolute',
    right: 16,
    top: '35%',
    gap: 24,
    zIndex: 10,
  },
  menuButton: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
    minWidth: 60,
  },
  menuText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  menuTextActive: {
    color: '#FFD700',
    fontWeight: '600',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },

  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  effectButton: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  uploadButton: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  bottomButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Record Button
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(255, 59, 92, 0.3)',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B5C',
  },
  recordButtonInnerActive: {
    borderRadius: 8,
    width: 40,
    height: 40,
  },

  // Countdown
  countdownContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -75 }],
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '700',
    color: 'white',
  },
});
