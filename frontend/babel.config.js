module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@assets': './src/assets',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@api': './src/api',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@context': './src/context',
          '@store': './src/store',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@config': './src/config',
          '@types': './src/types',
          '@theme': './src/theme',
          '@mock': './src/mock',
        },
      },
    ],
    // Reanimated 4 plugin is included by babel-preset-expo on SDK 54
  ],
};
