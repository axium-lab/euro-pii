export function peselValid(value: string): boolean {
  if (value.length !== 11 || !/^[0-9]+$/.test(value)) return false;

  const WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const digits = [...value].map(Number);
  const sum = WEIGHTS.reduce(
    (acc, weight, i) => acc + (digits[i] ?? 0) * weight,
    0,
  );

  return (10 - (sum % 10)) % 10 === digits[10];
}
