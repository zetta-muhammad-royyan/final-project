// *************** IMPORT MODULE ***************
const Student = require('../student/student.model');
const FinancialSupport = require('../financial_support/financial_support.model');

/**
 * Validate payment type
 * @param {String} paymentType
 * @param {Boolean} mix
 */
const ValidatePaymentType = (paymentType, payerIncludeStudent, payerIncludeFinancialSupport, payerIsStudentOnly) => {
  try {
    //*************** paymentType my_self, payer include financial support then throw error
    if (paymentType === 'my_self' && payerIncludeFinancialSupport) {
      throw new Error('payment_type is not match with payer');
    }

    //*************** paymentType my_self, payer is mix then throw error
    if (paymentType === 'my_self' && payerIncludeStudent && payerIncludeFinancialSupport) {
      throw new Error('payment_type is not match with payer');
    }

    //*************** payer is only student but paymentType is family
    if (paymentType === 'family' && payerIsStudentOnly) {
      throw new Error('payment_type is not match with payer');
    }
  } catch (error) {
    throw new Error(`ValidatePaymentType error: ${error.message}`);
  }
};

/**
 * Validate payer
 * @param {Array<{payer_id: String, cost_coverage: Number}>} payer
 * @param {String} paymentType
 * @param {Object} student
 * @param {string} student._id
 * @param {Array<string>} student.financial_support_ids
 * @returns {Array<{payer_id: String, cost_coverage: Number, type: String}>}
 */
const ValidatePayer = async (payer, paymentType, student) => {
  try {
    const validatedPayer = [];
    let payerIncludeStudent = false;
    let payerIncludeFinancialSupport = false;
    let costCoverage = 0;

    //*************** validate that payer IDs are unique
    ValidatePayerIdMustBeUnique(payer);

    //*************** extract all payer IDs to minimize database lookups
    const payerIds = payer.map((p) => p.payer_id);

    //*************** batch query to find all matching FinancialSupports and Students
    const financialSupports = await FinancialSupport.find({ _id: { $in: payerIds } }).lean();
    const students = await Student.find({ _id: { $in: payerIds } }).lean();

    for (let i = 0; i < payer.length; i++) {
      const { payer_id, cost_coverage } = payer[i];

      //*************** validate that the payer belongs to the student or the student it self
      if (!student.financial_support_ids.includes(payer_id) && student._id.toString() !== payer_id) {
        console.log(typeof student._id, typeof payer_id);
        throw new Error('payer must be a financial support that belong to student or the student itself');
      }

      //*************** check if payer is FinancialSupport
      const isFinancialSupport = financialSupports.find((fs) => fs._id.toString() === payer_id);
      if (isFinancialSupport) {
        payerIncludeFinancialSupport = true;
        costCoverage += cost_coverage;
        validatedPayer.push({ ...payer[i], type: 'FinancialSupport' });
        continue;
      }

      //*************** check if payer is the Student
      const isStudent = students.find((s) => s._id.toString() === payer_id);
      if (isStudent) {
        payerIncludeStudent = true;
        costCoverage += cost_coverage;
        validatedPayer.push({ ...payer[i], type: 'Student' });
        continue;
      }

      throw new Error('payer_id is not one of FinancialSupport or a Student');
    }

    //*************** ensure only one student can be the payer
    if (validatedPayer.filter((p) => p.type === 'Student').length > 1) {
      throw new Error('other students cannot be payers');
    }

    //*************** check if payer is only the student and there is only one payer
    const isPayerOnlyStudent = validatedPayer.every((p) => p.type === 'Student') && validatedPayer.length === 1;

    //*************** validate if the payment type matches the payer configuration
    ValidatePaymentType(paymentType, payerIncludeStudent, payerIncludeFinancialSupport, isPayerOnlyStudent);

    //*************** validate that the total cost coverage is exactly 100%
    if (costCoverage !== 100) {
      throw new Error('summed cost coverage must be 100');
    }

    return validatedPayer;
  } catch (error) {
    throw new Error(`ValidatePayer error: ${error.message}`);
  }
};

/**
 * Validate payer
 * @param {Array<{payer_id: String, cost_coverage: Number}>} payers
 */
const ValidatePayerIdMustBeUnique = (payers) => {
  try {
    const uniqueIds = new Set();
    for (const payer of payers) {
      const id = payer.payer_id;
      if (uniqueIds.has(id)) {
        throw new Error('payer must be unique');
      }

      uniqueIds.add(id);
    }
  } catch (error) {
    throw new Error(`ValidatePayerIdMustBeUnique error: ${error.message}`);
  }
};

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

// *************** EXPORT MODULE ***************
module.exports = {
  ValidatePayer,
  ValidatePaymentType,
  ValidatePagination,
};
