## Why

The Astro cognitive training platform currently lacks a dedicated mobile application, limiting users' ability to train on the go. To achieve a truly cross-platform experience and increase user engagement, we need to adapt the existing web-based features (Vue 3/Vuetify) into a native mobile environment using Expo (React Native) and Zustand, as specified in the project's technical rules.

## What Changes

- **Expo Integration**: Set up a new mobile project structure using Expo within `Astro_project/frontend/mobile`.
- **Zustand State Management**: Port Pinia stores to Zustand for optimized mobile performance and adherence to project rules.
- **UI/UX Adaptation**: Translate the "Astro" glassmorphism aesthetic to React Native components (using `expo-blur` and native primitives).
- **Navigation Overhaul**: Replace the web sidebar with a mobile-optimized navigation system (Bottom Tabs and Drawer).
- **Touch-Optimized Games**: Adapt minigame logic and interactions for touch screens, ensuring responsiveness and interactive feedback.
- **WebSocket Synchronization**: Port the multiplayer and real-time features to the mobile application using React Native compatible WebSocket implementations.

## Capabilities

### New Capabilities
- `mobile-native-shell`: Core Expo application structure and configuration.
- `mobile-navigation`: Native navigation system including tab bars and profile access.
- `mobile-responsive-games`: Shared minigame logic and touch-optimized view layer.
- `touch-interaction-system`: Unified gesture and touch handling for games and UI.

### Modified Capabilities
<!-- No requirement changes to existing web capabilities, this is a port/adaptation -->

## Impact

- **frontend/mobile**: New directory for the Expo project.
- **Shared Logic**: Potential extraction of backend communication logic into a shared layer (though initial focus is on the mobile port).
- **API/WebSockets**: No changes expected on the backend; mobile will consume existing endpoints.
