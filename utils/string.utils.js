/**
 * Helper function to trim a string.
 * @param {string} input - The string to be trimmed.
 * @returns {string} - The trimmed string.
 */
const TrimString = (input) => {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  return input.trim();
};

module.exports = { TrimString };
