// *************** IMPORT UTILITIES ***************
const { TrimString } = require('../../utils/string.utils');

// *************** IMPORT VALIDATOR ***************
const { ValidateFinancialSupportInput } = require('./financial_support.validator');

/**
 * Prepare data to add or replace financial support for student
 * @param {Object} student
 * @param {String} student._id
 * @param {Array<String>} student.financial_support_ids
 * @param {Array<Object>} financialSupports
 * @param {String} financial_support.civility
 * @param {String} financial_support.first_name
 * @param {String} financial_support.last_name
 * @returns {Object} result
 * @returns {Array<Object>} result.newFinancialSupportsData - Data for new financial supports to be inserted
 * @returns {Array<String>} result.idsToDelete - IDs of financial supports to be deleted
 */
const PrepareFinancialSupportData = (student, financialSupports) => {
  //*************** no one deleted, no one inserted
  if (!financialSupports) {
    return {
      newFinancialSupportsData: [],
      idsToDelete: [],
    };
  }

  let idsToDelete = [];
  let newFinancialSupportsData = [];

  //*************** if financial supports array is empty, prepare to delete all existing supports
  if (Array.isArray(financialSupports) && financialSupports.length === 0 && student.financial_support_ids.length > 0) {
    idsToDelete = student.financial_support_ids;
    return {
      newFinancialSupportsData: [],
      idsToDelete,
    };
  }

  //*************** validate and prepare new financial supports data
  for (let i = 0; i < financialSupports.length; i++) {
    ValidateFinancialSupportInput(financialSupports[i].civility, financialSupports[i].first_name, financialSupports[i].last_name);

    newFinancialSupportsData.push({
      civility: financialSupports[i].civility,
      first_name: TrimString(financialSupports[i].first_name),
      last_name: TrimString(financialSupports[i].last_name),
      student_id: student._id,
    });
  }

  //*************** if there are existing financial supports, prepare to delete them
  if (student.financial_support_ids.length !== 0 && newFinancialSupportsData.length !== 0) {
    idsToDelete = student.financial_support_ids;
  }

  return {
    newFinancialSupportsData,
    idsToDelete,
  };
};

// *************** EXPORT MODULE ***************
module.exports = {
  PrepareFinancialSupportData,
};
