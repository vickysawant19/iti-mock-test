import { Permission, Role } from 'node-appwrite';

export class PermissionPolicy {
  static batch(teacherId) {
    return [
      Permission.read(Role.label('admin')),
      Permission.update(Role.label('admin')),
      Permission.delete(Role.label('admin')),
      Permission.read(Role.user(teacherId)),
      Permission.update(Role.user(teacherId)),
      Permission.delete(Role.user(teacherId)),
      Permission.read(Role.label('Teacher')),
    ];
  }

  static attendance(teamId) {
    return [
      Permission.read(Role.team(teamId)),
      Permission.create(Role.team(teamId)),
      Permission.update(Role.team(teamId, 'teacher')),
      Permission.delete(Role.team(teamId, 'teacher')),
    ];
  }

  static assignment(teamId) {
    return [
      Permission.read(Role.team(teamId)),
      Permission.create(Role.team(teamId, 'teacher')),
      Permission.update(Role.team(teamId, 'teacher')),
      Permission.delete(Role.team(teamId, 'teacher')),
    ];
  }

  static leaderboard(teamId) {
    return [
      Permission.read(Role.team(teamId)),
    ];
  }

  static message(teamId) {
    return [
      Permission.read(Role.team(teamId)),
      Permission.create(Role.team(teamId)),
    ];
  }

  static test(teamId) {
    return [
      Permission.read(Role.team(teamId)),
    ];
  }
}

export default PermissionPolicy;
