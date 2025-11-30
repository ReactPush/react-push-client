import { Platform } from 'react-native';
import { verifyUpdateSignature, createSigningPayload } from './SignatureVerifier';

class UpdateChecker {
  constructor(reactPush) {
    this.reactPush = reactPush;
  }

  async check() {
    const response = await fetch(`${this.reactPush.apiUrl}/api/updates/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.reactPush.apiKey,
      },
      body: JSON.stringify({
        appVersion: this.reactPush.appVersion,
        platform: Platform.OS,
        deviceId: this.reactPush.deviceId,
        userId: this.reactPush.userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Update check failed: ${response.statusText}`);
    }

    const update = await response.json();

    // Verify signature if available
    if (update.hasUpdate && update.publicKey && update.signature) {
      try {
        const isValid = await verifyUpdateSignature(
          update.publicKey,
          update,
          update.signature
        );

        if (!isValid) {
          console.error('ReactPush: Update signature verification failed');
          throw new Error('Update signature verification failed. Update may be compromised.');
        }

        console.log('ReactPush: Update signature verified successfully');
      } catch (error) {
        console.error('ReactPush: Error verifying update signature:', error);
        // If verification fails, we should reject the update for security
        throw new Error(`Update signature verification failed: ${error.message}`);
      }
    } else if (update.hasUpdate && update.publicKey && !update.signature) {
      // App has public key but update is not signed - this is a security issue
      console.warn('ReactPush: App requires signed updates but update is not signed');
      throw new Error('Update is not signed. This app requires signed updates.');
    }

    return update;
  }
}

export default UpdateChecker;

