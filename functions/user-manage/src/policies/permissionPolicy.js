import { Permission, Role } from 'node-appwrite';

const dedupe = (perms) => Array.from(new Set(perms));

export class PermissionPolicy {
  static batch(batchId, teacherId) {
    const permissions = [
      Permission.read(Role.users()),
      Permission.read(Role.label('admin')),
      Permission.update(Role.label('admin')),
      Permission.delete(Role.label('admin')),
    ];
    if (batchId) {
      permissions.push(
        Permission.read(Role.team(batchId)),
        Permission.update(Role.team(batchId, 'teacher')),
        Permission.update(Role.team(batchId, 'Teacher')),
        Permission.delete(Role.team(batchId, 'teacher')),
        Permission.delete(Role.team(batchId, 'Teacher'))
      );
    }
    if (teacherId) {
      permissions.push(
        Permission.read(Role.user(teacherId)),
        Permission.update(Role.user(teacherId)),
        Permission.delete(Role.user(teacherId)),
        Permission.read(Role.label('Teacher')),
        Permission.read(Role.label('teacher'))
      );
    }
    return dedupe(permissions);
  }

  static attendance(teamId, studentId) {
    const permissions = [
      Permission.read(Role.label('Teacher')),
      Permission.read(Role.label('teacher')),
      Permission.read(Role.label('admin')),
      Permission.update(Role.label('admin')),
      Permission.delete(Role.label('admin')),
    ];
    if (studentId) {
      permissions.push(
        Permission.read(Role.user(studentId))
      );
    }
    if (teamId) {
      permissions.push(
        Permission.read(Role.team(teamId)),
        Permission.update(Role.team(teamId, 'teacher')),
        Permission.update(Role.team(teamId, 'Teacher')),
        Permission.delete(Role.team(teamId, 'teacher')),
        Permission.delete(Role.team(teamId, 'Teacher'))
      );
    }
    return dedupe(permissions);
  }

  static dailyDiary(teamId, teacherId) {
    const permissions = [
      Permission.read(Role.label('Teacher')),
      Permission.read(Role.label('teacher')),
      Permission.read(Role.label('admin')),
      Permission.update(Role.label('admin')),
      Permission.delete(Role.label('admin')),
    ];
    if (teacherId) {
      permissions.push(
        Permission.read(Role.user(teacherId)),
        Permission.update(Role.user(teacherId)),
        Permission.delete(Role.user(teacherId))
      );
    }
    if (teamId) {
      permissions.push(
        Permission.read(Role.team(teamId)),
        Permission.update(Role.team(teamId, 'teacher')),
        Permission.update(Role.team(teamId, 'Teacher')),
        Permission.delete(Role.team(teamId, 'teacher')),
        Permission.delete(Role.team(teamId, 'Teacher'))
      );
    }
    return dedupe(permissions);
  }

  static assignment(teamId) {
    return dedupe([
      Permission.read(Role.team(teamId)),
      Permission.update(Role.team(teamId, 'teacher')),
      Permission.update(Role.team(teamId, 'Teacher')),
      Permission.delete(Role.team(teamId, 'teacher')),
      Permission.delete(Role.team(teamId, 'Teacher')),
    ]);
  }

  static leaderboard(teamId) {
    return dedupe([
      Permission.read(Role.team(teamId)),
    ]);
  }

  static message(teamId) {
    return dedupe([
      Permission.read(Role.team(teamId)),
      Permission.update(Role.team(teamId, 'teacher')),
      Permission.update(Role.team(teamId, 'Teacher')),
      Permission.delete(Role.team(teamId, 'teacher')),
      Permission.delete(Role.team(teamId, 'Teacher')),
    ]);
  }

  static test(teamId) {
    return dedupe([
      Permission.read(Role.team(teamId)),
      Permission.update(Role.team(teamId, 'teacher')),
      Permission.update(Role.team(teamId, 'Teacher')),
      Permission.delete(Role.team(teamId, 'teacher')),
      Permission.delete(Role.team(teamId, 'Teacher')),
    ]);
  }

  static paper(batchId, teacherId) {
    const permissions = [
      Permission.read(Role.label('Teacher')),
      Permission.read(Role.label('teacher')),
      Permission.read(Role.label('admin')),
      Permission.update(Role.label('admin')),
      Permission.delete(Role.label('admin')),
    ];
    if (batchId) {
      permissions.push(
        Permission.read(Role.team(batchId)),
        Permission.update(Role.team(batchId, 'teacher')),
        Permission.update(Role.team(batchId, 'Teacher')),
        Permission.delete(Role.team(batchId, 'teacher')),
        Permission.delete(Role.team(batchId, 'Teacher'))
      );
    }
    if (teacherId) {
      permissions.push(
        Permission.read(Role.user(teacherId)),
        Permission.update(Role.user(teacherId)),
        Permission.delete(Role.user(teacherId))
      );
    }
    return dedupe(permissions);
  }

  static batchStudent(batchId) {
    const permissions = [
      Permission.read(Role.label('Teacher')),
      Permission.read(Role.label('teacher')),
      Permission.read(Role.label('admin')),
      Permission.update(Role.label('admin')),
      Permission.delete(Role.label('admin')),
    ];
    if (batchId) {
      permissions.push(
        Permission.read(Role.team(batchId)),
        Permission.update(Role.team(batchId, 'teacher')),
        Permission.update(Role.team(batchId, 'Teacher')),
        Permission.delete(Role.team(batchId, 'teacher')),
        Permission.delete(Role.team(batchId, 'Teacher'))
      );
    }
    return dedupe(permissions);
  }

  static batchRequest(batchId, studentId) {
    const permissions = [
      Permission.read(Role.label('Teacher')),
      Permission.read(Role.label('teacher')),
      Permission.read(Role.label('admin')),
      Permission.update(Role.label('admin')),
      Permission.delete(Role.label('admin')),
    ];
    if (studentId) {
      permissions.push(
        Permission.read(Role.user(studentId)),
        Permission.update(Role.user(studentId)),
        Permission.delete(Role.user(studentId))
      );
    }
    if (batchId) {
      permissions.push(
        Permission.read(Role.team(batchId)),
        Permission.update(Role.team(batchId, 'teacher')),
        Permission.update(Role.team(batchId, 'Teacher')),
        Permission.delete(Role.team(batchId, 'teacher')),
        Permission.delete(Role.team(batchId, 'Teacher'))
      );
    }
    return dedupe(permissions);
  }

  static userStats(batchId, userId) {
    const permissions = [
      Permission.read(Role.label('Teacher')),
      Permission.read(Role.label('teacher')),
      Permission.read(Role.label('admin')),
      Permission.update(Role.label('admin')),
      Permission.delete(Role.label('admin')),
    ];
    if (userId) {
      permissions.push(
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId))
      );
    }
    if (batchId) {
      permissions.push(
        Permission.read(Role.team(batchId)),
        Permission.update(Role.team(batchId, 'teacher')),
        Permission.update(Role.team(batchId, 'Teacher')),
        Permission.delete(Role.team(batchId, 'teacher')),
        Permission.delete(Role.team(batchId, 'Teacher'))
      );
    }
    return dedupe(permissions);
  }

  static game(batchId, studentId, teacherId) {
    const permissions = [
      Permission.read(Role.label('Teacher')),
      Permission.read(Role.label('teacher')),
      Permission.read(Role.label('admin')),
      Permission.update(Role.label('admin')),
      Permission.delete(Role.label('admin')),
    ];
    if (studentId) {
      permissions.push(
        Permission.read(Role.user(studentId)),
        Permission.update(Role.user(studentId))
      );
    }
    if (teacherId) {
      permissions.push(
        Permission.read(Role.user(teacherId)),
        Permission.update(Role.user(teacherId)),
        Permission.delete(Role.user(teacherId))
      );
    }
    if (batchId) {
      permissions.push(
        Permission.read(Role.team(batchId)),
        Permission.update(Role.team(batchId, 'teacher')),
        Permission.update(Role.team(batchId, 'Teacher')),
        Permission.delete(Role.team(batchId, 'teacher')),
        Permission.delete(Role.team(batchId, 'Teacher'))
      );
    }
    return dedupe(permissions);
  }
}

export default PermissionPolicy;
