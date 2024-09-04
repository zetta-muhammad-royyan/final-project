// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const student = gql`
  # schemas
  type Student {
    _id: ID!
    civility: String!
    first_name: String!
    last_name: String!
    financial_supports: [FinancialSupport]!
    registration_profile: RegistrationProfile!
  }

  # input
  input StudentFilterInput {
    student_full_name: String
    registration_profile_id: ID
    financial_support_full_name: String
  }

  input StudentSortInput {
    registration_profile_name: Int
    registration_profile_id: Int
    financial_support_full_name: Int
  }

  input StudentPaginationInput {
    page: Int!
    limit: Int!
  }

  #enums
  enum StudentCivility {
    mr
    mrs
    neutral
  }

  # queries
  type Query {
    GetAllStudents(filter: StudentFilterInput, sort: StudentSortInput, pagination: StudentPaginationInput): [Student]!
    GetOneStudent(_id: ID!): Student
  }

  # mutations
  type Mutation {
    CreateStudent(
      civility: StudentCivility!
      first_name: String!
      last_name: String!
      financial_support: [FinancialSupportInput]
      registration_profile_id: ID!
    ): Student!
    UpdateStudent(
      _id: ID!
      civility: StudentCivility
      first_name: String
      last_name: String
      financial_support: [FinancialSupportInput]
      registration_profile_id: ID
    ): Student!
    DeleteStudent(_id: ID!): String!
  }
`;

// *************** EXPORT MODULE ***************
module.exports = student;
