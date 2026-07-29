import React, { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@types';
import AppLoader from '@components/loaders/AppLoader';

type Props = NativeStackScreenProps<AppStackParamList, 'VoiceOrder'>;

/** Voice entry redirects to unified New Order screen in voice mode. */
const VoiceOrderScreen: React.FC<Props> = ({ navigation, route }) => {
  useEffect(() => {
    navigation.replace('CreateOrder', {
      dealerId: route.params?.dealerId,
      mode: 'voice',
    });
  }, [navigation, route.params?.dealerId]);

  return <AppLoader message="Opening voice order..." />;
};

export default VoiceOrderScreen;
