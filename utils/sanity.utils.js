// *************** IMPORT UTILITIES ***************
const { TrimString } = require('./string.utils');

/**
 * Check if given input is null or not
 * @param {any} input
 * @returns {boolean}
 */
const IsNull = (input) => {
  return input === null;
};

/**
 * Check if given input is empty string or not
 * @param {string} input
 * @returns {}
 */
const IsEmptyString = (input) => {
  const trimmed = TrimString(input);
  return trimmed === '';
};

/**
 * Check if the given input is a sorting input which is 1 or -1
 * @param {number} input
 * @returns {boolean}
 */
const IsSortingInput = (input) => {
  return input === 1 || input === -1;
};

// *************** EXPORT MODULE ***************
module.exports = {
  IsNull,
  IsEmptyString,
  IsSortingInput,
};
