const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const windowsCmakeStaging = `    // Leave room for hashed React Native codegen object names on Windows.
    externalNativeBuild {
        cmake {
            buildStagingDirectory file('../../.cxx')
        }
    }`;

module.exports = ({ config }) => {
  if (process.platform === 'win32') {
    config = withGradleProperties(config, (androidConfig) => {
      const key = 'expo.android.cmakeObjectPathMax';
      const properties = androidConfig.modResults;
      const property = properties.find((item) => item.type === 'property' && item.key === key);
      if (property) {
        if (property.value === '240') property.value = '250';
      } else {
        properties.push({ type: 'property', key, value: '250' });
      }
      return androidConfig;
    });
    config = withAppBuildGradle(config, (androidConfig) => {
      const buildGradle = androidConfig.modResults;
      if (!buildGradle.contents.includes('buildStagingDirectory')) {
        buildGradle.contents = buildGradle.contents.replace(
          /^android \{\r?$/m,
          `android {\n${windowsCmakeStaging}`,
        );
      }
      return androidConfig;
    });
  }

  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!iosClientId) return config;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ['@react-native-google-signin/google-signin', {
        iosUrlScheme: iosClientId.split('.').reverse().join('.'),
      }],
    ],
  };
};
