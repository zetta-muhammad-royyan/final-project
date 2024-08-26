const IsString = (input) => {
  return typeof input === 'string';
};

const IsNumber = (input) => {
  return typeof input === 'number' && !isNaN(input);
};

module.exports = {
  IsString,
  IsNumber,
};
