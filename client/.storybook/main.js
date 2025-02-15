/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
   stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  // stories: [
  //   "../stories/**/*.stories.@(js|jsx|ts|tsx)", // Asegura que esta ruta incluya la carpeta "ui"
  // ],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
    "@storybook/addon-postcss"
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  }
}
export default config
