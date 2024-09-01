// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const billing = gql`
  # schemas
  type Billing {
    _id: ID!
    student: Student!
    registration_profile: RegistrationProfile!
    payer: Payer!
    total_amount: Float!
    paid_amount: Float!
    remaining_due: Float!
    terms: [Term]!
    deposit: Deposit
  }

  type Payer {
    _id: ID!
    civility: String!
    first_name: String!
    last_name: String!
  }

  # inputs
  input PayerInput {
    payer_id: ID!
    cost_coverage: Float!
  }

  input BillingFilterInput {
    student_full_name: String
    payer_full_name: String
    termination: Int
  }

  input BillingSortInput {
    student_full_name: Int
    payer_full_name: Int
    termination: Int
  }

  input BillingPaginationInput {
    page: Int!
    limit: Int!
  }

  # enums
  enum PaymentTypeEnum {
    my_self
    family
  }

  # query
  type Query {
    GetAllBillings(filter: BillingFilterInput, sort: BillingSortInput, pagination: BillingPaginationInput!): [Billing]!
  }

  # mutations
  type Mutation {
    GenerateBilling(student_id: ID!, payment_type: PaymentTypeEnum!, payer: [PayerInput!]!): [Billing!]!
    AddPayment(billing_id: ID!, amount: Float!): Billing!
    RemovePayment(billing_id: ID!, amount: Float!): Billing!
  }
`;

// *************** EXPORT MODULE ***************
module.exports = billing;
