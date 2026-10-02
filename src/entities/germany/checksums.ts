/**
 * Weights [2,1,2,5,7,1,2,1,2,1,2,1] over 12 digits: the letter expands to its
 * two-digit alphabet position, and the products are added digit by digit.
 */
export function deSocialSecurityValid(value: string): boolean {
  if (!/^[0-9]{8}[A-Z][0-9]{3}$/i.test(value)) return false;

  const letter = value[8]?.toUpperCase() ?? '';
  const position = letter.charCodeAt(0) - 64; // A -> 1 … Z -> 26
  const digits =
    value.slice(0, 8) + String(position).padStart(2, '0') + value.slice(9, 11);

  const WEIGHTS = [2, 1, 2, 5, 7, 1, 2, 1, 2, 1, 2, 1];
  let total = 0;

  for (let i = 0; i < WEIGHTS.length; i++) {
    const product = Number(digits[i] ?? 0) * (WEIGHTS[i] ?? 0);
    total += Math.floor(product / 10) + (product % 10);
  }

  return total % 10 === Number(value.at(-1));
}
