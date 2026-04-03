/**
 * Checks if a user profile is considered complete.
 * Required fields: userName, role, DOB, address
 *
 * @param {object|null} profile - The user profile document
 * @returns {{ isComplete: boolean, missingFields: string[] }}
 */
export function checkProfileCompletion(profile) {
  if (!profile) {
    return { isComplete: false, missingFields: ["userName", "role", "DOB", "address"] };
  }

  const requiredFields = [
    { key: "userName", label: "Full Name" },
    { key: "role", label: "Role" },
    { key: "DOB", label: "Date of Birth" },
    { key: "address", label: "Address" },
  ];

  const missingFields = requiredFields
    .filter(({ key }) => {
      const val = profile[key];
      if (Array.isArray(val)) return val.length === 0;
      return !val;
    })
    .map(({ label }) => label);

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}
