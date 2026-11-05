import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RecordingTimer } from '../../components/RecordingTimer';
import { FilterBottomSheet, Filter } from '../../components/FilterBottomSheet';
import { FilterOverlay } from '../../components/FilterOverlay';
import { TimerBottomSheet, TimerOption } from '../../components/TimerBottomSheet';
import { AudioBottomSheet, AudioTrack } from '../../components/AudioBottomSheet';

export default function CameraScreen() {
  const navigation = useNavigation();
  const cameraRef = useRef<any>(null);
  
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [torch, setTorch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [showTimerSheet, setShowTimerSheet] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState<TimerOption>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showAudioSheet, setShowAudioSheet] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);

  useEffect(() => {
    // Request permissions on mount
    (async () => {
      await requestPermission();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaStatus !== 'granted') {
        Alert.alert('Permission needed', 'Media library permission is required');
      }
    })();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Start recording after countdown
      setCountdown(null);
      startRecording();
    }
  }, [countdown]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    const newTorch = !torch;
    setTorch(newTorch);
    setFlash(newTorch ? 'on' : 'off');
    console.log('Flash/Torch toggled:', newTorch);
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;
    
    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 180, // 180 seconds = 3 minutes max
      });
      console.log('Video recorded:', video.uri);
      // Navigate to next screen with video
      // navigation.navigate('AddFilter', { videoUri: video.uri });
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
    }
  };

  const handleRecord = async () => {
    if (!cameraRef.current) return;

    if (isRecording) {
      // Stop recording
      cameraRef.current.stopRecording();
      setIsRecording(false);
    } else {
      // Start recording with timer or immediately
      if (selectedTimer && selectedTimer > 0) {
        setCountdown(selectedTimer);
      } else {
        startRecording();
      }
    }
  };

  const handleUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 180, // 3 minutes max
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Video selected:', result.assets[0].uri);
        // Navigate to next screen with video
        // navigation.navigate('AddFilter', { videoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const handleAddAudio = () => {
    // Navigate to Add Audio screen
    setShowAudioSheet(true);
  };

  const handleFilter = () => {
    setShowFilterSheet(true);
  };

  const handleTimer = () => {
    setShowTimerSheet(true);
  };

  const handleEffect = () => {
    Alert.alert('Effect', 'Effect functionality');
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        enableTorch={torch}
      />

      {/* Filter Overlay - Apply filter effect on top of camera */}
      <FilterOverlay filter={selectedFilter} />

      {/* Countdown Display */}
      {countdown !== null && countdown > 0 && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Top Bar - Outside CameraView */}
      <View style={styles.topBar}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Recording Timer - shows when recording */}
        <RecordingTimer isRecording={isRecording} />

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
      <View style={styles.rightMenu}>
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
      <View style={styles.bottomControls}>
        {/* Effect Button */}
        <TouchableOpacity style={styles.effectButton} onPress={handleEffect}>
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
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
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
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
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
