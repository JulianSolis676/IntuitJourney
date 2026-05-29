# IntuitJourney 🎙️

A voice-first accessibility app for London public transport, built with React Native + Expo. Users speak their origin and destination, and the app queries the **TfL (Transport for London) API** to read out the best journey options aloud.

---

## What It Does

- 🎤 Listens to voice input for origin and destination
- 🚇 Queries TfL API for live journey options
- 🔊 Reads results aloud using text-to-speech
- 💾 Falls back to local cache if TfL API is unavailable
- ♿ Designed with accessibility in mind (voice-first, no typing required)

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React Native + Expo | Mobile app framework |
| TypeScript | Language |
| expo-speech | Text-to-speech output |
| expo-speech-recognition | Voice input |
| AsyncStorage | Local caching |
| TfL Unified API | Live journey data |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [EAS CLI](https://docs.expo.dev/eas/) — `npm install -g eas-cli`
- **Xcode** (Mac only) — required to run on a physical iOS device
- **Apple Developer Account** — required to sign the app and run on device
- iPhone with iOS 15+ connected via USB

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/JulianSolis676/IntuitJourney.git
cd IntuitJourney
```

### 2. Install dependencies

```bash
npm install
```

> If you run into dependency conflicts, use the included script:
> ```bash
> bash reinstall.sh
> ```

### 3. Set up your TfL API Key (Optional)

1. Register at [https://api-portal.tfl.gov.uk/](https://api-portal.tfl.gov.uk/)
2. Create an app and copy your **Primary Key**
3. Add it in `src/features/journey/constants.ts`

---

## ⚙️ Personal Configuration Required (per developer)

> These values are **unique per person** and are not committed to the repo.

### Apple Team ID

The `appleTeamId` in `app.json` identifies your Apple Developer account. **Each developer must set their own.**

1. Go to [https://developer.apple.com/account](https://developer.apple.com/account)
2. Sign in with your Apple ID
3. Under **Membership**, copy your **Team ID** (format: `XXXXXXXXXX`)
4. Open `app.json` and replace the value:

```json
"ios": {
  "appleTeamId": "YOUR_TEAM_ID_HERE"
}
```

### Bundle Identifier

The `bundleIdentifier` should also be unique per developer. By default it is `com.juli94.IntuitJourney`. If running under your own account, change it to something like `com.yourname.IntuitJourney` in `app.json`.

---

## 🔧 Xcode Setup

Before running on a physical device:

1. **Open Xcode** and accept the license terms if it's your first time
2. Go to **Xcode → Settings → Accounts** and add your Apple ID
3. Connect your iPhone via USB
4. On your iPhone: go to **Settings → General → VPN & Device Management** and trust your Mac's certificate
5. Make sure Xcode recognises your device in the destination menu

### Install iOS pods

```bash
cd ios
pod install
cd ..
```

> If you don't have CocoaPods: `sudo gem install cocoapods`

---

## 🚀 Running on a Physical Device

> ⚠️ **Voice recognition and microphone permissions require a physical device.** Simulators do not support them.

### First time (generates the native build):

```bash
npx expo run:ios --device
```

This will:
1. Compile the native iOS code
2. Show a list of connected devices — select your iPhone
3. Install the app directly on your device

### Subsequent runs (if the build already exists):

```bash
npm start
```

Then open the app directly from your iPhone.

---

## 📱 iPhone Permissions

The app automatically requests these permissions on first use:

| Permission | When | Why |
|---|---|---|
| **Microphone** | On first open | Capture user's voice |
| **Speech Recognition** | When listening starts | Convert speech to text |

If you accidentally denied a permission:
1. Go to **Settings → IntuitJourney** on your iPhone
2. Enable **Microphone** and **Speech Recognition**

Permissions are declared in `app.json`:

```json
"infoPlist": {
  "NSMicrophoneUsageDescription": "IntuitJourney uses the microphone to recognise your voice for journey planning.",
  "NSSpeechRecognitionUsageDescription": "IntuitJourney uses speech recognition to convert your voice into journey destinations."
}
```

---

## How to Use the App

1. Open the app — a brief splash screen appears
2. The app **speaks** and asks for your starting point
3. **Say your origin** (e.g. *"King's Cross"*)
4. The app **speaks** and asks for your destination
5. **Say your destination** (e.g. *"Victoria"*)
6. The app **searches TfL** and **reads the routes aloud**
7. Tap **🔊 Repeat Route** to hear the results again

---

## Project Structure

```
IntuitJourney/
├── App.tsx                  # Root component & UI
├── index.ts                 # Entry point
├── app.json                 # Expo config (permissions, bundle ID, appleTeamId)
├── eas.json                 # EAS Build profiles
├── assets/                  # Images, icons, splash
└── src/
    ├── features/
    │   └── journey/
    │       ├── hooks/       # useJourneyFlow (main logic)
    │       ├── services/    # TfL API calls
    │       ├── constants.ts # API keys & config
    │       ├── types.ts     # TypeScript types
    │       └── utils.ts     # Formatting helpers
    └── services/
        └── cacheService.ts  # Local AsyncStorage cache
```

---

## Local Cache (Offline Support)

- API available → live data fetched and saved locally
- API fails → cached results used with a voice warning to the user
- Cache expires after **24 hours**
- Everything stays **on the device** (no cloud, privacy-first)

See [`LOCAL_CACHE_SYSTEM.md`](./LOCAL_CACHE_SYSTEM.md) for full details.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `npm install` fails | Run `bash reinstall.sh` |
| Voice not recognised | Use a physical device, not a simulator |
| No routes found | Check your TfL API key in `constants.ts` |
| App crashes on start | Delete `node_modules` and run `npm install` |
| No audio playing | Check iPhone volume and silent mode |
| Xcode doesn't see device | Trust the Mac from iPhone Settings |
| Signing error | Verify your `appleTeamId` in `app.json` |
| `pod install` fails | Run `sudo gem install cocoapods` first |
```