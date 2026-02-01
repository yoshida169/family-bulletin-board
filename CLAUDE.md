# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**家族の掲示板 (Family Bulletin Board)** - A family communication app where families can share messages, photos, and stay connected through a bulletin board interface.

## Development Commands

```bash
# Start development server
npm start

# Platform-specific development
npm run ios
npm run android
npm run web

# Testing
npm test                  # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
```

## Tech Stack

- **Frontend**: React Native + Expo (SDK 54)
- **Routing**: Expo Router (file-based routing)
- **Backend**: Firebase (Auth, Firestore, Storage, FCM)
- **State Management**: Zustand + React Context
- **Forms**: React Hook Form + Zod
- **Testing**: Jest + React Testing Library

## Architecture

### Directory Structure

```
app/                    # Expo Router screens (file-based routing)
├── (auth)/            # Authentication screens (login, signup, forgot-password)
├── (main)/            # Authenticated screens
│   └── (tabs)/        # Tab-based navigation (home, family, notifications, settings)
└── _layout.tsx        # Root layout with auth guards

src/
├── components/ui/     # Reusable UI components (Button, Input, Card, etc.)
├── hooks/             # Custom React hooks (useAuth, etc.)
├── services/firebase/ # Firebase service layer (auth, family, member)
├── store/             # Zustand stores (authStore)
├── types/             # TypeScript type definitions
├── constants/         # App constants (colors, layout, relations)
└── utils/             # Utility functions (validation)
```

### Path Aliases

Configure in `tsconfig.json`:
- `@components/*` → `src/components/*`
- `@hooks/*` → `src/hooks/*`
- `@services/*` → `src/services/*`
- `@store/*` → `src/store/*`
- `@types/*` → `src/types/*`
- `@utils/*` → `src/utils/*`
- `@constants/*` → `src/constants/*`

### Data Model (Firestore)

```
/users/{userId}
/families/{familyId}
/families/{familyId}/members/{memberId}
/families/{familyId}/boards/{boardId}
/families/{familyId}/boards/{boardId}/posts/{postId}
/families/{familyId}/boards/{boardId}/posts/{postId}/comments/{commentId}
/families/{familyId}/invitations/{invitationId}
```

### Role-Based Permissions

- **admin**: Full control (edit family, invite members, create boards, delete any post)
- **child**: Limited access (create posts/comments, edit own content only)

## Development Guidelines

### Language and Terminology

This project uses Japanese terminology (ユビキタス言語):
- **ファミリー**: Family group
- **ファミリーメンバー**: Family member (user)
- **続柄**: Relationship (お父さん, お母さん, etc.)
- **掲示板**: Bulletin board
- **投稿**: Post
- **招待コード**: Invitation code (6 alphanumeric characters)

### TDD Approach

This project follows Test-Driven Development. Write tests first:
1. Unit tests for utilities and validation (100% coverage target)
2. Component tests with React Testing Library
3. Integration tests with Firebase Emulator Suite
4. E2E tests with Detox

### Firebase Emulator

For local development with Firebase:
```bash
# Start Firebase Emulator Suite (if configured)
firebase emulators:start
```

Emulator ports:
- Auth: 9099
- Firestore: 8080
- Storage: 9199
- UI: 4000

## Documentation Reference

- [family.md](family.md) - Requirements definition (要件定義書)
- [design.md](design.md) - Design document (設計書)
- [implementation-plan.md](implementation-plan.md) - Implementation plan with task breakdown
