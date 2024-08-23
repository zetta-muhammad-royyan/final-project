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

  # queries
  type Query {
    QueryHello: String
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
