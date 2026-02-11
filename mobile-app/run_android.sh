#!/bin/bash
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "Using Java from: $JAVA_HOME"
java -version

echo "Check for connected devices..."
if ! "$ANDROID_HOME/platform-tools/adb" devices | grep -q "\<device\>"; then
  echo "No device found. Starting emulator 'Medium_Phone_API_36.1'..."
  "$ANDROID_HOME/emulator/emulator" @Medium_Phone_API_36.1 -no-snapshot-load &
  
  echo "Waiting for emulator to boot..."
  "$ANDROID_HOME/platform-tools/adb" wait-for-device
  echo "Emulator connected!"
fi

echo "Starting Expo Android Build..."
cd "$(dirname "$0")"
npx expo run:android
