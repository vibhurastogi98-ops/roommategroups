import { Capacitor } from '@capacitor/core';

export function isPlatform(name) {
  return Capacitor.getPlatform() === name;
}

export function isIOS() {
  return Capacitor.getPlatform() === 'ios';
}

export function isAndroid() {
  return Capacitor.getPlatform() === 'android';
}

export function isWeb() {
  return !Capacitor.isNativePlatform();
}

export const platformInfo = {
  platform: Capacitor.getPlatform(),
  isNative: Capacitor.isNativePlatform(),
  isIOS: Capacitor.getPlatform() === 'ios',
  isAndroid: Capacitor.getPlatform() === 'android',
};

console.log('[MOBILE] Platform detected:', platformInfo);
