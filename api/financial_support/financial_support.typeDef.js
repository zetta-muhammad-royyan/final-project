// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const financialSupport = gql`
  # schemas
  type FinancialSupport {
    _id: ID!
    civility: String!
    first_name: String!
    last_name: String!
    student_id: ID!
    status: String
  }

  # inputs
  input FinancialSupportInput {
    civility: FinancialSupportCivility!
    first_name: String!
    last_name: String!
  }

  # enums
  enum FinancialSupportCivility {
    mr
    mrs
    neutral
  }
`;

module.exports = financialSupport;
