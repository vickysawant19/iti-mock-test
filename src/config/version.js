/**
 * Application Versioning Configuration
 * Automatically updated on each build / deployment from package.json and build timestamp.
 */

export const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.2.0";

export const BUILD_DATE =
  typeof __BUILD_DATE__ !== "undefined"
    ? __BUILD_DATE__
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

export default {
  version: APP_VERSION,
  buildDate: BUILD_DATE,
};
