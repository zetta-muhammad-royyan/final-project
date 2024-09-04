// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** TerminationOfPayments typedef ***************
const terminationOfpayment = gql`
  # schemas
  type TerminationOfPayment {
    _id: ID!
    description: String!
    termination: Int!
    term_payments: [TermPayment!]!
    additional_cost: Float!
  }

  type TermPayment {
    payment_date: String!
    percentage: Float!
  }

  # inputs
  input TermPaymentInput {
    payment_date: String!
    percentage: Float!
  }

  input TerminationOfPaymentFilterInput {
    description: String
    termination: Int
  }

  input TerminationOfPaymentSortInput {
    description: Int
    termination: Int
  }

  input PaginationInput {
    page: Int!
    limit: Int!
  }

  # queries
  type Query {
    GetAllTerminationOfPayments(
      filter: TerminationOfPaymentFilterInput
      sort: TerminationOfPaymentSortInput
      pagination: PaginationInput
    ): [TerminationOfPayment]!
    GetOneTerminationOfPayment(_id: ID!): TerminationOfPayment!
  }

  # mutations
  type Mutation {
    CreateTerminationOfPayment(description: String!, term_payments: [TermPaymentInput!]!, additional_cost: Float!): TerminationOfPayment!
    UpdateTerminationOfPayment(
      _id: ID!
      description: String
      term_payments: [TermPaymentInput]
      additional_cost: Float
    ): TerminationOfPayment!
    DeleteTerminationOfPayment(_id: ID!): String
  }
`;

// *************** EXPORT MODULE ***************
module.exports = terminationOfpayment;
