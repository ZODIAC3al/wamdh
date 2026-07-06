declare module "*.css";

declare module "expo-av" {
  export interface Audio {
    RecordingOptionsPresets: {
      HIGH_QUALITY: RecordingOptions;
    };
    Recording: {
      createAsync(options: RecordingOptions, onRecordingStatusUpdate?: any): Promise<{ recording: Recording }>;
      new (): Recording;
    };
    Sound: {
      createAsync(source: { uri: string }, options?: any): Promise<{ sound: Sound }>;
      new (): Sound;
    };
    requestPermissionsAsync: () => Promise<{ status: string }>;
    setAudioModeAsync: (mode: AudioMode) => Promise<void>;
    RecordingOptions: RecordingOptions;
    AudioMode: AudioMode;
  }
  export interface Recording {
    getURI(): string | null;
    stopAndUnloadAsync: () => Promise<void>;
  }
  export interface Sound {
    playAsync: () => Promise<void>;
    pauseAsync: () => Promise<void>;
    stopAsync: () => Promise<void>;
    unloadAsync: () => Promise<void>;
    setOnPlaybackStatusUpdate: (callback: any) => void;
  }
  export interface RecordingOptions {
    isMeteringEnabled?: boolean;
    android?: any;
    ios?: any;
    web?: any;
  }
  export interface AudioMode {
    allowsRecordingIOS?: boolean;
    playsInSilentModeIOS?: boolean;
    staysActiveInBackground?: boolean;
    shouldDuckAndroid?: boolean;
    playThroughEarpieceAndroid?: boolean;
  }
}