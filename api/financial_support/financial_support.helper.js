// *************** IMPORT MODULE ***************
const FinancialSupport = require('./financial_support.model');

// *************** IMPORT UTILITIES ***************
const { IsString } = require('../../utils/primitiveTypes');

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
const AddOrReplaceFinancialSupport = async (student, financialSupports = []) => {
  const financialSupportsData = [];

  // *************** loop all FinancialSupport and do checking ***************
  for (let i = 0; i < financialSupports.length; i++) {
    if (
      !IsString(financialSupports[i].civility) ||
      !IsString(financialSupports[i].first_name) ||
      !IsString(financialSupports[i].last_name)
    ) {
      throw new Error('arguments not met the requirements');
    }

    if (!['mr', 'mrs', 'neutral'].includes(financialSupports[i].civility.toLocaleLowerCase())) {
      throw new Error('the civility must be mr, mrs or neutral');
    }

    financialSupportsData.push({
      civility: financialSupports[i].civility,
      first_name: financialSupports[i].first_name,
      last_name: financialSupports[i].last_name,
      student_id: student._id,
    });
  }

  // *************** delete existing financial support if any ***************
  if (student.financial_support_ids.length != 0 && financialSupports.length != 0) {
    await FinancialSupport.deleteMany({ _id: { $in: student.financial_support_ids } });
  }

  // *************** student didnt change their financial supports ***************
  if (student.financial_support_ids.length > 0 && financialSupports.length === 0) {
    return student.financial_support_ids;
  }

  const newFinancialSupports = await FinancialSupport.insertMany(financialSupportsData);

  // *************** return the ids FinancialSupport that just created ***************
  return newFinancialSupports.map((fs) => fs._id);
};

// *************** EXPORT MODULE ***************
module.exports = {
  AddOrReplaceFinancialSupport,
};
