# Bee's Little Adventure

An endless side-scrolling flight game. Guide a little bee through a hand-painted garden, avoid branches and other hazards, and see how far you can fly as the game gets faster.

**Play online:** [meadowdrift.netlify.app](https://meadowdrift.netlify.app)

## How to play

- Hold **Space**, the mouse button, or touch the screen to fly upward.
- Release to let gravity pull the bee down.
- Avoid obstacles and stay inside the play area.
- The score counts obstacles passed. Your best run is saved in the browser.

The game is designed for desktop and mobile, including full-screen play on phones.

## Tech stack

- React and TypeScript for the interface
- Phaser 3 for rendering, physics, input, and gameplay
- Vite for local development and production builds

## Run locally

Requires Node.js and pnpm.

```bash
pnpm install
pnpm dev
```

Create a production build with:

```bash
pnpm build
```
