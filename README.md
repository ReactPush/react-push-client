# ReactPush Client

React Native client library for ReactPush update system. This library allows React Native apps to check for and download remote bundle updates.

## Installation

```bash
npm install react-push-client
# or
yarn add react-push-client
```

### iOS Setup

Add to `ios/Podfile`:
```ruby
pod 'RNFS', :path => '../node_modules/react-native-fs'
```

Then run:
```bash
cd ios && pod install
```

### Android Setup

Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation project(':react-native-fs')
}
```

## Usage

### Basic Setup

```javascript
import ReactPush from 'react-push-client';

const reactPush = new ReactPush({
  apiKey: 'YOUR_APP_API_KEY',
  apiUrl: 'https://your-api-url.com',
  appVersion: '1.0.0', // Required: Your app version
  userId: 'optional-user-id', // Optional
  onUpdateAvailable: (update) => {
    console.log('Update available:', update);
  },
  onUpdateDownloaded: (update) => {
    console.log('Update downloaded:', update);
  },
  onError: (error) => {
    console.error('ReactPush error:', error);
  },
});

// Check for updates
reactPush.checkForUpdate();

// Or sync automatically
reactPush.sync({
  checkFrequency: 'ON_APP_START',
  installMode: 'ON_NEXT_RESTART',
});
```

### API

#### `checkForUpdate()`
Checks for available updates from the server.

#### `downloadUpdate(update)`
Downloads the update bundle and assets.

#### `sync(options)`
Automatically checks for updates and downloads them based on the provided options.

Options:
- `checkFrequency`: 'ON_APP_START' | 'ON_APP_RESUME' | 'MANUAL'
- `installMode`: 'IMMEDIATE' | 'ON_NEXT_RESTART' | 'ON_NEXT_RESUME'

#### `getDownloadedBundleURL()`
Returns the local file path of the downloaded bundle, or `null` if no bundle is downloaded. This can be used by native code to load the bundle.

```javascript
const bundlePath = await reactPush.getDownloadedBundleURL();
if (bundlePath) {
  console.log('Downloaded bundle path:', bundlePath);
}
```

#### `getBundleManager()`
Returns the bundle manager instance for advanced usage.

## Native Implementation

ReactPush provides native classes that can be called directly from iOS and Android code:

### iOS
```objc
#import "ReactPush.h"

NSURL *bundleURL = [ReactPush getJsBundleURL:@"main" withExtension:@"jsbundle"];
```

### Android
```kotlin
import com.reactpush.ReactPush

val bundlePath = ReactPush.getJsBundlePath(context, "index.android.bundle")
```

**See [NATIVE_API.md](./NATIVE_API.md) for complete native API documentation.**

For manual implementation without the native classes, see [NATIVE_IMPLEMENTATION.md](./NATIVE_IMPLEMENTATION.md).

## Installation

See [INSTALLATION.md](./INSTALLATION.md) for detailed setup instructions.

## License

MIT

