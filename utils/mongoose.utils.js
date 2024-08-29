// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

/**
 * Validate if given string is object id or not, if not then throw error
 * @param {*} id
 */
const CheckObjectId = (id, message = 'Invalid ID format') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(message);
  }
};

/**
 * Converts a string to a MongoDB ObjectId.
 * @param {string} id - The string representation of the ObjectId.
 * @returns {import('mongoose').Types.ObjectId} The converted ObjectId.
 */
const ConvertToObjectId = (id) => {
  return mongoose.Types.ObjectId(id);
};

module.exports = { CheckObjectId, ConvertToObjectId };
