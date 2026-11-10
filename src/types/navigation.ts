export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  OTP?: {
    email: string;
    displayName?: string;
  };
  S14?: {
    email: string;
    displayName?: string;
  };
  S12: undefined;
  MainTabs: undefined;
  Camera: undefined;
  ReelDetail: {
    videoId: string;
  };
  AddFilter: {
    videoUri: string;
  };
  AddAudio: {
    videoUri?: string;
  };
  PostVideo: {
    videoUri: string;
    audioUri?: string;
    filterApplied?: string;
  };
  VideoList?: {
    title: string;
    type?: string;
    topicId?: string;
  };
  AudioList: undefined;
  UserProfile: {
    userId: string;
  };
  EditProfile: undefined;
  S15: undefined;
  Settings: undefined;
  S16: undefined;
  ChangePassword: undefined;
  S17: undefined;
  Drafts: undefined;
  S21: undefined;
  DraftViewer?: {
    draftId?: string;
  };
};

export type BottomTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CreateTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
  FriendsTab?: undefined;
};
