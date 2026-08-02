import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '@context';
import { useLayoutMetrics } from '@theme/layout';

type Props = {
  children: React.ReactNode;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
  constrainWidth?: boolean;
  backgroundColor?: string;
};

const Screen: React.FC<Props> = ({
  children,
  edges = ['top', 'bottom'],
  style,
  constrainWidth = true,
  backgroundColor,
}) => {
  const { colors } = useTheme();
  const { contentMaxWidth } = useLayoutMetrics();
  const bg = backgroundColor ?? colors.background;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }, style]} edges={edges}>
      {constrainWidth && contentMaxWidth ? (
        <View style={[styles.constrain, { maxWidth: contentMaxWidth }]}>{children}</View>
      ) : (
        children
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  constrain: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});

export default Screen;
