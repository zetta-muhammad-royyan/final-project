const isString = (input) => {
  return typeof input === 'string';
};

const isNumber = (input) => {
  return typeof input === 'number' && !isNaN(input);
};

module.exports = {
  isString,
  isNumber,
};
