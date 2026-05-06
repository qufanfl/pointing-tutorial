# Pointing Tutorial Plan

## Goal

TV remote pointing tutorial prototype based on the constellation exploration PRD.

Each step is scoped to roughly 30 minutes to 1 hour.

## Build Plan

- [x] Make at least one screen visible
  - Create the first runnable screen with a dark space background.
  - Show a simple star field, one target star, and basic title text.
  - Add a visible remote guide area or placeholder so the product shape is represented from the start.

- [x] Add the basic tutorial layout
  - Define the main TV canvas/screen area.
  - Add a compact instruction area.
  - Add a skip button and a simple mission progress indicator.
  - Keep the first screen clean and premium rather than explanatory.

- [x] Build the remote touchpad guide
  - Draw or place a remote silhouette based on the reference image.
  - Highlight the small circular touchpad area near the top.
  - Add a soft pulse effect when the tutorial asks the user to touch and hold.

- [x] Implement pointer activation
  - Show the star pointer when Tap & Hold begins.
  - Keep the pointer visible while the hold state is active.
  - Fade the pointer out 3 seconds after release.
  - Add subtle stardust around the pointer.

- [x] Implement pointer movement
  - Map remote angle movement or prototype input movement to pointer movement.
  - Make movement feel smooth and responsive.
  - Add light particles that gently trail the pointer.
  - Tune pointer speed so first-time users can control it easily.

- [x] Create Mission 1: Wake The Starlight
  - Place one dim target star on screen.
  - Ask the user to hold the touchpad and move the pointer to the star.
  - Brighten the star and space around it on success.
  - Advance automatically after a short success moment.

- [x] Create Mission 2: Trace The Constellation
  - Place three stars in a simple constellation path.
  - Let the user reach each star in sequence.
  - Draw a thin glowing line between completed stars.
  - Add a small pulse when the constellation is completed.

- [x] Add gentle physics reactions
  - Make target stars react when the pointer gets close.
  - Add a soft pull, glow, or shimmer near active targets.
  - Keep the effect subtle so it does not distract from learning.

- [x] Create Mission 3: Scroll The Star Map
  - Build a scrollable star map or nebula layer.
  - Support Flick as a short scroll.
  - Support Swipe as continuous scroll.
  - Support Swipe & Hold as ongoing auto-scroll.

- [x] Tune scroll motion
  - Add light inertia after Flick and Swipe.
  - Add gentle deceleration.
  - Add a soft boundary or elastic feel at map edges.
  - Make the hidden constellation react when it reaches the center area.

- [x] Add center reposition tutorial
  - Move or leave the pointer away from center.
  - Show a subtle center star target.
  - Support Double Tap to reposition the pointer to center.
  - Add a short light trail and ripple on completion.

- [x] Build tutorial state flow
  - Connect Mission 1, Mission 2, Mission 3, and center reposition into one flow.
  - Add simple success transitions between missions.
  - Make sure users can recover if they miss an action.
  - Keep total flow around 30 to 60 seconds.

- [x] Add final completion state
  - Show a concise completion message.
  - Offer a clear next action to continue to the TV experience.
  - Keep the tone premium and light.

- [ ] Polish visual style
  - Refine colors, glow intensity, stars, and particles.
  - Avoid a busy or childish look.
  - Make the space feel deep but readable on a TV screen.
  - Check text contrast and legibility from couch distance.

- [ ] Polish copy
  - Keep each instruction short.
  - Use friendly, action-oriented Korean copy.
  - Avoid long explanations of mechanics.
  - Confirm each message matches the active interaction.

- [ ] Add basic sound hooks
  - Define hooks for touch start, star found, constellation connected, scroll, and center reposition.
  - Use placeholder sounds or named events if final sound assets are not ready.
  - Keep sound optional and easy to mute.

- [ ] Add accessibility and fallback behavior
  - Ensure the tutorial can be skipped at any time.
  - Ensure instructions are readable without relying only on color.
  - Provide timeout or retry guidance if the user does not act.
  - Make sure reduced-motion mode can lower particle and transition intensity.

- [ ] Test the full first-time-user path
  - Run through the tutorial from a fresh start.
  - Confirm each mission can be completed without prior knowledge.
  - Check that pointer fade, scroll, and double tap are understandable.
  - Note any confusing moments for iteration.

- [ ] Prepare handoff notes
  - Document implemented interactions.
  - List any remaining assumptions about real remote input events.
  - Capture known limitations and next polish tasks.
  - Link back to the PRD file.
