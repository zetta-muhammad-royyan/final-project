/**
 * Check if string or not
 * @param {*} input
 * @returns {Boolean}
 */
const IsString = (input) => {
  return typeof input === 'string';
};

/**
 * Check if number or not
 * @param {*} input
 * @returns {Boolean}
 */
const IsNumber = (input) => {
  return typeof input === 'number' && !isNaN(input);
};

// *************** EXPORT MODULE ***************
module.exports = {
  IsString,
  IsNumber,
};
