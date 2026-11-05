export type RootStackParamList = {
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
};

export type BottomTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CreateTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};
