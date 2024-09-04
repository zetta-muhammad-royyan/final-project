/**
 * Validate Pagination
 * @param {number} page
 * @param {number} limit
 */
const ValidatePagination = (page, limit) => {
  try {
    if (page < 1 || limit < 1) {
      throw new Error('Page and limit must be greater than 0');
    }
  } catch (error) {
    throw new Error(`ValidatePagination error: ${error.message}`);
  }
};

module.exports = { ValidatePagination };
