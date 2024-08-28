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

module.exports = { CheckObjectId };
