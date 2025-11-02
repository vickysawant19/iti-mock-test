<<<<<<< HEAD
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
=======
# ITI Mock Test - Copilot Instructions

This document provides instructions for AI coding agents to effectively contribute to the ITI Mock Test project.

## Project Overview

This is a web application for conducting mock tests for ITI students. It's built with a modern frontend stack and uses Appwrite as the backend-as-a-service.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Appwrite (Database, Auth, Functions)
- **State Management:** Redux Toolkit
- **UI Components:** Shadcn UI, Radix UI
- **Routing:** React Router

## Project Structure

- `src/`: Contains the main source code for the React application.
  - `src/appwrite/`: Houses all the services for interacting with Appwrite. Each file corresponds to a specific Appwrite service (e.g., `auth.js`, `database.js`).
  - `src/components/`: Contains reusable UI components. The `ui` subdirectory holds the Shadcn UI components.
  - `src/store/`: Includes the Redux store setup and slices for state management.
  - `src/config/config.js`: Manages Appwrite configuration, pulling sensitive keys from environment variables.
- `functions/`: Contains the source code for Appwrite's serverless functions. Each subdirectory is a separate function.
- `public/`: Holds static assets that are publicly accessible.

## Development Workflow

- **Running the development server:**
  ```bash
  npm run dev
  ```
- **Building for production:**
  ```bash
  npm run build
  ```
- **Linting the code:**
  ```bash
  npm run lint
  ```

## Appwrite Integration

The application is tightly integrated with Appwrite for its backend services.

- **Configuration:** The Appwrite client is initialized in `src/appwrite/appwriteConfig.js`, with configuration details loaded from `src/config/config.js`. Environment variables (prefixed with `VITE_`) are used for sensitive information like project and database IDs.
- **Services:** The `src/appwrite/` directory contains a set of services that abstract the Appwrite API calls. For example, `src/appwrite/auth.js` handles user authentication, and `src/appwrite/mockTest.js` manages mock test data. When working on features that require backend interaction, you should use or create services in this directory.

## Component Architecture

The project uses a component-based architecture.

- **Shadcn UI:** The UI is built using Shadcn UI components, which are located in `src/components/ui`. These are unstyled, accessible components that can be customized.
- **Custom Components:** Custom components are located in `src/components/components`. These are built using the base Shadcn UI components.
- **Protected Routes:** The application uses protected routes to manage access to different parts of the application based on user roles (admin, teacher, student). The logic for this is in `src/components/private/`.

## State Management

- **Redux Toolkit:** The application uses Redux Toolkit for state management. The store is configured in `src/store/store.js`, and the state is divided into slices located in the same directory (e.g., `profileSlice.js`, `questionSlice.js`).

## Serverless Functions

The `functions/` directory contains serverless functions that are deployed to Appwrite. These functions are used for backend logic that shouldn't be exposed on the client-side, such as bulk data operations or integrations with other services. Each function has its own `package.json` and `src` directory.

## MCP Server Configuration

This project is configured to use an MCP server for interacting with the Appwrite API. The configuration is as follows:

```json
{
  "servers": {
    "appwrite-api": {
      "command": "uvx",
      "args": ["mcp-server-appwrite", "--users", "--databases"],
      "env": {
        "APPWRITE_PROJECT_ID": "itimocktest",
        "APPWRITE_API_KEY": "standard_4bf0d5d7794a9461c152b76a3ca18b4ddaeea3f245ee36d482cbb057acd5dc459d162f76151402db724d35b10de165d04cc857a1e1fe2fb8978f3946421aa29b0efaf26ae79f4b55a43002da47d186e7d35d107800f16bf1c77632480a1547917186c5fdb756e18e08edd060c7f6157bce1adb11b81cb78de559042a548c5125",
        "APPWRITE_ENDPOINT": "https://fra.cloud.appwrite.io/v1"
      }
    }
  }
}
```

This allows AI agents to directly interact with the Appwrite backend for tasks like querying databases and managing users.

### Appwrite Querying

When interacting with the Appwrite database via the MCP server, queries must be in the raw JSON format. The Appwrite SDK's `Query` class is not available in this context.

**Query String Format:**

Appwrite queries are escaped JSON strings. For example:

```json
"{\\"method\\":\\"equal\\",\\"column\\":\\"name\\",\\"values\\":[\\"John\\"]}"
```

The JSON object has the following structure:

```json
{
  "method": "<QUERY_METHOD>",
  "column": "<ATTRIBUTE>",
  "values": [
    "<VALUE1>",
    "<VALUE2>",
    ...
  ]
}
```

**Example:**

To query for all documents where the `name` is "John" or "Jane", the query would be:

```json
{
  "method": "equal",
  "column": "name",
  "values": [
    "John",
    "Jane"
  ]
}
```
>>>>>>> 51c28286ad8715e1058e7b883e29e0c77ef2e6da
