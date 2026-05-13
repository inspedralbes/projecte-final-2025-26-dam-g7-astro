## 1. Project Initialization & Infrastructure

- [x] 1.1 Initialize Expo project in `Astro_project/frontend/mobile` using `npx create-expo-app`.
- [x] 1.2 Install core dependencies: `zustand`, `@react-navigation/native`, `expo-router`, `expo-blur`, `react-native-reanimated`.
- [x] 1.3 Set up the global theme provider with Astro's colors and fonts (Orbitron, Rajdhani).
- [x] 1.4 Create the `astroShared.js` equivalent in mobile for API and WebSocket configuration.

## 2. State Management & Authentication

- [x] 2.1 Implement `useSessionStore` using Zustand to handle user login, token, and profile data.
- [x] 2.2 Build the Login and Registration screens with validation and backend integration.
- [x] 2.3 Implement the authentication middleware/navigation guard to protect routes.

## 3. Navigation & Layout

- [x] 3.1 Implement the Bottom Tab Navigator (Home, Training, Multiplayer, Shop).
- [ ] 3.2 Create the Profile Drawer/Modal with logout and settings functionality.
- [x] 3.3 Set up the global Layout component with the Astro background and glassmorphism styling.

## 4. Training & Minigame Porting

- [ ] 4.1 Port the core training logic (XP, level calculation) to mobile-compatible hooks.
- [ ] 4.2 Implement the \"Word Construction\" minigame view with touch-optimized letter selection.
- [ ] 4.3 Adapt other training minigames (if applicable) ensuring responsive layout for different screen sizes.

## 5. Multiplayer & Real-time Features

- [ ] 5.1 Implement the `useMultiplayerStore` in Zustand with WebSocket support.
- [ ] 5.2 Build the Multiplayer Lobby and Room creation/joining screens.
- [ ] 5.3 Implement real-time game synchronization (actions, scores, timers) for the \"Race\" mode.

## 6. Interaction & Feedback

- [ ] 6.1 Integrate `expo-haptics` for positive/negative game feedback.
- [ ] 6.2 Implement custom gesture handlers for game interactions using `react-native-gesture-handler`.
- [ ] 6.3 Final audit of UI responsiveness and touch-target sizes across different device emulators.
