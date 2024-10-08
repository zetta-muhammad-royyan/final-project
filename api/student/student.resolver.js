// *************** IMPORT MODULE ***************
const FinancialSupport = require('../financial_support/financial_support.model');
const Student = require('../student/student.model');
const financialSupportLoader = require('../financial_support/financial_support.loader');
const registrationProfileLoader = require('../registration_profile/registration_profile.loader');

// *************** IMPORT HELPER FUNCTION ***************
const { PrepareFinancialSupportData } = require('../financial_support/financial_support.helper');
const {
  CreateLookupPipelineStage,
  CreateConcatPipelineStage,
  CreateSortPipelineStage,
  CreateMatchPipelineStage,
  CheckIfStudentUsedByBilling,
} = require('./student.helper');

// *************** IMPORT UTILITIES ***************
const { CheckObjectId, ConvertToObjectId } = require('../../utils/mongoose.utils');
const { TrimString } = require('../../utils/string.utils');
const { IsUndefinedOrNull, IsEmptyString, IsNull } = require('../../utils/sanity.utils');

// *************** IMPORT VALIDATOR ***************
const { ValidatePagination, ValidateStudentInput } = require('./student.validator');

// *************** QUERY ***************

/**
 * Retrieve all RegistrationProfiles with optional filter and sorting
 * @param {Object} _parent
 * @param {Object} args
 * @param {Object} args.filter
 * @param {String} args.filter.student_full_name
 * @param {String} args.filter.registration_profile_id
 * @param {String} args.filter.financial_support_full_name
 * @param {Object} args.sort
 * @param {String} args.sort.registration_profile_name
 * @param {String} args.sort.financial_support_full_name
 * @param {Object} args.pagination
 * @param {Int} args.pagination.page
 * @param {Int} args.pagination.limit
 * @param {Object} context
 * @param {Object} context.models
 * @returns {Promise<Object>}
 */
const GetAllStudents = async (_parent, { filter, sort, pagination }) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    ValidatePagination(page, limit);

    //*************** base pipeline
    const pipeline = [{ $match: { status: 'active' } }];

    // *************** check if need to lookup to registration profile or not
    let needsToRegistrationProfileLookup = sort && sort.registration_profile_name;

    // *************** check if need to lookup to financial support or not
    let needsFinancialSupportLookup = filter && filter.financial_support_full_name ? true : false;
    if (sort && sort.financial_support_full_name) {
      needsFinancialSupportLookup = true;
    }

    // *************** if the sort based on registration_profile_name, need lookup first
    if (needsToRegistrationProfileLookup) {
      const lookupRegistationProfileStages = CreateLookupPipelineStage(
        'registration_profiles',
        'registration_profile_id',
        '_id',
        'registration_profile'
      );
      pipeline.push(...lookupRegistationProfileStages);
    }

    // *************** if the filter based on financial_support_full_name, need lookup first
    if (needsFinancialSupportLookup) {
      const lookupFinancialSupportStages = CreateLookupPipelineStage(
        'financial_supports',
        'financial_support_ids',
        '_id',
        'financial_supports'
      );
      pipeline.push(...lookupFinancialSupportStages);
    }

    // *************** add field if need concatenated name
    const addFieldStage = {
      $addFields: {},
    };

    //*************** concat student name if filter.student_full_name exist
    if (filter && filter.student_full_name) {
      const concatenatedStudentName = CreateConcatPipelineStage('$first_name', '$last_name');
      addFieldStage.$addFields.student_full_name = concatenatedStudentName;
    }

    //*************** concat financial support name if filter or sort based on financial_support_full_name
    if (needsFinancialSupportLookup && ((filter && filter.financial_support_full_name) || (sort && sort.financial_support_full_name))) {
      const concatenatedFinancialSupportName = CreateConcatPipelineStage('$financial_supports.first_name', '$financial_supports.last_name');
      addFieldStage.$addFields.financial_support_full_name = concatenatedFinancialSupportName;
    }

    //*************** push to pipeline if $addField has concatenated field
    if (Object.keys(addFieldStage.$addFields).length > 0) {
      pipeline.push(addFieldStage);
    }

    // *************** sort stage
    const sortStage = CreateSortPipelineStage(sort);
    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    // *************** match stage
    const matchStage = CreateMatchPipelineStage(filter);
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // *************** pagination stage
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    // *************** project stage
    pipeline.push({
      $project: {
        _id: 1,
        civility: 1,
        first_name: 1,
        last_name: 1,
        financial_support_ids: 1,
        registration_profile_id: 1,
        financial_supports: 1,
        financial_support_full_name: 1,
        student_full_name: 1,
      },
    });

    //*************** fetch student using previously built pipeline
    const students = await Student.aggregate(pipeline);
    return students;
  } catch (error) {
    throw new Error(`Failed to fetch all Student: ${error.message}`);
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
const GetOneStudent = async (_parent, args) => {
  try {
    CheckObjectId(args._id);

    //*************** fetch student using id
    const student = await Student.findOne({ _id: ConvertToObjectId(args._id), status: 'active' });
    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  } catch (error) {
    throw new Error(`Failed to fetch Student by Id: ${error.message}`);
  }
};

// *************** MUTATION ***************

/**
 * Create new Student
 * @param {Object} _parent
 * @param {Object} args
 * @param {String} args.civility
 * @param {String} args.first_name
 * @param {String} args.last_name
 * @param {String} args.registration_profile_id
 * @param {Array<Object>} args.financial_support
 * @param {String} args.financial_support.civility
 * @param {String} args.financial_support.first_name
 * @param {String} args.financial_support.last_name
 * @param {Object} context
 * @param {Object} context.models
 * @returns {Promise<Object>}
 */
const CreateStudent = async (_parent, args) => {
  try {
    ValidateStudentInput(args.civility, args.first_name, args.last_name);

    //*************** create new student
    const newStudent = new Student({
      civility: args.civility,
      first_name: TrimString(args.first_name),
      last_name: TrimString(args.last_name),
      registration_profile_id: args.registration_profile_id,
    });

    let createdStudent = await newStudent.save();

    //*************** prepare financial support data to add, replace or delete it later
    const financialSupportData = PrepareFinancialSupportData(createdStudent, args.financial_support);

    //*************** if no one data to be inserted then just return new created student
    if (financialSupportData.newFinancialSupportsData.length === 0) {
      return createdStudent;
    }

    //*************** if theres any financialSupport to be deleted
    if (financialSupportData.idsToDelete.length > 0) {
      await FinancialSupport.deleteMany({ _id: { $in: financialSupportData.idsToDelete } });
    }

    // *************** if any financial support then insert and update student with new FS id
    let financialSupportIds = [];
    if (financialSupportData.newFinancialSupportsData.length > 0) {
      //*************** from inserted docs then only get the id
      const insertedDocs = await FinancialSupport.insertMany(financialSupportData.newFinancialSupportsData, { lean: true });
      financialSupportIds = insertedDocs.map((doc) => doc._id);
    }

    //*************** update student financial_support_ids
    createdStudent.financial_support_ids = financialSupportIds;

    const updatedStudent = await createdStudent.save();

    return updatedStudent;
  } catch (error) {
    throw new Error(`Failed to create Student: ${error.message}`);
  }
};

/**
 * Update Existing Student
 * @param {Object} _parent
 * @param {Object} args
 * @param {String} args._id
 * @param {String} args.civility
 * @param {String} args.first_name
 * @param {String} args.last_name
 * @param {String} args.registration_profile_id
 * @param {Array<Object>} args.financial_support
 * @param {String} args.financial_support.civility
 * @param {String} args.financial_support.first_name
 * @param {String} args.financial_support.last_name
 * @param {Object} context
 * @param {Object} context.models
 * @returns {Promise<Object>}
 */
const UpdateStudent = async (_parent, args) => {
  try {
    if (IsEmptyString(args.first_name)) {
      throw new Error('student first name cannot be empty string');
    }

    if (IsEmptyString(args.last_name)) {
      throw new Error('student last name cannot be empty string');
    }

    CheckObjectId(args._id);

    //*************** fetch student
    const student = await Student.findById(args._id);
    if (!student) {
      throw new Error('Student not found');
    }

    //*************** check if student already used by billinng or not
    const usedByBilling = await CheckIfStudentUsedByBilling(args._id);
    if (usedByBilling) {
      //*************** throw error if user want to edit financial support or regisration profile
      if (
        !IsUndefinedOrNull(args.financial_support) ||
        (Array.isArray(args.financial_support) && args.financial_support.length > 0) ||
        !IsUndefinedOrNull(args.registration_profile_id)
      ) {
        throw new Error('cannot update financial support or registration profile if billing already generated for this student');
      }

      //*************** can only update civily, firs_name, last_name if student already used by billing
      student.civility = args.civility ? args.civility : student.civility;
      student.first_name = args.first_name ? TrimString(args.first_name) : student.first_name;
      student.last_name = args.last_name ? TrimString(args.last_name) : student.last_name;

      const updatedStudent = await student.save();
      return updatedStudent;
    }

    //*************** prepare financial support data to add, replace or delete it later
    const financialSupportData = await PrepareFinancialSupportData(student, args.financial_support);

    //*************** if theres any financialSupport to be deleted
    if (financialSupportData.idsToDelete.length > 0) {
      await FinancialSupport.updateMany(
        { _id: { $in: financialSupportData.idsToDelete }, status: 'active' },
        { $set: { status: 'deleted' } }
      );
    }

    // *************** if any financial support then insert and update student with new FS id
    let financialSupportIds = [];
    if (financialSupportData.newFinancialSupportsData.length > 0) {
      //*************** from the inserted docs only get the id
      const insertedDocs = await FinancialSupport.insertMany(financialSupportData.newFinancialSupportsData, { lean: true });
      financialSupportIds = insertedDocs.map((doc) => doc._id);
    }

    //*************** determine if student financial support is updated with new data, replaced with empty array, or use previous data
    const newFinancialSupportIds = IsNull(args.financial_support) ? student.financial_support_ids : financialSupportIds;

    // *************** Update student with new data if provided
    student.civility = args.civility ? args.civility : student.civility;
    student.first_name = args.first_name ? TrimString(args.first_name) : student.first_name;
    student.last_name = args.last_name ? TrimString(args.last_name) : student.last_name;
    student.financial_support_ids = newFinancialSupportIds;
    student.registration_profile_id = args.registration_profile_id ? args.registration_profile_id : student.registration_profile_id;

    const updatedStudent = await student.save();

    return updatedStudent;
  } catch (error) {
    throw new Error(`Failed to update Student: ${error.message}`);
  }
};

/**
 * Delete student
 * @param {Object} _parent
 * @param {Object} args
 * @param {String} args._id
 * @param {Object} context
 * @param {Object} contex.models
 * @returns {Promise<String>}
 */
const DeleteStudent = async (_parent, args) => {
  try {
    CheckObjectId(args._id);

    //*************** cannot update registration profile if already used by billing
    const usedByBilling = await CheckIfStudentUsedByBilling(args._id);
    if (usedByBilling) {
      throw new Error('cannot delete student because already used by billing');
    }

    const deletedStudent = await Student.findOneAndUpdate({ _id: ConvertToObjectId(args._id), status: 'active' }, { status: 'deleted' });
    if (!deletedStudent) {
      throw new Error('Student not found');
    }

    // *************** Delete student financial supports if any
    if (deletedStudent.financial_support_ids.length > 0) {
      await FinancialSupport.updateMany(
        { _id: { $in: deletedStudent.financial_support_ids }, status: 'active' },
        { $set: { status: 'deleted' } }
      );
    }

    return 'Student deleted successfully';
  } catch (error) {
    throw new Error(`Failed to delete Student: ${error.message}`);
  }
};

// *************** LOADER ***************

/**
 * Fetches the financial support details for the given parent object's `financial_support_ids`.
 * @function financial_supports
 * @param {Object} parent - The parent object containing the `financial_support_ids`.
 * @param {Object} _args - Arguments provided by GraphQL resolver, not used in this function.
 * @param {Object} context - The context object, which contains various loaders.
 * @param {Object} context.loaders - The loaders object containing DataLoader instances.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of financial support details loaded by DataLoader.
 */
const GetFinancialSupports = (parent, _args) => {
  return financialSupportLoader.loadMany(parent.financial_support_ids);
};

/**
 * Fetches the registration profile details for the given parent object's `registration_profile_id`.
 * @function registration_profile
 * @param {Object} parent - The parent object containing the `registration_profile_id`.
 * @param {Object} _args - Arguments provided by GraphQL resolver, not used in this function.
 * @param {Object} context - The context object, which contains various loaders.
 * @param {Object} context.loaders - The loaders object containing DataLoader instances.
 * @returns {Promise<Object>} A promise that resolves to the registration profile details loaded by DataLoader.
 */
const GetRegistrationProfile = (parent, _args) => {
  return registrationProfileLoader.load(parent.registration_profile_id);
};

const studentResolver = {
  Query: {
    GetAllStudents,
    GetOneStudent,
  },

  Mutation: {
    CreateStudent,
    UpdateStudent,
    DeleteStudent,
  },

  Student: {
    financial_supports: GetFinancialSupports,
    registration_profile: GetRegistrationProfile,
  },
};

// *************** EXPORT MODULE ***************
module.exports = studentResolver;
