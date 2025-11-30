/**
 * Signature verification utility for React Native
 * 
 * This module provides RSA signature verification for updates.
 * 
 * Note: React Native doesn't have built-in crypto support.
 * You'll need to install a compatible crypto library:
 * 
 * For React Native:
 *   npm install react-native-crypto
 *   npm install --save-dev rn-nodeify
 * 
 * Or use expo-crypto if using Expo:
 *   expo install expo-crypto
 * 
 * For a simpler solution, you can use a web-based crypto library:
 *   npm install crypto-browserify
 */

/**
 * Creates a deterministic payload string for signature verification
 * Must match the format used by the CLI and server
 */
export function createSigningPayload(update) {
  const parts = [
    `version:${update.version || ''}`,
    `label:${update.label || ''}`,
    `platform:${update.platform || ''}`,
    `bundleUrl:${update.bundleUrl || ''}`,
    `assetsUrl:${update.assetsUrl || ''}`,
    `zipUrl:${update.zipUrl || ''}`,
    `isMandatory:${update.isMandatory || false}`,
    `description:${update.description || ''}`,
  ];
  return parts.join('|');
}

/**
 * Verifies an update signature using RSA public key
 * 
 * @param {string} publicKeyBase64 - Public key in base64 format
 * @param {object} update - Update object with all fields
 * @param {string} signatureBase64 - Signature in base64 format
 * @returns {Promise<boolean>} - True if signature is valid
 */
export async function verifyUpdateSignature(publicKeyBase64, update, signatureBase64) {
  try {
    // Try to use Node.js crypto (if available via polyfill)
    let crypto;
    
    // Check for different crypto implementations
    if (typeof require !== 'undefined') {
      try {
        // Try react-native-crypto
        crypto = require('react-native-crypto');
      } catch (e) {
        try {
          // Try crypto-browserify
          crypto = require('crypto-browserify');
        } catch (e2) {
          // Fall back to Web Crypto API if available (React Native doesn't support it fully)
          if (typeof global !== 'undefined' && global.crypto && global.crypto.subtle) {
            return await verifyWithWebCrypto(publicKeyBase64, update, signatureBase64);
          }
          
          // If no crypto library is available, log warning and return false
          console.warn(
            'ReactPush: No crypto library available for signature verification. ' +
            'Please install react-native-crypto or crypto-browserify. ' +
            'Signature verification will be disabled.'
          );
          return false;
        }
      }
    } else {
      console.warn('ReactPush: Unable to load crypto library for signature verification');
      return false;
    }

    // Create payload
    const payload = createSigningPayload(update);
    const payloadBuffer = Buffer.from(payload, 'utf8');
    const signatureBuffer = Buffer.from(signatureBase64, 'base64');
    const publicKeyBuffer = Buffer.from(publicKeyBase64, 'base64');

    // Import public key
    const publicKey = crypto.createPublicKey({
      key: publicKeyBuffer,
      format: 'der',
      type: 'pkcs1',
    });

    // Create hash
    const hash = crypto.createHash('sha256').update(payloadBuffer).digest();

    // Verify signature
    const isValid = crypto.verify(
      'sha256',
      hash,
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      signatureBuffer
    );

    return isValid;
  } catch (error) {
    console.error('ReactPush: Signature verification error:', error);
    return false;
  }
}

/**
 * Alternative verification using Web Crypto API (limited support in React Native)
 * This is a placeholder for future implementation
 */
async function verifyWithWebCrypto(publicKeyBase64, update, signatureBase64) {
  // Web Crypto API implementation would go here
  // However, React Native doesn't fully support Web Crypto API
  // This is a placeholder for future implementation
  console.warn('ReactPush: Web Crypto API not fully supported in React Native');
  return false;
}

