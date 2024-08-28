// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const Billing = require('./billing.model');

const Loader = new DataLoader(async (ids) => {
  const billing = await Billing.find({ _id: { $in: ids } });
  const billingMap = {};
  billing.forEach((t) => {
    billingMap[t._id] = t;
  });

  return ids.map((id) => billingMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;
