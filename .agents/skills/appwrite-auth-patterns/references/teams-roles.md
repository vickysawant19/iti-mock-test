# Appwrite Teams & Role-Based Access Control

## Teams Overview

Appwrite Teams allow grouping users with named roles, enabling team-based
permissions across databases, storage, and functions.

```
Team structure:
  team:TEAM_ID          — any team member
  team:TEAM_ID/owner    — members with 'owner' role
  team:TEAM_ID/admin    — members with 'admin' role
  team:TEAM_ID/editor   — members with 'editor' role
  (roles are custom strings — define your own)
```

---

## Creating & Managing Teams

```typescript
import { Client, Teams, ID } from 'appwrite'

const teams = new Teams(client) // client with user session

// Create a team (user who creates it is auto-assigned 'owner')
const team = await teams.create(
  ID.unique(),    // teamId
  'My Workspace', // name
  ['owner', 'admin', 'editor', 'viewer'] // optional: pre-define roles
)

// List current user's teams
const myTeams = await teams.list()

// Get team details
const teamDetails = await teams.get(team.$id)

// Delete team
await teams.delete(team.$id)
```

---

## Team Memberships

```typescript
// Invite a user to a team (sends invite email)
const membership = await teams.createMembership(
  TEAM_ID,
  ['editor'],               // roles to assign
  'user@example.com',       // email (used if userId not known)
  undefined,                // userId (alternative to email)
  undefined,                // phone (alternative)
  'https://yourapp.com/team/invite/callback', // redirect URL after accepting
  'Alice'                   // name hint for the invite email
)

// Accept membership (from redirect URL params after accepting invite)
// URL will contain: ?teamId=...&userId=...&membershipId=...&secret=...
await teams.updateMembershipStatus(
  TEAM_ID,
  MEMBERSHIP_ID,
  USER_ID,
  SECRET
)

// List team members
const members = await teams.listMemberships(TEAM_ID)

// Update member's roles
await teams.updateMembership(TEAM_ID, MEMBERSHIP_ID, ['admin', 'editor'])

// Remove a member
await teams.deleteMembership(TEAM_ID, MEMBERSHIP_ID)

// Leave a team (member removes themselves)
await teams.deleteMembership(TEAM_ID, currentUserMembershipId)
```

---

## Team-Based Permissions Pattern

```typescript
// ✅ Collection with team-level permissions
await databases.createCollection(
  DATABASE_ID, 'workspace-docs', 'Workspace Documents',
  [
    Permission.read  (Role.team(WORKSPACE_TEAM_ID)),          // all members can read
    Permission.create(Role.team(WORKSPACE_TEAM_ID, 'editor')), // editors can create
    Permission.create(Role.team(WORKSPACE_TEAM_ID, 'admin')),  // admins can create
    Permission.update(Role.team(WORKSPACE_TEAM_ID, 'admin')),  // admins can update
    Permission.delete(Role.team(WORKSPACE_TEAM_ID, 'admin')),  // admins can delete
  ],
  true // document_security: true for per-document overrides
)

// Individual document with granular permissions
await databases.createDocument(
  DATABASE_ID, 'workspace-docs', ID.unique(),
  { title: 'Q1 Report', content: '...' },
  [
    Permission.read  (Role.team(WORKSPACE_TEAM_ID)),
    Permission.update(Role.user(creatorId)),               // creator can edit
    Permission.update(Role.team(WORKSPACE_TEAM_ID, 'admin')), // admins can edit
    Permission.delete(Role.team(WORKSPACE_TEAM_ID, 'admin')),
  ]
)
```

---

## Multi-Tenant SaaS Pattern

```typescript
// Each organization/workspace is a Team
// Users belong to one or more Teams
// Resources (docs, files) are scoped to Teams

class WorkspaceService {
  // Create a new workspace (team)
  async createWorkspace(name: string, ownerId: string) {
    const team = await teams.create(ID.unique(), name, ['owner', 'admin', 'member'])
    // Creator is auto-assigned 'owner'
    return team
  }

  // Invite user to workspace
  async inviteToWorkspace(teamId: string, email: string, role: 'admin' | 'member') {
    return teams.createMembership(
      teamId,
      [role],
      email,
      undefined,
      undefined,
      `https://app.example.com/workspace/${teamId}/invite`
    )
  }

  // Create a resource owned by workspace
  async createDocument(teamId: string, data: Record<string, unknown>) {
    return databases.createDocument(
      DATABASE_ID, 'documents', ID.unique(),
      { ...data, teamId },
      [
        Permission.read  (Role.team(teamId)),
        Permission.update(Role.team(teamId, 'admin')),
        Permission.delete(Role.team(teamId, 'admin')),
      ]
    )
  }

  // List all documents for a workspace (scoped by teamId)
  async listDocuments(teamId: string) {
    return databases.listDocuments(DATABASE_ID, 'documents', [
      Query.equal('teamId', teamId),
      Query.orderDesc('$createdAt'),
    ])
  }
}
```

---

## Label-Based Admin Access

```typescript
// Labels are tags on user accounts — set server-side only
// Great for superadmin / platform-level roles

// Server-side (Function or backend) — set user label
const userService = new Users(serverClient) // server client with API key
await userService.updateLabels(userId, ['admin', 'beta-tester'])

// Permissions using labels
await databases.createCollection(
  DATABASE_ID, 'admin-settings', 'Admin Settings',
  [
    Permission.read  (Role.label('admin')),
    Permission.create(Role.label('admin')),
    Permission.update(Role.label('admin')),
    Permission.delete(Role.label('admin')),
  ]
)

// Check if current user has a label (client-side)
const user = await account.get()
const isAdmin = (user.labels ?? []).includes('admin')
```

---

## Role Hierarchy Pattern

```typescript
// Build role hierarchy using multiple team roles
// Convention: owner > admin > editor > viewer

const ROLE_HIERARCHY = {
  owner:  ['read', 'create', 'update', 'delete', 'manage'],
  admin:  ['read', 'create', 'update', 'delete'],
  editor: ['read', 'create', 'update'],
  viewer: ['read'],
}

function buildPermissions(teamId: string, resource: 'document' | 'collection') {
  return [
    // All roles can read
    Permission.read(Role.team(teamId)),
    // Editors and above can create/update
    Permission.create(Role.team(teamId, 'editor')),
    Permission.create(Role.team(teamId, 'admin')),
    Permission.create(Role.team(teamId, 'owner')),
    Permission.update(Role.team(teamId, 'editor')),
    Permission.update(Role.team(teamId, 'admin')),
    Permission.update(Role.team(teamId, 'owner')),
    // Admins and above can delete
    Permission.delete(Role.team(teamId, 'admin')),
    Permission.delete(Role.team(teamId, 'owner')),
  ]
}
```

---

## Server-Side Team Operations

```typescript
// From Functions or backend (uses server client with API key)
import { Users, Teams } from 'node-appwrite'

const serverUsers = new Users(serverClient)
const serverTeams = new Teams(serverClient)

// Create team on user registration (e.g., auto-create personal workspace)
async function onUserRegistered(userId: string, userName: string) {
  const team = await serverTeams.create(
    ID.unique(),
    `${userName}'s Workspace`,
    ['owner']
  )
  // Add the new user as owner
  await serverTeams.createMembership(
    team.$id,
    ['owner'],
    undefined,  // email
    userId,     // userId — no email invite needed (server can add directly)
  )
  return team
}
```
