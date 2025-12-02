import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';

export const decorators = [
  (Story: any) => (
    <SafeAreaProvider>
      <PaperProvider>
        <View style={styles.container}>
          <Story />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  ),
];

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

