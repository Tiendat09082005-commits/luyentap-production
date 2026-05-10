module.exports.priceNew = (price, discount) => {
  price = Number(price);
  discount = Number(discount) || 0;

  if (discount < 0) discount = 0;
  if (discount > 100) discount = 100;

  const result = price - (price * discount) / 100;
  return Math.round(result);
};