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

  # enums
  enum PaymentTypeEnum {
    my_self
    family
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
