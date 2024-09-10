// *************** IMPORT MODULE ***************
const Billing = require('./billing.model');

// *************** IMPORT UTILITIES ***************
const { IsSortingInput } = require('../../utils/sanity.utils');
const { ConvertToObjectId } = require('../../utils/mongoose.utils');

/**
 * Check if user already has billing or not
 * @param {String} studentId
 */
const CheckIfStudentHasBillingOrNot = async (studentId) => {
  try {
    const existingBilling = await Billing.countDocuments({ student_id: studentId });
    if (existingBilling > 0) {
      throw new Error('this student already has billing');
    }
  } catch (error) {
    throw new Error(`CheckIfStudentHasBillingOrNot error: ${error.message}`);
  }
};

/**
 * @param {Object} query - An object containing either `billingId` (string) or `studentId` (string).
 * @param {string[]} lookups - An array of collections to lookup (e.g., ['deposit', 'term']).
 * @returns {Promise<Object|Object[]>} - A promise that resolves to an array of billing objects.
 */
const FindBillingWithLookup = async (query, lookups = []) => {
  try {
    const pipeline = [];

    if (query.billingId) {
      pipeline.push({
        $match: {
          _id: ConvertToObjectId(query.billingId),
        },
      });
    } else if (query.studentId) {
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
  } catch (error) {
    throw new Error(`FindBillingWithLookup error: ${error.message}`);
  }
};

/**
 * Retrieves a billing record for a student that includes deposit information.
 * @param {string} studentId - The student's ID.
 * @returns {Promise<Object|null>} - The billing record with deposit info or `null` if not found.
 */
const FindStudentDepositBilling = async (studentId) => {
  try {
    const pipeline = [
      {
        $match: {
          student_id: ConvertToObjectId(studentId),
          deposit_id: { $exists: true },
        },
      },
      {
        $lookup: {
          from: 'deposits',
          localField: 'deposit_id',
          foreignField: '_id',
          as: 'deposit',
        },
      },
    ];

    const depositBilling = await Billing.aggregate(pipeline);
    return depositBilling.length === 1 ? depositBilling[0] : null;
  } catch (error) {
    throw new Error('Error finding billing record with deposit information');
  }
};

/**
 * @param {Array<Object>} termPayments - An array of payment terms. Each object should have:
 * @param {number} termPayments.percentage - The percentage of the total amount for this term.
 * @param {string} termPayments.payment_date - The date for the payment term.
 * @param {number} termAmount - The total amount to be divided among the payment terms.
 * @returns {Array<Object>} - An array of term objects ready for insertion.
 */
const GenerateTermsData = (termPayments, termAmount) => {
  //*************** generate term payment based on payment plan
  const termData = termPayments.map((term) => {
    const percentage = term.percentage / 100;
    const amount = parseFloat((termAmount * percentage).toFixed(2));
    return {
      date: term.payment_date,
      amount: amount,
      payment_status: 'billed',
      amount_paid: 0,
      remaining_amount: amount,
    };
  });

  //*************** make each term precise
  const totalDistributed = termData.reduce((acc, curr) => acc + curr.amount, 0);
  const difference = parseFloat((termAmount - totalDistributed).toFixed(2));
  if (difference !== 0) {
    const lastTerm = termData[termData.length - 1];
    lastTerm.amount = parseFloat((lastTerm.amount + difference).toFixed(2));
    lastTerm.remaining_amount = parseFloat((lastTerm.remaining_amount + difference).toFixed(2));
  }

  return termData;
};

/**
 * @param {Array<Object>} termPayments - An array of payment terms. Each object should have:
 * @param {string} termPayments.payment_date - The date for the payment term.
 * @param {number} deposit - The amount of the deposit.
 * @returns {Object} - An object representing the deposit entry ready for insertion.
 */
const GenerateDepositData = (termPayments, deposit) => {
  const date = termPayments[termPayments.length - 1].payment_date;
  const depositData = {
    date: date,
    amount: deposit,
    payment_status: 'billed',
    amount_paid: 0,
    remaining_amount: deposit,
  };

  return depositData;
};

/**
 * Generate billing data based on payer without saving to the database.
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
const GenerateBillingData = async (studentId, registrationProfileId, payer, termPayments, totalAmount, termAmount, deposit) => {
  const isPayerMix = payer.some((p) => p.type === 'Student') && payer.some((p) => p.type === 'FinancialSupport');
  const isPayerOnlyFinancialSupport = payer.every((p) => p.type === 'FinancialSupport');
  const isPayerOnlyStudent = payer.every((p) => p.type === 'Student') && payer.length === 1;

  // *************** distributed amount for each payer ***************
  const termAmountForEachPayer = CalculateTermAmountForEachPayer(payer, termAmount);

  const billingData = [];

  //*************** this block only executed when payer is mix or only financial support
  for (let i = 0; i < payer.length; i++) {
    //*************** if payer is financila support
    if (payer[i].type === 'FinancialSupport') {
      const termData = GenerateTermsData(termPayments, termAmountForEachPayer[i]);
      billingData.push({
        student_id: studentId,
        registration_profile_id: registrationProfileId,
        payer: payer[i].payer_id,
        total_amount: termAmountForEachPayer[i],
        paid_amount: 0,
        remaining_due: termAmountForEachPayer[i],
        term_data: termData,
      });
    }

    //*************** if payer is a student and not only that student as a payer (mix with financial support)
    if (payer[i].type === 'Student' && !isPayerOnlyStudent) {
      const depositData = GenerateDepositData(termPayments, deposit);
      const termData = GenerateTermsData(termPayments, termAmountForEachPayer[i]);
      billingData.push({
        student_id: studentId,
        registration_profile_id: registrationProfileId,
        payer: payer[i].payer_id,
        total_amount: termAmountForEachPayer[i] + deposit,
        paid_amount: 0,
        remaining_due: termAmountForEachPayer[i] + deposit,
        deposit_data: depositData,
        term_data: termData,
      });
    }
  }

  // *************** this block only execute if payer is only financial support
  // *************** create one extra billing for student to store deposit
  if (isPayerOnlyFinancialSupport) {
    const depositData = GenerateDepositData(termPayments, deposit);
    billingData.push({
      student_id: studentId,
      registration_profile_id: registrationProfileId,
      payer: studentId,
      total_amount: deposit,
      paid_amount: 0,
      remaining_due: deposit,
      deposit_data: depositData,
    });
  }

  // *************** if student pay by itself
  if (!isPayerMix && isPayerOnlyStudent) {
    const depositData = GenerateDepositData(termPayments, deposit);
    const termData = await GenerateTermsData(termPayments, termAmount);
    billingData.push({
      student_id: studentId,
      registration_profile_id: registrationProfileId,
      payer: studentId,
      total_amount: totalAmount,
      paid_amount: 0,
      remaining_due: totalAmount,
      deposit_data: depositData,
      term_data: termData,
    });
  }

  return billingData;
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
  //*************** divide the amount to be paid based on the percentage of each payer
  const amountForEachPayer = payers.map((payer) => {
    const coveragePercentage = payer.cost_coverage / 100;
    return parseFloat((termAmount * coveragePercentage).toFixed(2));
  });

  //*************** make divided amount precise
  const totalDistributed = amountForEachPayer.reduce((acc, curr) => acc + curr, 0);
  const difference = parseFloat((termAmount - totalDistributed).toFixed(2));
  if (difference !== 0) {
    amountForEachPayer[amountForEachPayer.length - 1] += difference;
  }

  return amountForEachPayer;
};

/**
 * @param {Object} deposit
 * @param {string} deposit._id
 * @param {number} deposit.amount
 * @param {number} deposit.amount_paid
 * @param {number} deposit.remaining_amount
 * @returns {Object}
 */
const PrepareToPayDeposit = (deposit, paidAmount) => {
  //*************** if deposit already paid then return back the paid amount
  if (deposit.amount_paid === deposit.amount) {
    return {
      remainder: parseFloat(paidAmount).toFixed(2),
      updatedDeposit: null,
    };
  }

  const isPaid = paidAmount - deposit.remaining_amount >= 0;
  const paymentStatus = isPaid ? 'paid' : 'partial_paid';

  const amountPaid =
    paidAmount > deposit.remaining_amount ? parseFloat(deposit.amount).toFixed(2) : parseFloat(deposit.amount_paid + paidAmount).toFixed(2);

  const remainingAmountToBePaid =
    paidAmount - deposit.remaining_amount < 0 ? parseFloat(Math.abs(paidAmount - deposit.remaining_amount)).toFixed(2) : 0;

  const remainder = paidAmount - deposit.remaining_amount > 0 ? parseFloat(paidAmount - deposit.remaining_amount).toFixed(2) : 0;

  return {
    remainder,
    updatedDeposit: {
      _id: deposit._id,
      payment_status: paymentStatus,
      amount_paid: amountPaid,
      remaining_amount: remainingAmountToBePaid,
    },
  };
};

/**
 * @param {Array} terms - Array of term objects
 * @param {number} paidAmount - The amount that has been paid
 * @returns {Object[]} - An arrya of object containing the array of terms that need to be updated
 */
const PrepareToPayTerms = (terms, paidAmount) => {
  let remainder = parseFloat(paidAmount).toFixed(2);
  const termsToUpdate = [];

  for (let i = 0; i < terms.length; i++) {
    //*************** can only pay term if remaining amount is still and the remainder greater than zero
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

      termsToUpdate.push({
        _id: terms[i]._id,
        payment_status: paymentStatus,
        amount_paid: amountPaid,
        remaining_amount: remainingAmountToBePaid,
      });
    }
  }

  return termsToUpdate;
};

/**
 * @param {Array<Object>} terms - Array of term objects
 * @param {string} terms._id - The ID of the term
 * @param {number} terms.amount - The total amount of the term
 * @param {number} terms.amount_paid - The amount that has been paid
 * @param {number} terms.remaining_amount - The remaining amount to be paid
 * @param {number} removedAmount - The amount to be removed from the paid amount
 * @returns {Object[]} - An array of object containing the array of terms that need to be updated
 */
const PrepareTermAmountRemoval = (terms, removedAmount) => {
  let remainder = parseFloat(removedAmount).toFixed(2);
  const termsToUpdate = [];

  //*************** remove term amount from back or latest
  for (let i = terms.length - 1; i >= 0; i--) {
    //*************** can only remove term if paid amount is still and the remainder greater than zero
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

      termsToUpdate.push({
        _id: terms[i]._id,
        payment_status: paymentStatus,
        amount_paid: newAmountPaid,
        remaining_amount: remainingAmountToBePaid,
      });
    }
  }

  return termsToUpdate;
};

/**
 * @param {string} from - The name of the collection to perform the $lookup on.
 * @param {string} localField - The local field to perform the $lookup with.
 * @param {string} foreignField - The foreign field to perform the $lookup with.
 * @param {string} as - The name of the new array field to add to the input documents.
 * @param {boolean} unwind - If this true then unwind
 * @returns {Array<{ $lookup: { from: string, localField: string, foreignField: string, as: string } } | { $unwind: { path: string, preserveNullAndEmptyArrays: boolean } }>}
 */
const CreateLookupPipelineStage = (from, localField, foreignField, as, unwind = false) => {
  //*************** Create $lookup stage
  const lookupStage = {
    $lookup: {
      from,
      localField,
      foreignField,
      as,
    },
  };

  //*************** Create $unwind stage
  let unwindStage = {};
  if (unwind) {
    unwindStage.$unwind = {
      path: `$${as}`,
      preserveNullAndEmptyArrays: true,
    };
  }

  return unwind ? [lookupStage, unwindStage] : [lookupStage];
};

/**
 * @param {string} field1
 * @param {string} field2
 * @param {string} separator
 * @returns {{$concat: Array<string>}}
 */
const CreateConcatPipelineStage = (field1, field2, separator = ' ') => {
  return { $concat: [field1, separator, field2] };
};

/**
 * @param {Object} filter
 * @param {string} filter.student_full_name
 * @param {string} filter.payer_full_name
 * @param {number} filter.termination
 * @returns {object}
 */
const CreateMatchPipelineStage = (filter) => {
  const matchStage = {};
  if (filter) {
    if (filter.student_full_name) {
      matchStage.student_full_name = { $regex: filter.student_full_name, $options: 'i' };
    }

    if (filter.payer_full_name) {
      matchStage.payer_full_name = { $regex: filter.payer_full_name, $options: 'i' };
    }

    if (filter.termination) {
      matchStage['termination_of_payment.termination'] = filter.termination;
    }
  }

  return matchStage;
};

/**
 * @param {Object} sort
 * @param {string} sort.student_full_name
 * @param {string} sort.payer_full_name
 * @param {number} sort.termination
 * @returns {object}
 */
const CreateSortPipelineStage = (sort) => {
  try {
    const sortStage = {};
    if (sort) {
      if (sort.student_full_name) {
        if (!IsSortingInput(sort.student_full_name)) {
          throw new Error('the sorting input must be 1 for ascending or -1 for descending');
        }

        sortStage.student_full_name = sort.student_full_name;
      }

      if (sort.payer_full_name) {
        if (!IsSortingInput(sort.payer_full_name)) {
          throw new Error('the sorting input must be 1 for ascending or -1 for descending');
        }

        sortStage.payer_full_name = sort.payer_full_name;
      }

      if (sort.termination) {
        if (!IsSortingInput(sort.termination)) {
          throw new Error('the sorting input must be 1 for ascending or -1 for descending');
        }

        sortStage['termination_of_payment.termination'] = sort.termination;
      }
    }

    return sortStage;
  } catch (error) {
    throw new Error(`CreateSortPipelineStage error: ${error.message}`);
  }
};

// *************** EXPORT MODULE ***************
module.exports = {
  CheckIfStudentHasBillingOrNot,
  FindBillingWithLookup,
  FindStudentDepositBilling,
  GenerateBillingData,
  PrepareToPayDeposit,
  PrepareToPayTerms,
  PrepareTermAmountRemoval,
  CreateConcatPipelineStage,
  CreateLookupPipelineStage,
  CreateMatchPipelineStage,
  CreateSortPipelineStage,
};
