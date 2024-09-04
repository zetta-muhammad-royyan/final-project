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
 * @returns {boolean}
 */
const IsEmptyString = (input) => {
  if (typeof input !== 'string') {
    return false;
  }

  const trimmed = TrimString(input);
  return trimmed === '';
};

/**
 * Check if given input is undefined or not
 * @param {undefined} input
 * @returns {boolean}
 */
const IsUndefined = (input) => {
  return input === undefined;
};

/**
 * Check if given input is undefined or null
 * @param {undefined|null} input
 */
const IsUndefinedOrNull = (input) => {
  return IsUndefined(input) || IsNull(input);
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
  IsUndefined,
  IsUndefinedOrNull,
};
