/**
 * Validates if a string is in yyyy-MM-dd format and returns it.
 * If a Date object is provided, it converts it to the required format.
 * Throws an error for invalid formats.
 *
 * @param {string|Date} dateInput - The date string or Date object.
 * @returns {string} The formatted date string "yyyy-MM-dd".
 */
export function formatToYYYYMMDD(dateInput) {
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split("T")[0];
  }

  if (typeof dateInput !== "string") {
    throw new Error("Invalid date input: Must be a string or Date object.");
  }

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateInput)) {
    // Attempt to parse and reformat common date strings if needed, or just reject.
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
    throw new Error(`Invalid date format: "${dateInput}". Expected yyyy-MM-dd.`);
  }

  return dateInput;
}
