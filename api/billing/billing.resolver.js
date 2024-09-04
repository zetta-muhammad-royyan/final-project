// *************** IMPORT MODULE ***************
const Billing = require('./billing.model');
const Term = require('../term/term.model');
const Deposit = require('../deposit/deposit.model');
const Student = require('../student/student.model');
const RegistrationProfile = require('../registration_profile/registration_profile.model');
const TerminationOfPayment = require('../termination_of_payment/termination_of_payment.model');
const studentLoader = require('../student/student.loader');
const registrationProfileLoader = require('../registration_profile/registration_profile.loader');
const termLoader = require('../term/term.loader');
const depositLoader = require('../deposit/deposit.loader');
const financialSupportLoader = require('../financial_support/financial_support.loader');

// *************** IMPORT UTILITIES ***************
const { CheckObjectId, ConvertToObjectId } = require('../../utils/mongoose.utils');
const { AmountMustHaveMaxTwoDecimal, AmountMustGreaterThanZero } = require('../../utils/monetary.utils');
const { IsUndefinedOrNull } = require('../../utils/sanity.utils');

// *************** IMPORT HELPER FUNCTION ***************
const {
  CheckIfStudentHasBillingOrNot,
  FindBillingWithLookup,
  GenerateBillingData,
  PrepareToPayDeposit,
  PrepareToPayTerms,
  PrepareTermAmountRemoval,
  CreateConcatPipelineStage,
  CreateLookupPipelineStage,
  CreateMatchPipelineStage,
  CreateSortPipelineStage,
} = require('./billing.helper');

// *************** IMPORT VALIDATOR ***************
const { ValidatePayer, ValidatePagination } = require('./billing.validator');

// *************** QUERY ***************

/**
 * @param {Object} _parent
 * @param {Object} args
 * @param {Object} args.filter
 * @param {String} args.filter.student_full_name
 * @param {String} args.filter.payer_full_name
 * @param {Number} args.filter.termination
 * @param {Object} args.sort
 * @param {Number} args.sort.student_full_name
 * @param {Number} args.sort.payer_full_name
 * @param {Number} args.sort.termination
 * @param {Object} args.pagination
 * @param {Int} args.pagination.page
 * @param {Int} args.pagination.limit
 * @returns {Promise<Object>}
 */
const GetAllBillings = async (_parent, { filter, sort, pagination }) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    ValidatePagination(page, limit);

    //*************** base pipeline
    const pipeline = [];

    //*************** check if need to lookup to student collection
    const needToStudentLookup = (filter && filter.student_full_name) || (sort && sort.student_full_name);

    //*************** check if need to lookup to payer (can be student or financial support)
    const needToPayerLookup = (filter && filter.payer_full_name) || (sort && sort.payer_full_name);

    //*************** check if need to lookup to termination of payment
    const needToTerminationOfPaymentLookup = (filter && filter.termination) || (sort && sort.termination);

    // *************** add field if need concatenated name
    const addFieldStage = {
      $addFields: {},
    };

    if (needToStudentLookup) {
      //*************** lookup to student collection
      const studentLookupStage = CreateLookupPipelineStage('students', 'student_id', '_id', 'student', true);
      pipeline.push(...studentLookupStage);

      //*************** concat student name for filtering or sorting purpose
      const concatenatedStudentName = CreateConcatPipelineStage('$student.first_name', '$student.last_name');
      addFieldStage.$addFields.student_full_name = concatenatedStudentName;
    }

    if (needToPayerLookup) {
      //*************** if payer is student
      const payerIsStudentLookupStage = CreateLookupPipelineStage('students', 'payer', '_id', 'payer_student');
      pipeline.push(...payerIsStudentLookupStage);

      //*************** if payer is financial support
      const payerIsFinancialSupportLookupStage = CreateLookupPipelineStage('financial_supports', 'payer', '_id', 'payer_financial_support');
      pipeline.push(...payerIsFinancialSupportLookupStage);

      //*************** conditional concatenatted payer full name based on payer (student or financial support)
      addFieldStage.$addFields.payer_full_name = {
        $cond: {
          if: { $gt: [{ $size: '$payer_student' }, 0] },
          then: { $concat: [{ $arrayElemAt: ['$payer_student.first_name', 0] }, ' ', { $arrayElemAt: ['$payer_student.last_name', 0] }] },
          else: {
            $concat: [
              { $arrayElemAt: ['$payer_financial_support.first_name', 0] },
              ' ',
              { $arrayElemAt: ['$payer_financial_support.last_name', 0] },
            ],
          },
        },
      };
    }

    if (needToTerminationOfPaymentLookup) {
      //*************** lookup to registration profile collection
      const registrationProfileLookupStage = CreateLookupPipelineStage(
        'registration_profiles',
        'registration_profile_id',
        '_id',
        'registration_profile',
        true
      );
      pipeline.push(...registrationProfileLookupStage);

      //*************** after get registration profile then lookup to termination of payment
      const terminationOfPaymentLookupStage = CreateLookupPipelineStage(
        'termination_of_payments',
        'registration_profile.termination_of_payment_id',
        '_id',
        'termination_of_payment',
        true
      );
      pipeline.push(...terminationOfPaymentLookupStage);
    }

    //*************** push $addField stage to pipeline if contain any additional field
    if (Object.keys(addFieldStage.$addFields).length > 0) {
      pipeline.push(addFieldStage);
    }

    //*************** filtering based on existing params
    const matchStage = CreateMatchPipelineStage(filter);
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    //*************** sorting based on existing params
    const sortStage = CreateSortPipelineStage(sort);
    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    // *************** pagination stage
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    const billings = await Billing.aggregate(pipeline);
    return billings;
  } catch (error) {
    throw new Error(`Failed to fetch all billings: ${error.message}`);
  }
};

/**
 * Get one student document by id
 * @param {Object} _parent
 * @param {Object} args
 * @param {string} args._id
 * @param {Object} context
 * @param {Object} context.models
 */
const GetOneBilling = async (_parent, args) => {
  try {
    CheckObjectId(args._id);

    const billing = Billing.findById(args._id);
    if (!billing) {
      throw new Error('Billing not found');
    }

    return billing;
  } catch (error) {
    throw new Error(`Failed to fetch billing by id: ${error.message}`);
  }
};

// *************** MUTATION ***************

/**
 * Generate billing
 * @param {Object} _parent
 * @param {Object} args
 * @param {String} args.student_id
 * @param {String} args.payment_type
 * @param {Array<Object>} args.payer
 * @param {String} args.payer.payer_id
 * @param {Number} args.payer.cost_coverage
 * @param {Object} context
 * @param {Object} context.models
 * @returns {Promise<Array<Object>>}
 */
const GenerateBilling = async (_parent, args) => {
  // *************** Student who has billing cannot generate billing again
  await CheckIfStudentHasBillingOrNot(args.student_id);

  // *************** Check student_id valid or not
  CheckObjectId(args.student_id);

  // *************** Fetch required data
  const student = await Student.findOne({ _id: args.student_id });
  if (!student) {
    throw new Error('Student not found');
  }

  const registrationProfile = await RegistrationProfile.findOne({ _id: student.registration_profile_id });
  if (!registrationProfile) {
    throw new Error('Registration Profile not found');
  }

  const terminationOfPayment = await TerminationOfPayment.findOne({ _id: registrationProfile.termination_of_payment_id });
  if (!terminationOfPayment) {
    throw new Error('Termination of Payment not found');
  }

  // *************** Calculate totalAmount and termAmount
  const totalAmount = registrationProfile.scholarship_fee + registrationProfile.registration_fee + terminationOfPayment.additional_cost;
  const termAmount = totalAmount - registrationProfile.deposit;

  // *************** validate payer
  const validatedPayer = await ValidatePayer(args.payer, args.payment_type, student);

  //*************** generate billing data according to the number of payers
  const billings = await GenerateBillingData(
    args.student_id,
    registrationProfile._id,
    validatedPayer,
    terminationOfPayment.term_payments,
    totalAmount,
    termAmount,
    registrationProfile.deposit
  );

  const allBillingEntries = [];
  const allTermEntries = [];
  const allDepositEntries = [];

  for (let billing of billings) {
    //*************** create Billing Entry
    const newBilling = {
      student_id: billing.student_id,
      registration_profile_id: billing.registration_profile_id,
      payer: billing.payer,
      total_amount: billing.total_amount,
      paid_amount: 0,
      remaining_due: billing.remaining_due,
    };

    allBillingEntries.push(newBilling);
  }

  //*************** insert all billings at once
  const createdBillings = await Billing.insertMany(allBillingEntries);

  //*************** prepare terms and deposits
  createdBillings.forEach((createdBilling, index) => {
    const billing = billings[index];

    //*************** prepare Terms with the correct billing ID
    if (billing.term_data) {
      const terms = billing.term_data.map((term) => ({
        ...term,
        billing_id: createdBilling._id,
      }));
      allTermEntries.push(...terms);
    }

    //*************** prepare Deposit with the correct billing ID
    if (billing.deposit_data) {
      const deposit = {
        ...billing.deposit_data,
        billing_id: createdBilling._id,
      };
      allDepositEntries.push(deposit);
    }
  });

  //*************** insert all terms and deposits in one go
  let insertedTerms = [];
  if (allTermEntries.length > 0) {
    insertedTerms = await Term.insertMany(allTermEntries);
  }

  let insertedDeposit = [];
  if (allDepositEntries.length > 0) {
    insertedDeposit = await Deposit.insertMany(allDepositEntries);
  }

  // Update Billings with term_ids and deposit_id
  const updateQueries = [];

  insertedTerms.forEach((term) => {
    updateQueries.push({
      updateOne: {
        filter: { _id: term.billing_id },
        update: { $addToSet: { term_ids: term._id } },
      },
    });
  });

  insertedDeposit.forEach((deposit) => {
    updateQueries.push({
      updateOne: {
        filter: { _id: deposit.billing_id },
        update: { $set: { deposit_id: deposit._id } },
      },
    });
  });

  if (updateQueries.length > 0) {
    await Billing.bulkWrite(updateQueries);
  }

  //*************** combine inserted term and document with billing, then can load using dataloader
  const updatedBilling = createdBillings.map((billing) => {
    const billingObject = billing.toObject();
    const termIds = insertedTerms.filter((term) => term.billing_id.equals(billingObject._id)).map((term) => term._id);
    const deposit = insertedDeposit.find((deposit) => deposit.billing_id.equals(billingObject._id));

    return {
      ...billingObject,
      term_ids: termIds,
      deposit_id: deposit ? deposit._id : null,
    };
  });

  return updatedBilling;
};

/**
 * @param {Object} _parent
 * @param {Object} args
 * @param {string} args.billing_id
 * @param {number} args.amount
 * @param {Object} context
 * @param {Object} context.models
 */
const AddPayment = async (_parent, args) => {
  try {
    CheckObjectId(args.billing_id);

    //*************** only two decimal allowed
    AmountMustHaveMaxTwoDecimal(args.amount);

    //*************** amount must be greater than zero
    AmountMustGreaterThanZero(args.amount);

    const billing = await FindBillingWithLookup({ billingId: args.billing_id }, ['term', 'deposit']);
    if (!billing) {
      throw new Error('Billing not found');
    }

    //*************** amount cannot be greater than remaining amount
    if (args.amount > billing.remaining_due) {
      throw new Error('the amount to be paid is more than it should be');
    }

    //*************** billing hold deposit amount
    if (billing.deposit_id) {
      //*************** pay deposit first
      const { remainder, updatedDeposit } = await PrepareToPayDeposit(billing.deposit[0], args.amount);
      if (!IsUndefinedOrNull(updatedDeposit)) {
        await Deposit.updateOne(
          { _id: ConvertToObjectId(updatedDeposit._id) },
          {
            payment_status: updatedDeposit.payment_status,
            amount_paid: updatedDeposit.amount_paid,
            remaining_amount: updatedDeposit.remaining_amount,
          }
        );
      }

      //*************** if remainder amount more than 0 then pay the terms
      const updatedTerms = PrepareToPayTerms(billing.terms, remainder);
      const bulkOperations = updatedTerms.map((term) => ({
        updateOne: {
          filter: { _id: term._id },
          update: {
            $set: {
              payment_status: term.payment_status,
              amount_paid: term.amount_paid,
              remaining_amount: term.remaining_amount,
            },
          },
        },
      }));

      if (bulkOperations.length > 0) {
        await Term.bulkWrite(bulkOperations);
      }
    } else {
      //*************** if billing doesnt hold deposit amount then fetch another student billing
      const billings = await FindBillingWithLookup({ studentId: billing.student_id }, ['term', 'deposit']);
      const depositBilling = billings.find((billing) => billing.deposit_id);
      if (!depositBilling) {
        throw new Error('this student doesnt have deposit billing');
      }

      //*************** deposit must be paid first before pay term
      if (depositBilling.deposit.reduce((acc, curr) => acc + curr.remaining_amount, 0) > 0) {
        throw new Error('must pay the deposit first');
      }

      //*************** deposit on another billing already paid then pay the terms
      const updatedTerms = PrepareToPayTerms(billing.terms, args.amount);
      const bulkOperations = updatedTerms.map((term) => ({
        updateOne: {
          filter: { _id: term._id },
          update: {
            $set: {
              payment_status: term.payment_status,
              amount_paid: term.amount_paid,
              remaining_amount: term.remaining_amount,
            },
          },
        },
      }));

      if (bulkOperations.length > 0) {
        await Term.bulkWrite(bulkOperations);
      }
    }

    const paidAmount =
      args.amount > billing.remaining_due
        ? parseFloat(args.amount).toFixed(2)
        : (parseFloat(billing.paid_amount) + parseFloat(args.amount)).toFixed(2);

    const remainingDue =
      args.amount - billing.remaining_due < 0
        ? Math.abs(parseFloat(args.amount) - parseFloat(billing.remaining_due)).toFixed(2)
        : parseFloat(0).toFixed(2);

    const updatedBilling = await Billing.findByIdAndUpdate(
      billing._id,
      {
        paid_amount: paidAmount,
        remaining_due: remainingDue,
      },
      { new: true }
    );

    return updatedBilling;
  } catch (error) {
    throw new Error(`Failed to add payment: ${error.message}`);
  }
};

/**
 * @param {Object} _parent
 * @param {Object} args
 * @param {string} args.billing_id
 * @param {number} args.amount
 * @param {Object} context
 * @param {Object} context.models
 */
const RemovePayment = async (_parent, args) => {
  try {
    CheckObjectId(args.billing_id);

    //*************** only two decimal allowed
    AmountMustHaveMaxTwoDecimal(args.amount);

    //*************** amount must be greater than zero
    AmountMustGreaterThanZero(args.amount);

    const billing = await FindBillingWithLookup({ billingId: args.billing_id }, ['term']);
    if (!billing) {
      throw new Error('Billing not found');
    }

    //*************** can only remove term amount cannot remove deposit amount
    const maxAmountToBeRemoved = billing.terms.reduce((acc, curr) => acc + curr.amount_paid, 0);
    if (args.amount > maxAmountToBeRemoved) {
      throw new Error('cannot remove amount greater than paid amount and only can remove term amount, cannot remove deposit amount');
    }

    //*************** remove paid term amount
    const updatedTerms = PrepareTermAmountRemoval(billing.terms, args.amount);
    const bulkOperations = updatedTerms.map((term) => ({
      updateOne: {
        filter: { _id: term._id },
        update: {
          $set: {
            payment_status: term.payment_status,
            amount_paid: term.amount_paid,
            remaining_amount: term.remaining_amount,
          },
        },
      },
    }));

    if (bulkOperations.length > 0) {
      await Term.bulkWrite(bulkOperations);
    }

    const paidAmount =
      args.amount >= billing.paid_amount
        ? parseFloat(0).toFixed(2)
        : (parseFloat(billing.paid_amount) - parseFloat(args.amount)).toFixed(2);

    const remainingDue =
      args.amount >= billing.paid_amount
        ? parseFloat(billing.total_amount).toFixed(2)
        : (parseFloat(billing.remaining_due) + parseFloat(args.amount)).toFixed(2);

    const updatedBilling = await Billing.findByIdAndUpdate(
      billing._id,
      {
        paid_amount: paidAmount,
        remaining_due: remainingDue,
      },
      { new: true }
    );

    return updatedBilling;
  } catch (error) {
    throw new Error(`Failed to remove payment: ${error.message}`);
  }
};

// *************** LOADER ***************

/**.
 * @function student
 * @param {Object} parent
 * @param {Object} _args
 * @param {Object} context
 * @param {Object} context.loaders
 * @returns {Promise<Object>}
 */
const GetStudent = async (parent, _args) => {
  return studentLoader.load(parent.student_id);
};

/**.
 * @function registration_profile
 * @param {Object} parent
 * @param {Object} _args
 * @param {Object} context
 * @param {Object} context.loaders
 * @returns {Promise<Object>}
 */
const GetRegistrationProfile = async (parent, _args) => {
  return registrationProfileLoader.load(parent.registration_profile_id);
};

/**.
 * @function terms
 * @param {Object} parent
 * @param {Object} _args
 * @param {Object} context
 * @param {Object} context.loaders
 * @returns {Promise<Object>}
 */
const GetTerms = async (parent, _args) => {
  if (!parent.term_ids || parent.term_ids.length < 1) {
    return [];
  }

  return termLoader.loadMany(parent.term_ids);
};

/**.
 * @function deposit
 * @param {Object} parent
 * @param {Object} _args
 * @param {Object} context
 * @param {Object} context.loaders
 * @returns {Promise<Object>}
 */
const GetDeposit = async (parent, _args) => {
  if (!parent.deposit_id) {
    return null;
  }

  return depositLoader.load(parent.deposit_id);
};

/**.
 * @function deposit
 * @param {Object} parent
 * @param {Object} _args
 * @param {Object} context
 * @param {Object} context.loaders
 * @returns {Promise<Object>}
 */
const GetPayer = async (parent, _args) => {
  if (!parent.payer) {
    return null;
  }

  const [student, financialSupport] = await Promise.all([studentLoader.load(parent.payer), financialSupportLoader.load(parent.payer)]);

  if (student) {
    return student;
  } else if (financialSupport) {
    return financialSupport;
  }
};

const billingResolver = {
  Query: {
    GetAllBillings,
    GetOneBilling,
  },

  Mutation: {
    GenerateBilling,
    AddPayment,
    RemovePayment,
  },

  Billing: {
    student: GetStudent,
    registration_profile: GetRegistrationProfile,
    terms: GetTerms,
    deposit: GetDeposit,
    payer: GetPayer,
  },
};

// *************** EXPORT MODULE ***************
module.exports = billingResolver;
