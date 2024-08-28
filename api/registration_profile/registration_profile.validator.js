/**
 * Validate Pagination
 * @param {number} page
 * @param {number} limit
 */
const ValidatePagination = (page, limit) => {
  if (page < 1 || limit < 1) {
    throw new Error('Page and limit must be greater than 0');
  }
};

module.exports = { ValidatePagination };
