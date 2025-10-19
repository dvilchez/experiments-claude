# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based experiments showcase application deployed to GitHub Pages. The app displays a collection of interactive experiments focused on browser performance, event handling, and other web platform capabilities.

## Architecture

**Routing Structure:**
- `App.js` - Main router using React Router with basename set to `process.env.PUBLIC_URL` for GitHub Pages compatibility
- `ExperimentList.js` - Landing page displaying a grid of available experiments with images
- Individual experiments are located in `src/experiments/` directory and registered in both the routing table and experiment list

**Adding a New Experiment:**
1. Create a new component file in `src/experiments/`
2. Add a route in `App.js` Routes
3. Add an entry to the `experiments` array in `ExperimentList.js` with name, path, and imageUrl
4. Use a unique seed in the imageUrl pattern: `https://picsum.photos/seed/{experimentname}/300/200`

## Development Commands

**Start development server:**
```bash
npm start
```
Opens at http://localhost:3000 with hot reload enabled.

**Run tests:**
```bash
npm test
```
Runs Jest in watch mode.

**Run tests once (for CI):**
```bash
npm test -- --watchAll=false
```

**Build for production:**
```bash
npm run build
```
Creates optimized production build in `build/` directory.

## Testing

- Test files use `.test.js` extension
- Testing library includes `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event`
- `setupTests.js` imports jest-dom matchers for enhanced DOM assertions

## Deployment

The app automatically deploys to GitHub Pages on push to `main` branch via `.github/workflows/deploy.yml`. The workflow:
1. Runs tests (must pass)
2. Builds the app
3. Deploys to GitHub Pages

The `homepage` field in `package.json` must match the GitHub Pages URL: `https://dvilchez.github.io/experiments-claude`

## Package Manager

Uses Yarn 1.22.22 (specified in `packageManager` field). Install dependencies with `yarn` or `npm install`.
