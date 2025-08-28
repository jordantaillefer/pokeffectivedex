# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pokeffectivedex is a React Native/Expo mobile and web app for Pokémon type effectiveness lookup. Users can search Pokémon, view effectiveness tables, build teams, and get recommendations for battles.

## Development Commands

### Start Development Server
```bash
npm start
```
Starts the Expo development server with QR code for mobile testing.

### Platform-Specific Development
```bash
npm run android  # Run on Android
npm run ios      # Run on iOS
npm run web      # Run in web browser
```

## Architecture

- **Framework**: React Native with Expo (SDK 53)
- **Language**: TypeScript with strict mode enabled
- **Navigation**: React Navigation v6 (tabs + stack navigation)
- **State Management**: React Query for server state, AsyncStorage for local persistence
- **Data Source**: PokéAPI with local caching
- **UI**: Custom Pokémon-themed components with Expo Vector Icons

## Key Dependencies

### Navigation & UI
- `@react-navigation/native` - Core navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `@react-navigation/stack` - Stack navigation
- `@expo/vector-icons` - Icon library
- `expo-linear-gradient` - Gradient backgrounds
- `expo-image` - Optimized image loading

### Data & Storage
- `@tanstack/react-query` - Server state management and caching
- `@react-native-async-storage/async-storage` - Local data persistence
- `axios` - HTTP client for PokéAPI

## Project Structure

- `App.tsx` - Main app component with navigation setup
- `index.ts` - Entry point
- `assets/` - Images and icons
- `src/` - Source code (to be created)
  - `screens/` - App screens (Search, Detail, Team)
  - `components/` - Reusable UI components
  - `services/` - API and data services
  - `types/` - TypeScript type definitions
  - `utils/` - Helper functions
  - `contexts/` - React contexts for global state

## Key Features

- **Pokémon Search**: Search by name (FR/EN), filter by type and generation
- **Effectiveness Tables**: View type advantages/disadvantages for strategic planning
- **Team Management**: Build teams of up to 6 Pokémon with AsyncStorage persistence
- **Battle Recommendations**: Suggest team members effective against opponent Pokémon
- **Multi-language Support**: French and English Pokémon names
- je veux que maintenant chaque fois que tu essaieras d'acceder a un fichier tu utilises le path relatif comme tu l'as fais ici Read(src/utils/typeTranslations.ts)