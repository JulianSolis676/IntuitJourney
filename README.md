# IntuitJourney

IntuitJourney is a voice-first travel assistant for iOS and Android focused on helping blind and partially sighted users search journeys through natural speech. The current implementation centers on a fully voice-driven flow, accessibility confirmations, route validation, and a local cache fallback when live data is unavailable.

This repository is the working codebase used for the dissertation delivery. The app now runs as an Expo React Native project with local persistence, speech recognition, speech synthesis, and TfL journey lookup.

---

## What the app does now

- Greets the user by voice and guides the full journey search flow.
- Requests microphone and speech recognition permissions on start.
- Listens for origin and destination using voice only.
- Confirms captured locations before searching.
- Prevents invalid searches such as origin equal to destination.
- Reads journey results aloud and allows repeating them.
- Falls back to local cache when TfL live data is unavailable.
- Handles silence and recognition errors with guided retries.

---

## Current Architecture

- [App.tsx](App.tsx) is now the presentation layer.
- [src/features/journey/hooks/useJourneyFlow.ts](src/features/journey/hooks/useJourneyFlow.ts) contains the conversation logic.
- [src/features/journey/services/tflService.ts](src/features/journey/services/tflService.ts) handles TfL requests.
- [src/features/journey/utils.ts](src/features/journey/utils.ts) contains confirmation and formatting helpers.
- [src/services/cacheService.ts](src/services/cacheService.ts) stores journey results locally with AsyncStorage.

---

## Tech Stack

- Expo SDK 54
- React Native 0.81
- TypeScript
- expo-speech
- expo-speech-recognition
- @react-native-async-storage/async-storage
- TfL Open Data API

---

## Requirements

### For development on a Mac

- macOS
- Node.js installed
- npm installed
- Xcode installed
- Apple ID signed in on Xcode for code signing
- Expo is already included in the project through its dependencies; you do not need to create an Expo account for the local iPhone run flow

### For running on an iPhone

- iPhone with iOS
- Microphone enabled for the app
- Speech Recognition permission enabled for the app
- Developer Mode enabled on the iPhone if iOS requests it
- The iPhone connected by cable for the first native run from Xcode or `expo run:ios --device`

Important: Expo Go is not the main path for this project. For the physical iPhone workflow, use Xcode and `expo run:ios --device`.

---

## How to run locally on a Mac and iPhone

### 1. Install the prerequisites

1. Install Xcode from the Mac App Store.
2. Open Xcode once and let it finish installing additional components.
3. Sign in with your Apple ID in Xcode: Xcode > Settings > Accounts.
4. Install Node.js and npm if they are not already available.
5. You do not need to create an Expo account for this local iPhone run flow.

### 2. Install the project dependencies

```bash
npm install
```

### 3. Open the iOS project in Xcode if you need signing or device setup

1. Open [ios/IntuitJourney.xcworkspace](ios/IntuitJourney.xcworkspace).
2. In Xcode, select the `IntuitJourney` target.
3. Make sure the signing team is set to your Apple account.
4. Connect the iPhone by cable and trust the computer if the phone asks.
5. If iPhone shows the Developer Mode requirement, enable Developer Mode in Settings and restart the device.
6. Run the app once from Xcode if you need to confirm signing and native build settings.

### 4. Run from VS Code / terminal on a physical iPhone

1. Close Xcode only if you already confirmed the project opens correctly and signing is set.
2. From the project root, run:

```bash
npx expo run:ios --device
```

3. Choose the connected iPhone when prompted.
4. Wait for the native build and installation to finish.
5. Open the app on the iPhone and allow microphone and speech recognition permissions.

---

## iPhone permissions and configuration

When the app starts on iPhone, it may request:

- Microphone access
- Speech Recognition access

If permissions were denied previously, enable them manually in:

- Settings > Privacy & Security > Microphone
- Settings > Privacy & Security > Speech Recognition

If you are testing with a native development build, also confirm that:

- The device is trusted on the Mac if iOS asks for it.
- Developer Mode is enabled on the iPhone.
- The app was installed using the current signed Apple ID and Xcode configuration.

---

## Native iPhone run summary

If you want the shortest correct order, use this:

1. Install Xcode.
2. Sign in with Apple ID in Xcode.
3. Clone the repository.
4. Run `npm install`.
5. Open [ios/IntuitJourney.xcworkspace](ios/IntuitJourney.xcworkspace) if you need to check signing.
6. Connect the iPhone by cable and enable Developer Mode if needed.
7. Run `npx expo run:ios --device`.
8. Allow microphone and speech recognition permissions on the iPhone.

---

## App behavior summary

- Splash screen with logo.
- Voice greeting.
- Ask origin.
- Ask destination.
- Confirm both locations.
- Search TfL routes.
- Save successful results to local cache.
- If live API fails, recover from cache when possible.
- Read results aloud and offer repetition.
- Retry or close gracefully if no valid input is received.

---

## Notes for evaluation

- The app is designed for accessibility and voice interaction first.
- Because speech recognition is native, testing on a real iPhone is preferred over simulator-only validation.
- The app can work offline for previously searched routes thanks to local cache, but new route searches require live TfL access.

---

## Repository status

This repo currently contains:

- The working mobile app code.
- The refactored journey flow hook and services.
- Local caching with AsyncStorage.
- iOS native run and developer workflow configuration.

---

## Future improvements

- Location-aware origin suggestion.
- Frequent route shortcuts.
- Proactive notifications for route disruptions.
- Manual language and voice configuration.
- Stronger automated test coverage for the journey flow and cache service.
