module.exports = {
  project: {
    ios: {},
    android: {
      sourceDir: './android',
      packageName: 'com.reactpush',
    },
  },
  dependencies: {
    'react-push-client': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-push-client/android',
          packageImportPath: 'import com.reactpush.ReactPush;',
        },
      },
    },
  },
};

