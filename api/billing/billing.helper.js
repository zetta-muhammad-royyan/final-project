// *************** IMPORT MODULE ***************
const Billing = require('./billing.model');
const Term = require('../term/term.model');
const Deposit = require('../deposit/deposit.model');
const { ConvertToObjectId } = require('../../utils/mongoose.utils');

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
  const isPayerOnlyFinancialSupport = payer.every((p) => p.type === 'FinancialSupport');
  const isPayerOnlyStudent = payer.every((p) => p.type === 'Student') && payer.length === 1;

  // *************** distributed amount for each payer ***************
  const termAmountForEachPayer = CalculateTermAmountForEachPayer(payer, termAmount);

  const billingData = [];

  //*************** this block only executed when payer is mix or only financial support
  for (let i = 0; i < payer.length; i++) {
    if (payer[i].type === 'FinancialSupport') {
      const termIds = await GenerateTerms(termPayments, termAmountForEachPayer[i]);
      billingData.push({
        student_id: studentId,
        registration_profile_id: registrationProfileId,
        payer: payer[i].payer_id,
        total_amount: termAmountForEachPayer[i],
        paid_amount: 0,
        remaining_due: termAmountForEachPayer[i],
        term_ids: termIds,
      });
    }

    if (payer[i].type === 'Student' && !isPayerOnlyStudent) {
      const depositId = await GenerateDeposit(termPayments, deposit);
      const termIds = await GenerateTerms(termPayments, termAmountForEachPayer[i]);
      billingData.push({
        student_id: studentId,
        registration_profile_id: registrationProfileId,
        payer: payer[i].payer_id,
        total_amount: termAmountForEachPayer[i] + deposit,
        paid_amount: 0,
        remaining_due: termAmountForEachPayer[i] + deposit,
        deposit_id: depositId,
        term_ids: termIds,
      });
    }
  }

  // *************** this block only execute if payer is only financial support
  // *************** create one extra billing for student to store deposit
  if (isPayerOnlyFinancialSupport) {
    const depositId = await GenerateDeposit(termPayments, deposit);
    billingData.push({
      student_id: studentId,
      registration_profile_id: registrationProfileId,
      payer: studentId,
      total_amount: deposit,
      paid_amount: 0,
      remaining_due: deposit,
      deposit_id: depositId,
    });
  }

  // *************** if student pay by it self ***************
  if (!isPayerMix && isPayerOnlyStudent) {
    const depositId = await GenerateDeposit(termPayments, deposit);
    const termIds = await GenerateTerms(termPayments, termAmount);
    billingData.push({
      student_id: studentId,
      registration_profile_id: registrationProfileId,
      payer: studentId,
      total_amount: totalAmount,
      paid_amount: 0,
      remaining_due: totalAmount,
      deposit_id: depositId,
      term_ids: termIds,
    });
  }

  // *************** create billings ***************
  const createdBilling = await Billing.insertMany(billingData);

  //*************** update each term with new billing_id
  UpdateTermBillingId(createdBilling);

  //*************** update deposit with new billing_id
  UpdateDepositBillingId(createdBilling);

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
      remaining_amount: parseFloat((termAmount * percentage).toFixed(2)),
    });
  });

  //*************** make each term precise
  const totalDistributed = termData.reduce((acc, curr) => acc + curr.amount, 0);
  const difference = parseFloat((termAmount - totalDistributed).toFixed(2));
  if (difference !== 0) {
    const lastTerm = termData[termData.length - 1];
    lastTerm.amount = parseFloat(lastTerm.amount + difference).toFixed(2);
    lastTerm.remaining_amount = parseFloat(lastTerm.remaining_amount + difference).toFixed(2);
  }

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
    remaining_amount: deposit,
  });

  const createdDeposit = await newDeposit.save();
  return createdDeposit._id;
};

/**
 * @param {Array<Object>} billings
 * @param {Array<string>} billings.term_ids
 * @param {string} bilings._id
 */
const UpdateTermBillingId = async (billings) => {
  const billingMap = {};
  for (const billing of billings) {
    if (billing.term_ids) {
      billingMap[billing._id] = billing.term_ids;
    }
  }

  for (const [billingId, termIds] of Object.entries(billingMap)) {
    await Term.updateMany({ _id: { $in: termIds } }, { $set: { billing_id: billingId } });
  }
};

/**
 * @param {Array<Object>} billings
 * @param {Array<string>} billings.term_ids
 * @param {string} bilings._id
 */
const UpdateDepositBillingId = async (billings) => {
  const billingMap = {};
  for (const billing of billings) {
    if (billing.deposit_id) {
      billingMap[billing._id] = billing.deposit_id;
    }
  }

  for (const [billingId, depositIds] of Object.entries(billingMap)) {
    await Deposit.updateMany({ _id: { $in: depositIds } }, { $set: { billing_id: billingId } });
  }
};

/**
 * Calculates the precise distribution of totalAmount and termAmount
 * based on the cost coverage of each payer.
 * @param {Object[]} payers - An array of payer objects, each containing a 'cost_coverage' property (0-100).
 * @param {Number} payers.cost_coverage - cost coverage for each payer
 * @param {number} totalAmount - The total amount to be distributed among payers.
 * @param {number} termAmount - The term amount to be distributed among payers.
 * @returns {number[]} An arrays for totalAmount and termAmount, each distributed precisely among payers.
 */
const CalculateTermAmountForEachPayer = (payers, termAmount) => {
  const amountForEachPayer = payers.map((payer) => {
    const coveragePercentage = payer.cost_coverage / 100;
    return parseFloat((termAmount * coveragePercentage).toFixed(2));
  });

  const totalDistributed = amountForEachPayer.reduce((acc, curr) => acc + curr, 0);
  const difference = parseFloat((termAmount - totalDistributed).toFixed(2));
  if (difference !== 0) {
    amountForEachPayer[amountForEachPayer.length - 1] += difference;
  }

  return amountForEachPayer;
};

/**
 * @param {Object} query - An object containing either `billingId` (string) or `studentId` (string).
 * @param {string[]} lookups - An array of collections to lookup (e.g., ['deposit', 'term']).
 * @returns {Promise<Object|Object[]>} - A promise that resolves to an array of billing objects.
 */
const FindBillingWithLookup = async (query, lookups = []) => {
  const pipeline = [];

  if (query.billingId) {
    pipeline.push({
      $match: {
        _id: ConvertToObjectId(query.billingId),
      },
    });
  } else if (query.studentId) {
    // Lookup by student ID
    pipeline.push({
      $match: {
        student_id: ConvertToObjectId(query.studentId),
      },
    });
  } else {
    throw new Error('Either billingId or studentId must be provided.');
  }

  if (lookups.includes('deposit')) {
    pipeline.push({
      $lookup: {
        from: 'deposits',
        localField: 'deposit_id',
        foreignField: '_id',
        as: 'deposit',
      },
    });
  }

  if (lookups.includes('term')) {
    pipeline.push({
      $lookup: {
        from: 'terms',
        localField: 'term_ids',
        foreignField: '_id',
        as: 'terms',
      },
    });
  }

  const result = await Billing.aggregate(pipeline);

  return query.billingId ? result[0] : result;
};

/**
 * @param {Object} deposit
 * @param {string} deposit._id
 * @param {number} deposit.amount
 * @param {number} deposit.amount_paid
 * @param {number} deposit.remaining_amount
 * @returns {number}
 */
const PayDeposit = async (deposit, paidAmount) => {
  if (deposit.amount_paid === deposit.amount) {
    return parseFloat(paidAmount).toFixed(2);
  }

  const isPaid = paidAmount - deposit.remaining_amount >= 0;
  const paymentStatus = isPaid ? 'paid' : 'partial_paid';

  const amountPaid =
    paidAmount > deposit.remaining_amount ? parseFloat(deposit.amount).toFixed(2) : parseFloat(deposit.amount_paid + paidAmount).toFixed(2);

  const remainingAmountToBePaid =
    paidAmount - deposit.remaining_amount < 0 ? parseFloat(Math.abs(paidAmount - deposit.remaining_amount)).toFixed(2) : 0;

  const remainder = paidAmount - deposit.remaining_amount > 0 ? parseFloat(paidAmount - deposit.remaining_amount).toFixed(2) : 0;

  await Deposit.findByIdAndUpdate(deposit._id, {
    payment_status: paymentStatus,
    amount_paid: amountPaid,
    remaining_amount: remainingAmountToBePaid,
  });

  return remainder;
};

/**
 *
 * @param {Array<Object>} terms
 * @param {string} terms._id
 * @param {number} terms.amount
 * @param {number} terms.amount_paid
 * @param {number} terms.remaining_amount
 */
const PayTerms = async (terms, paidAmount) => {
  let remainder = parseFloat(paidAmount).toFixed(2);

  for (let i = 0; i < terms.length; i++) {
    if (terms[i].remaining_amount > 0 && remainder > 0) {
      const isPaid = remainder - terms[i].remaining_amount >= 0;
      const paymentStatus = isPaid ? 'paid' : 'partial_paid';

      const amountPaid =
        remainder > terms[i].remaining_amount
          ? parseFloat(terms[i].amount).toFixed(2)
          : (parseFloat(terms[i].amount_paid) + parseFloat(remainder)).toFixed(2);

      const remainingAmountToBePaid =
        remainder - terms[i].remaining_amount < 0
          ? Math.abs(parseFloat(remainder) - parseFloat(terms[i].remaining_amount)).toFixed(2)
          : parseFloat(0).toFixed(2);

      remainder =
        remainder - terms[i].remaining_amount > 0 ? parseFloat(remainder - terms[i].remaining_amount).toFixed(2) : parseFloat(0).toFixed(2);

      await Term.findByIdAndUpdate(terms[i]._id, {
        payment_status: paymentStatus,
        amount_paid: amountPaid,
        remaining_amount: remainingAmountToBePaid,
      });
    }
  }
};

/**
 * @param {Array<Object>} terms
 * @param {string} terms._id
 * @param {number} terms.amount
 * @param {number} terms.amount_paid
 * @param {number} terms.remaining_amount
 * @param {number} removedAmount
 */
const RemovePaidTermAmount = async (terms, removedAmount) => {
  let remainder = parseFloat(removedAmount).toFixed(2);

  for (let i = terms.length - 1; i >= 0; i--) {
    if (terms[i].amount_paid > 0 && remainder > 0) {
      const isFullRemoval = remainder >= terms[i].amount_paid;
      const paymentStatus = isFullRemoval ? 'billed' : 'partial_paid';

      const newAmountPaid = isFullRemoval
        ? parseFloat(0).toFixed(2)
        : (parseFloat(terms[i].amount_paid) - parseFloat(remainder)).toFixed(2);

      const remainingAmountToBePaid = isFullRemoval
        ? parseFloat(terms[i].amount).toFixed(2)
        : (parseFloat(terms[i].remaining_amount) + parseFloat(remainder)).toFixed(2);

      remainder = remainder - terms[i].amount_paid > 0 ? parseFloat(remainder - terms[i].amount_paid).toFixed(2) : parseFloat(0).toFixed(2);

      await Term.findByIdAndUpdate(terms[i]._id, {
        payment_status: paymentStatus,
        amount_paid: newAmountPaid,
        remaining_amount: remainingAmountToBePaid,
      });
    }
  }
};

// *************** EXPORT MODULE ***************
module.exports = {
  CheckIfStudentHasBillingOrNot,
  GenerateBillingBasedOnPayer,
  FindBillingWithLookup,
  PayDeposit,
  PayTerms,
  RemovePaidTermAmount,
};
