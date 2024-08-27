// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

// *************** IMPORT MODULE ***************
const FinancialSupport = require('./financial_support.model');

const Loader = new DataLoader(async (ids) => {
  const financialSupport = await FinancialSupport.find({ _id: { $in: ids } });
  const financialSupportMap = {};
  financialSupport.forEach((t) => {
    financialSupportMap[t._id] = t;
  });

  return ids.map((id) => financialSupportMap[id]);
});

// *************** EXPORT MODULE ***************
module.exports = Loader;
