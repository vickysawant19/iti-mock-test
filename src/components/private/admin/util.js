import { format } from "date-fns";

// Generate a random UUID to use as unique identifier
export const generateUUID = () => {
  return "xxxx-xxxx-4xxx-yxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper to generate a unique 10-character paper ID.
// Here we generate 4 random letters and append a 12-digit timestamp.
// Note: This produces a 16-character string. Adjust numbers if you want exactly 10 characters.
export const generatePaperId = () => {
  const randomChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let initials = randomChar
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
    .slice(0, 4);
  const timestamp = format(new Date(), "yyMMddHHmmss");
  return initials + timestamp;
};
