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
