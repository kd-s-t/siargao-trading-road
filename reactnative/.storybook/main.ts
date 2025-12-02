import type { StorybookConfig } from '@storybook/react-native';

const config: StorybookConfig = {
  stories: ['../screens/**/*.stories.@(js|jsx|ts|tsx)', '../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
  ],
  framework: {
    name: '@storybook/react-native',
    options: {},
  },
};

export default config;

