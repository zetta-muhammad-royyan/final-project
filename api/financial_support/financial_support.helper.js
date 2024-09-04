// *************** IMPORT MODULE ***************
const FinancialSupport = require('./financial_support.model');

// *************** IMPORT UTILITIES ***************
const { TrimString } = require('../../utils/string.utils');

// *************** IMPORT VALIDATOR ***************
const { ValidateFinancialSupportInput } = require('./financial_support.validator');

/**
 * Add or replace financial support for student
 * @param {Object} student
 * @param {String} student._id
 * @param {Array<String>} student.financial_support_ids
 * @param {Array<Object>} financialSupports
 * @param {String} financial_support.civility
 * @param {String} financial_support.first_name
 * @param {String} financial_support.last_name
 * @returns {Array<String>}
 */
const AddOrReplaceFinancialSupport = async (student, financialSupports) => {
  //*************** if student doesnt change their financial support
  if (!financialSupports) {
    return student.financial_support_ids;
  }

  //*************** if student send empty array of financial support, it means delete all financial support
  if (Array.isArray(financialSupports) && financialSupports.length === 0 && student.financial_support_ids.length > 0) {
    await FinancialSupport.deleteMany({ _id: { $in: student.financial_support_ids } });
    return [];
  }

  const financialSupportsData = [];

  // *************** loop all FinancialSupport and do checking
  for (let i = 0; i < financialSupports.length; i++) {
    ValidateFinancialSupportInput(financialSupports[i].civility, financialSupports[i].first_name, financialSupports[i].last_name);

    financialSupportsData.push({
      civility: financialSupports[i].civility,
      first_name: TrimString(financialSupports[i].first_name),
      last_name: TrimString(financialSupports[i].last_name),
      student_id: student._id,
    });
  }

  // *************** delete existing financial support if any
  if (student.financial_support_ids.length !== 0 && financialSupports.length !== 0) {
    await FinancialSupport.deleteMany({ _id: { $in: student.financial_support_ids } });
  }

  const newFinancialSupports = await FinancialSupport.insertMany(financialSupportsData);

  // *************** return the ids FinancialSupport that just created
  return newFinancialSupports.map((fs) => fs._id);
};

// *************** EXPORT MODULE ***************
module.exports = {
  AddOrReplaceFinancialSupport,
};
