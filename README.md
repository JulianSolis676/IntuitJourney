# IntuitJourney

IntuitJourney is a voice-first travel assistant prototype designed to support blind and partially sighted passengers when using London’s public transport. Instead of relying on visual-first interfaces and screen-reader navigation, IntuitJourney focuses on natural voice interaction, clear spoken guidance, and simple personalisation to reduce effort and stress during travel.

This project is being developed as part of a final-year computing dissertation and is grounded in a real accessibility need. It explores whether a purpose-built, voice-first approach can improve the travel experience compared to existing tools that were originally designed for sighted users and later adapted for accessibility.

---

## Key Features

- **Voice-first interaction**
  - Users interact mainly through speech and receive spoken responses.
  - Designed to be short, clear, and practical in busy environments.

- **Hands-free launch**
  - The app can be opened using Siri on iOS or Google Assistant on Android.
  - On launch, the app greets the user and can auto-start listening.

- **Personalisation**
  - Save the user’s name, home address, work address, and favourite places.
  - Store accessibility preferences such as step-free routes and notification style.

- **Real-time TfL updates**
  - Uses TfL open data to support arrivals and journey guidance.

- **Live-data resilience**
  - When live updates are delayed or unavailable, the system presents last-known information with timestamps, falls back to timetable estimates, retries on a schedule, and notifies when live updates return.

- **Onboarding**
  - One-time setup can be completed with support from a sighted helper.
  - After setup, the user can operate the app independently using voice.

---

## Project Status

This repository contains:
- UI/UX prototype design (Figma)
- System architecture and documentation
- Planned implementation structure for backend and mobile client

A working MVP is planned with an 8–12 week development window.

---

## Tech Stack

- **Mobile App:** React Native (single codebase for iOS and Android)
- **Backend:** Python (FastAPI)
- **Speech Services:** Microsoft Azure Cognitive Services (Speech-to-Text and Text-to-Speech)
- **Transit Data:** Transport for London Open Data APIs
