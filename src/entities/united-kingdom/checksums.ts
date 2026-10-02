/** Modulo 11 with multipliers 10, 9, 8 … 1. */
export function nhsValid(value: string): boolean {
  if (value.length !== 10 || !/^[0-9]+$/.test(value)) return false;

  let total = 0;
  for (let i = 0; i < 10; i++) total += Number(value[i]) * (10 - i);

  return total % 11 === 0;
}
