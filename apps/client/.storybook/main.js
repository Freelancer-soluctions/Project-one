// /** @type { import('@storybook/react-vite').StorybookConfig } */
// const config = {
//   stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

//   addons: [
//     '@storybook/addon-essentials',
//     '@chromatic-com/storybook',
//     '@storybook/addon-interactions',
//     '@storybook/addon-links',
//     '@storybook/addon-styling-webpack',
//   ],

//   framework: {
//     name: '@storybook/react-vite',
//     options: {}
//   },
//   core: {
//     builder: "vite",
//   },

//   docs: {}
// }
// export default config

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-styling-webpack',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  core: {
    disableTelemetry: true, // Para evitar errores con Telemetry en versiones recientes
  },
  async viteFinal(config) {
    return {
      ...config,
      esbuild: {
        loader: 'jsx', // 🚀 Indica que Storybook debe procesar JSX correctamente
      },
    };
  },
  docs: {},
};

export default config;
