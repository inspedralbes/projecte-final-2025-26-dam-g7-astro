# mobile-inventory-shop Specification

## Purpose
Unified system for browsing the shop, buying items, and managing the user's inventory on mobile.

## Requirements
### Requirement: Unified Shop and Inventory
The system SHALL provide a integrated interface for browsing items in the shop and viewing items currently owned in the user's inventory.

#### Scenario: Buying a booster
- **WHEN** a user has sufficient coins and taps "Buy" on a booster item in the shop
- **THEN** the coin balance is deducted and the item appears in the user's inventory.

### Requirement: Item Activation
The application SHALL allow users to activate usable items (e.g., boosters, streak freezes) directly from their mobile inventory.

#### Scenario: Activating a streak freeze
- **WHEN** a user taps "Use" on a streak freeze item in their inventory
- **THEN** the item is consumed and the user's streak protection is updated in the global state.
