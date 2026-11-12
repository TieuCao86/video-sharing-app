import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DraftViewer } from './DraftViewer';
import { useDraftsStore } from '../../store/useDraftsStore';

export const DraftViewerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { drafts } = useDraftsStore();

  const initialDraftId = route.params?.draftId || drafts[0]?.id || '';

  return (
    <DraftViewer
      initialDraftId={initialDraftId}
      onClose={() => navigation.goBack()}
    />
  );
};
