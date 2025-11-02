# Copilot Instructions for ITI Mock Test Codebase

## Project Overview

- This is a mock test application for generating questions, built with React (see `src/`), Vite, and Node.js serverless functions (see `functions/`).
- The architecture separates frontend (`src/`) and backend logic (`functions/`).
- Key services and business logic are in `src/appwrite/` and `functions/Mock-Test-Service/src/`.

## Major Components & Data Flow

- **Frontend**: React components in `src/components/` and UI primitives in `src/components/ui/`.
- **Backend**: Serverless functions in `functions/` (e.g., `Mock-Test-Service`, `imageUpload`, `user-manage`).
- **Service Layer**: API/service wrappers in `src/appwrite/` (e.g., `mockTest.js`, `userProfileService.js`).
- **Assets**: Static files in `public/` and `src/assets/`.

## Developer Workflows

- **Build**: Use Vite (`vite.config.js`). Build with `npm run build` from project root.
- **Dev Server**: Start with `npm run dev` (Vite).
- **Backend Functions**: Each function folder under `functions/` has its own `package.json` and entry point (`src/main.js`). Install dependencies and run/test functions individually.
- **Deployment**: Vercel config in `vercel.json`.

## Project-Specific Conventions

- **Component Structure**: Use folder-based organization for features (e.g., `src/components/Auth/`, `src/components/private/`).
- **Service Pattern**: API calls and business logic are abstracted in `src/appwrite/`.
- **Naming**: Use camelCase for files and functions, PascalCase for React components.
- **State Management**: Redux slices in `src/store/` (e.g., `profileSlice.js`, `questionSlice.js`).
- **Custom UI**: Prefer using primitives from `src/components/ui/` for consistency.

## Appwrite Integration

- **Service Layer**: Backend services are integrated via `src/appwrite/`. The main database ID is `itimocktest`.
- **MCP Server**: This workspace is configured to use the Appwrite MCP server for direct database and user management. You can use the `mcp_appwrite-api` tools to interact with it.
- **String Queries**: When querying databases, use the JSON string format. For example, to limit results, use `{"method":"limit","values":[20]}`. Remember to escape this string when using it in a URL parameter.
- **Key Collections**:
  - `questionData` (ID: `667932c5000ff8e2d769`): Stores all mock test questions.
  - `userProfile` (ID: `66937340001047368f32`): Stores user profile information.
  - `questionPaperData` (ID: `667e8b800015a7ece741`): Stores generated question papers for users.

## Integration Points

- **Vercel**: Deployment configuration in `vercel.json`.
- **External Models**: Face recognition models in `public/models/`.

## Examples

- To add a new mock test feature, create a service in `src/appwrite/mockTest.js` and a React component in `src/components/private/mocktest/`.
- To update backend logic, edit the relevant function in `functions/Mock-Test-Service/src/` and update its `package.json` if new dependencies are needed.

## Key Files & Directories

- `src/App.jsx`, `src/main.jsx`: App entry points
- `src/appwrite/`: Service layer
- `src/components/`: UI and feature components
- `functions/`: Serverless backend functions
- `public/models/`: ML models for face recognition
- `vite.config.js`, `vercel.json`: Build and deployment config

---

_If any section is unclear or missing important details, please provide feedback to improve these instructions._
