// Validation functions
export const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  if (!/^[0-9a-zA-Z]{20}$/.test(userId)) {
    throw new Error(
      'Invalid userId format: must be 20 characters long and alphanumeric'
    );
  }
};

export const validateLabels = (labels) => {
  if (!Array.isArray(labels)) {
    throw new Error('Labels must be an array');
  }

  const invalidLabels = labels.filter(
    (label) => typeof label !== 'string' || !label.trim()
  );
  if (invalidLabels.length > 0) {
    throw new Error('All labels must be non-empty strings');
  }

  const uniqueLabels = new Set(labels);
  if (uniqueLabels.size !== labels.length) {
    throw new Error('Duplicate labels are not allowed');
  }
};

export const validateAppwriteKey = (key) => {
  if (!key || typeof key !== 'string') {
    throw new Error('Missing or invalid Appwrite API key');
  }
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email: must be a non-empty string');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Invalid password: must be a non-empty string');
  }
};

export const validateCountryCode = (countryCode) => {
  if (!countryCode || typeof countryCode !== 'string') {
    throw new Error('Invalid country code: must be a non-empty string');
  }
  const cleanCode = countryCode.replace(/^\+/, '');
  if (!/^[1-9]\d{0,2}$/.test(cleanCode)) {
    throw new Error('Invalid country code format: must be 1-3 digits');
  }
};

export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Invalid phone: must be a non-empty string');
  }
  if (!/^\d{7,15}$/.test(phone)) {
    throw new Error('Invalid phone format: must be 7-15 digits');
  }
};

export const formatPhoneNumber = (countryCode, phone) => {
  if (!countryCode || !phone) {
    return '';
  }
  const cleanCountryCode = countryCode.replace(/^\+/, '');
  const cleanPhone = phone.replace(/\D/g, '');
  return `+${cleanCountryCode}${cleanPhone}`;
};
