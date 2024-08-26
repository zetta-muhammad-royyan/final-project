// *************** Import Library ***************
const { gql } = require('apollo-server-express');

// *************** TerminationOfPayments typedef ***************
const terminationOfpayments = gql`
  # schemas
  type TerminationOfPayments {
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

  input TerminationOfPaymentsFilterInput {
    description: String
    termination: Int
  }

  input TerminationOfPaymentsSortInput {
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
      filter: TerminationOfPaymentsFilterInput
      sort: TerminationOfPaymentsSortInput
      pagination: PaginationInput
    ): [TerminationOfPayments]!
    GetOneTerminationOfPayment(_id: ID!): TerminationOfPayments!
  }

  # mutations
  type Mutation {
    CreateTerminationOfPayment(description: String!, term_payments: [TermPaymentInput!]!, additional_cost: Float!): TerminationOfPayments!
    UpdateTerminationOfPayment(
      _id: ID!
      description: String!
      term_payments: [TermPaymentInput!]!
      additional_cost: Float!
    ): TerminationOfPayments!
    DeleteTerminationOfPayment(_id: ID!): String
  }
`;

module.exports = terminationOfpayments;
