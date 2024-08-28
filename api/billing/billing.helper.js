// *************** IMPORT MODULE ***************
const Billing = require('./billing.model');
const Student = require('../student/student.model');
const FinancialSupport = require('../financial_support/financial_support.model');
const Term = require('../term/term.model');
const Deposit = require('../deposit/deposit.model');

/**
 * Check if user already has billing or not
 * @param {String} studentId
 */
const CheckIfStudentHasBillingOrNot = async (studentId) => {
  const existingBilling = await Billing.findOne({ student_id: studentId });
  if (existingBilling) {
    throw new Error('this student already has billing');
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

  for (let i = 0; i < payer.length; i++) {
    // *************** check if payer is FinancialSupport ***************
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

    // *************** check if payer is student ***************
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

  // *************** check payment type if accordance with the payer ***************
  ValidatePaymentType(paymentType, payerIncludeFinancialSupport && payerIncludeStudent);

  // *************** summed cost coverage must be 100 ***************
  if (costCoverage !== 100) {
    throw new Error('summed cost coverage must be 100');
  }

  return validatedPayer;
};

/**
 * Validate payment type
 * @param {String} paymentType
 * @param {Boolean} mix
 */
const ValidatePaymentType = (paymentType, mix) => {
  if (paymentType === 'my_self' && mix) {
    throw new Error('payment_type is not match with payer');
  }
};

/**
 * Generate billing based on payer
 * @param {string} studentId
 * @param {string} registrationProfileId
 * @param {Array<Object>} payer
 * @param {string} payer.payer_id
 * @param {number} payer.cost_coverage
 * @param {Array<Object>} termPayments
 * @param {string} termPayments.date
 * @param {number} termPayments.percentage
 * @param {number} totalAmount
 * @param {number} termAmount
 * @param {number} deposit
 * @returns {Promise<Array<Object>>}
 */
const GenerateBillingBasedOnPayer = async (studentId, registrationProfileId, payer, termPayments, totalAmount, termAmount, deposit) => {
  const isPayerMix = payer.some((p) => p.type === 'Student') && payer.some((p) => p.type === 'FinancialSupport');
  const isPayerOnlyFinancialSupport = payer.every((p) => p.type === 'FinancialStudent');

  // *************** distributed amount for each payer ***************
  const amountForEachPayer = CalculateAmountForEachPayer(payer, totalAmount, termAmount);

  const billingData = [];

  for (let i = 0; i < payer.length; i++) {
    // *************** this block will execute if the payer is mix
    if (isPayerMix && payer[i].type === 'FinancialSupport') {
      const termIds = await GenerateTerms(termPayments, amountForEachPayer.termAmount[i]);
      billingData.push({
        student_id: studentId,
        registration_profile_id: registrationProfileId,
        payer: payer[i].payer_id,
        total_amount: amountForEachPayer.totalAmount[i],
        paid_amount: 0,
        remaining_due: 0,
        term_ids: termIds,
      });
    }

    // *************** this block will execute if the payer is mix
    if (isPayerMix && payer[i].type === 'Student') {
      const depositId = await GenerateDeposit(termPayments, deposit);
      const termIds = await GenerateTerms(termPayments, amountForEachPayer.termAmount[i]);
      billingData.push({
        student_id: studentId,
        registration_profile_id: registrationProfileId,
        payer: payer[i].payer_id,
        total_amount: amountForEachPayer.totalAmount[i],
        paid_amount: 0,
        remaining_due: 0,
        deposit_id: depositId,
        term_ids: termIds,
      });
    }

    // *************** this block only execute if payer is only financial support
    // *************** create one extra billing for student to store deposit
    if (isPayerOnlyFinancialSupport) {
      const depositId = await GenerateDeposit(termPayments, deposit);
      billingData.push({
        student_id: studentId,
        registration_profile_id: registrationProfileId,
        payer: payer[i].payer_id,
        total_amount: amountForEachPayer.totalAmount[i],
        paid_amount: 0,
        remaining_due: 0,
        deposit_id: depositId,
      });
    }
  }

  // *************** if student pay by it self ***************
  if (!isPayerMix) {
    const depositId = await GenerateDeposit(termPayments, deposit);
    const termIds = await GenerateTerms(termPayments, termAmount);
    billingData.push({
      student_id: studentId,
      registration_profile_id: registrationProfileId,
      payer: studentId,
      total_amount: totalAmount,
      paid_amount: 0,
      remaining_due: 0,
      deposit_id: depositId,
      term_ids: termIds,
    });
  }

  // *************** create billings ***************
  const createdBilling = await Billing.insertMany(billingData);
  //   const billingIds = createdBilling.map(billing => billing._id)

  return createdBilling;
};

/**
 * Generates terms for payments and inserts them into the database.
 *
 * @param {Array<Object>} termPayments - An array of payment terms. Each object should have:
 * @param {number} termPayments.percentage - The percentage of the total amount for this term.
 * @param {string} termPayments.payment_date - The date for the payment term.
 * @param {number} termAmount - The total amount to be divided among the payment terms.
 * @returns {Promise<Array<string>>} - A promise that resolves to an array of term IDs as strings.
 */
const GenerateTerms = async (termPayments, termAmount) => {
  const termData = [];
  termPayments.forEach((term) => {
    const percentage = term.percentage / 100;
    termData.push({
      date: term.payment_date,
      amount: parseFloat((termAmount * percentage).toFixed(2)),
      payment_status: 'billed',
      amount_paid: 0,
      remaining_amount: 0,
    });
  });

  const terms = await Term.insertMany(termData);
  return terms.map((term) => term._id);
};

/**
 * Creates a new deposit entry and saves it to the database.
 *
 * @param {Array<Object>} termPayments - An array of payment terms. Each object should have:
 * @param {string} termPayments.payment_date - The date for the payment term.
 * @param {number} deposit - The amount of the deposit.
 * @returns {Promise<string>} - A promise that resolves to the ID of the created deposit as a string.
 */
const GenerateDeposit = async (termPayments, deposit) => {
  const date = termPayments[termPayments.length - 1].payment_date;
  const newDeposit = new Deposit({
    date: date,
    amount: deposit,
    payment_status: 'billed',
    amount_paid: 0,
    remaining_amount: 0,
  });

  const createdDeposit = await newDeposit.save();
  return createdDeposit._id;
};

/**
 * Calculates the precise distribution of totalAmount and termAmount
 * based on the cost coverage of each payer.
 * @param {Object[]} payers - An array of payer objects, each containing a 'cost_coverage' property (0-100).
 * @param {Number} payers.cost_coverage - cost coverage for each payer
 * @param {number} totalAmount - The total amount to be distributed among payers.
 * @param {number} termAmount - The term amount to be distributed among payers.
 * @returns {{ totalAmount: number[], termAmount: number[] }} An object containing arrays for totalAmount and termAmount, each distributed precisely among payers.
 */
const CalculateAmountForEachPayer = (payers, totalAmount, termAmount) => {
  const distributeAmount = (amount, payers) => {
    return payers.map((payer) => {
      const coveragePercentage = payer.cost_coverage / 100;
      return parseFloat((amount * coveragePercentage).toFixed(2));
    });
  };

  const distributedTotalAmount = distributeAmount(totalAmount, payers);
  const distributedTermAmount = distributeAmount(termAmount, payers);

  return {
    totalAmount: distributedTotalAmount,
    termAmount: distributedTermAmount,
  };
};

// *************** EXPORT MODULE ***************
module.exports = {
  CheckIfStudentHasBillingOrNot,
  ValidatePayer,
  GenerateBillingBasedOnPayer,
};
