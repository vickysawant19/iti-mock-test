// Core Services
export * from "./core/appwriteClient";
export * from "./core/database.service";

// Auth Services
export * from "./auth/auth.service";
export { default as userProfileService } from "./auth/userProfileService";
export { default as profileImageService } from "./auth/profileImageService";
export { default as studentSearchService } from "./auth/studentSearchService";
export { default as teamService } from "./auth/teamService";

// Batch Services
export { default as batchService } from "./batch/batchService";
export { default as batchRequestService } from "./batch/batchRequestService";
export { default as batchStudentService } from "./batch/batchStudentService";
export { default as studentBatchAccessService } from "./batch/studentBatchAccess";
export { default as collegeService } from "./batch/collageService";
export { default as tradeService } from "./batch/tradedetails";

// Academic Services
export { default as subjectService } from "./academic/subjectService";
export { default as moduleServices } from "./academic/moduleServices";
export * from "./academic/question.service";
export { default as questionFunctionService } from "./academic/questionFunction.service";
export * from "./academic/mocktest.service";

// Attendance Services
export { default as newAttendanceService } from "./attendance/newAttendanceService";
export { default as holidayService } from "./attendance/holidaysService";
export { default as dailyDiaryService } from "./attendance/dailyDiaryService";
export * from "./attendance/attendanceTrackingService";
export * from "./attendance/attendanceAnalyticsService";

// Gamification Services
export * from "./gamification/game.service";
export * from "./gamification/challenge.service";
export * from "./gamification/dailyMissions.service";
export * from "./gamification/cosmetics.service";
export * from "./gamification/powerups.service";
export * from "./gamification/reward.service";
export * from "./gamification/leaderboard.service";

// Notification Services
export { default as notificationService } from "./notification/notification.service";
