// TODO: Temporary frontend permission generation.
// Move to Appwrite Function after backend permission layer is implemented.

import { Permission, Role } from "appwrite";

export const PermissionBuilder = {
  teamRead: (teamId) => [
    Permission.read(Role.team(teamId)),
  ],

  teacherWrite: (teamId) => [
    Permission.create(Role.team(teamId, "teacher")),
    Permission.update(Role.team(teamId, "teacher")),
    Permission.delete(Role.team(teamId, "teacher")),
  ],

  attendance: (teamId) => [
    Permission.read(Role.team(teamId)),
    Permission.create(Role.team(teamId)),
    Permission.update(Role.team(teamId, "teacher")),
    Permission.delete(Role.team(teamId, "teacher")),
  ],

  assignment: (teamId) => [
    Permission.read(Role.team(teamId)),
    Permission.create(Role.team(teamId, "teacher")),
    Permission.update(Role.team(teamId, "teacher")),
    Permission.delete(Role.team(teamId, "teacher")),
  ],

  diary: (teamId) => [
    Permission.read(Role.team(teamId)),
    Permission.create(Role.team(teamId, "teacher")),
    Permission.update(Role.team(teamId, "teacher")),
    Permission.delete(Role.team(teamId, "teacher")),
  ],

  leaderboard: (teamId) => [
    Permission.read(Role.team(teamId)),
  ],

  test: (teamId) => [
    Permission.read(Role.team(teamId)),
    Permission.create(Role.team(teamId, "teacher")),
    Permission.update(Role.team(teamId, "teacher")),
    Permission.delete(Role.team(teamId, "teacher")),
  ],

  message: (teamId) => [
    Permission.read(Role.team(teamId)),
    Permission.create(Role.team(teamId)),
  ],
};

export default PermissionBuilder;
