// *************** IMPORT MODULE ***************
const Student = require('../student/student.model');
const FinancialSupport = require('../financial_support/financial_support.model');

/**
 * Validate payment type
 * @param {String} paymentType
 * @param {Boolean} mix
 */
const ValidatePaymentType = (paymentType, payerIncludeStudent, payerIncludeFinancialSupport, payerIsStudentOnly) => {
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
};

/**
 * Validate payer
 * @param {Array<{payer_id: String, cost_coverage: Number}>} payer
 * @param {String} paymentType
 * @returns {Array<{payer_id: String, cost_coverage: Number, type: String}>}
 */
const ValidatePayer = async (payer, paymentType) => {
  const validatedPayer = [];
  let payerIncludeStudent = false;
  let payerIncludeFinancialSupport = false;
  let costCoverage = 0;

  ValidatePayerIdMustBeUnique(payer);

  for (let i = 0; i < payer.length; i++) {
    // *************** check if payer is FinancialSupport
    const payerIsFinancialSupport = await FinancialSupport.findOne({ _id: payer[i].payer_id });
    if (payerIsFinancialSupport) {
      payerIncludeFinancialSupport = true;
      costCoverage += payer[i].cost_coverage;
      validatedPayer.push({
        ...payer[i],
        type: 'FinancialSupport',
      });

      continue;
    }

    // *************** check if payer is student
    const payerIsStudent = await Student.findOne({ _id: payer[i].payer_id });
    if (payerIsStudent) {
      payerIncludeStudent = true;
      costCoverage += payer[i].cost_coverage;
      validatedPayer.push({
        ...payer[i],
        type: 'Student',
      });

      continue;
    }

    throw new Error('payer_id is not one of FinancialSupport or a Student');
  }

  //*************** other student cannot be payer
  if (validatedPayer.filter((payer) => payer.type === 'Student').length > 1) {
    throw new Error('other student cannot be payer');
  }

  //*************** check if payer only a student and only one payer
  const isPayerOnlyStudent = validatedPayer.every((payer) => payer.type === 'Student') && validatedPayer.length === 1;

  // *************** check payment type if accordance with the payer
  ValidatePaymentType(paymentType, payerIncludeStudent, payerIncludeFinancialSupport, isPayerOnlyStudent);

  // *************** summed cost coverage must be 100
  if (costCoverage !== 100) {
    throw new Error('summed cost coverage must be 100');
  }

  return validatedPayer;
};

/**
 * Validate payer
 * @param {Array<{payer_id: String, cost_coverage: Number}>} payers
 */
const ValidatePayerIdMustBeUnique = (payers) => {
  const uniqueIds = new Set();
  for (const payer of payers) {
    const id = payer.payer_id;
    if (uniqueIds.has(id)) {
      throw new Error('payer must be unique');
    }

    uniqueIds.add(id);
  }
};

// *************** EXPORT MODULE ***************
module.exports = {
  ValidatePayer,
  ValidatePaymentType,
};
