## MODIFIED Requirements

### Requirement: Challenge flow is fully functional end-to-end
The challenge/duel flow between two friends SHALL work completely in real time with proper UI feedback at every step for both the challenger and the challenged player.

#### Scenario: Challenger sends a challenge
- **WHEN** user A clicks "Desafiar" on a friend's card
- **THEN** a WS `CHALLENGE` message is sent to the backend
- **THEN** user B receives a `CHALLENGE_RECEIVED` WS event and sees a popup/notification
- **THEN** user A sees a pending state (button disabled) and a chat message "¡Te he desafiado a un duelo!" is visible in the chat with user B

#### Scenario: Challenged player accepts the challenge
- **WHEN** user B accepts the challenge via the popup
- **THEN** user B sends `CHALLENGE_RESPONSE` with `accepted: true`
- **THEN** backend creates a private room and sends `CHALLENGE_ACCEPTED` to both users with `roomId`
- **THEN** both users are navigated to the multiplayer lobby for that room
- **THEN** a `challenge-result` chat message "✅ Desafío aceptado" is saved in DB and sent to both users
- **THEN** the challenge button cooldown for user A is cleared after the challenge resolves

#### Scenario: Challenged player rejects the challenge
- **WHEN** user B rejects the challenge via the popup
- **THEN** user B sends `CHALLENGE_RESPONSE` with `accepted: false`
- **THEN** backend sends `CHALLENGE_REJECTED` to user A (the challenger)
- **THEN** user A's challenge button cooldown is cleared after 3 seconds
- **THEN** a `challenge-result` chat message "❌ Desafío rechazado" is saved in DB and sent to both users as `CHAT_MESSAGE` with `msgType: 'challenge-result'`
- **THEN** user A sees the rejection message in the chat

#### Scenario: Challenge popup auto-dismisses if not responded
- **WHEN** 5 seconds pass after user B receives the challenge
- **THEN** the challenge popup disappears from user B's screen
- **THEN** the challenge is effectively expired (no action needed from user B)
- **THEN** user A's button cooldown is cleared after a timeout (30 seconds)

#### Scenario: Chat shows challenge status
- **WHEN** user A or B opens the chat
- **THEN** challenge messages show with a special visual style (sword icon, different background)
- **THEN** accepted results show in green, rejected in red, pending in amber
