import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const decorators = [
  (Story: any) => (
    <SafeAreaProvider>
      <PaperProvider>
        <Story />
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

