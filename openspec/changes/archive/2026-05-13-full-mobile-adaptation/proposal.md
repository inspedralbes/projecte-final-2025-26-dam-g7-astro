## Why

The Astro platform's mobile presence currently consists only of placeholders for core features like training, social interaction, and shop management. To provide a complete and competitive user experience, we must adapt all existing desktop web functionalities to the mobile application, ensuring users can access the full suite of cognitive training tools, progress through the spatial map, and interact with the community from their mobile devices.

## What Changes

- **Full State Integration**: Implement Zustand stores for `progress`, `inventory`, `social`, and `achievements` to mirror the desktop Pinia architecture.
- **Spatial Map Port**: Implement the interactive training map in React Native, including level sequencing, phase dividers, and progress visualization.
- **Minigame Library**: Adapt all 7 training minigames (Word Construction, Radar Scan, Radio Signal, Spelled Rosco, Rhyme Squad, Syllable Quest, Symmetry Breaker) to touch-optimized React Native components.
- **Social & Shop Systems**: Build functional mobile views for the Shop, Inventory, Friends list, and Achievement showcase.
- **Educational & Plan Management**: Port the educational tools and plan subscription management to the mobile interface.

## Capabilities

### New Capabilities
- `mobile-spatial-map`: Interactive vertical progress map with node navigation and phase visualizers.
- `mobile-social-hub`: Comprehensive social interface including friends list, requests, and achievement sharing.
- `mobile-inventory-shop`: Unified system for browsing the shop, buying items, and managing the user's inventory.
- `mobile-minigame-suite`: Collection of touch-optimized cognitive training games with unified game-over and scoring logic.

### Modified Capabilities
- `mobile-native-shell`: Expanding the core shell to support complex navigation and global state for all modules.

## Impact

- **frontend/mobile**: Significant expansion of the `app/`, `components/`, and `stores/` directories.
- **Backend API**: Increased traffic from mobile clients; potential requirement for mobile-specific API tweaks (though primary goal is to use existing endpoints).
- **Localization**: Mobile-specific UI strings will be added to the existing i18n system.
