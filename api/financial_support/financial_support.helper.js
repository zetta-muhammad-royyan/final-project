// *************** Import module ***************
const FinancialSupport = require('./financial_support.model');

// *************** Import Utils ***************
const { isString } = require('../../utils/primitiveTypes');

/**
 * Add or replace financial support for student
 * @param {Object} student
 * @param {String} student._id
 * @param {Array<String>} student.financial_support_ids
 * @param {Array<Object>} financial_supports
 * @param {String} financial_support.civility
 * @param {String} financial_support.first_name
 * @param {String} financial_support.last_name
 * @returns {Array<String>}
 */
const addOrReplaceFinancialSupport = async (student, financial_supports = []) => {
  const financialSupportsData = [];
  for (let i = 0; i < financial_supports.length; i++) {
    if (
      !isString(financial_supports[i].civility) ||
      !isString(financial_supports[i].first_name) ||
      !isString(financial_supports[i].last_name)
    ) {
      throw new Error('arguments not met the requirements');
    }

    if (!['mr', 'mrs', 'neutral'].includes(financial_supports[i].civility.toLocaleLowerCase())) {
      throw new Error('the civility must be mr, mrs or neutral');
    }

    financialSupportsData.push({
      civility: financial_supports[i].civility,
      first_name: financial_supports[i].first_name,
      last_name: financial_supports[i].last_name,
      student_id: student._id,
    });
  }

  // delete existing financial support if any
  if (student.financial_support_ids.length != 0 && financial_supports.length != 0) {
    await FinancialSupport.deleteMany({ _id: { $in: student.financial_support_ids } });
  }

  // student didnt change their financial supports
  if (student.financial_support_ids.length > 0 && financial_supports.length === 0) {
    return student.financial_support_ids;
  }

  const newFinancialSupports = await FinancialSupport.insertMany(financialSupportsData);
  return newFinancialSupports.map((fs) => fs._id);
};

module.exports = {
  addOrReplaceFinancialSupport,
};
