// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const TerminationOfPayment = require('./termination_of_payment.model');

const Loader = new DataLoader(async (ids) => {
  const terminationOfPayments = await TerminationOfPayment.find({ _id: { $in: ids } });
  const terminationOfPaymentMap = {};
  terminationOfPayments.forEach((t) => {
    terminationOfPaymentMap[t._id] = t;
  });

  return ids.map((id) => terminationOfPaymentMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;
