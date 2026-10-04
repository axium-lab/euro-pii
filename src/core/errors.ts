export type EuroPiiErrorCategory = 'invalid_input' | 'unknown_entity';

export interface EuroPiiErrorParams {
  category: EuroPiiErrorCategory;
  message: string;
}

export class EuroPiiError extends Error {
  readonly category: EuroPiiErrorCategory;

  constructor({ category, message }: EuroPiiErrorParams) {
    super(message);
    this.name = 'EuroPiiError';
    this.category = category;
  }
}

export function isEuroPiiError(value: unknown): value is EuroPiiError {
  return value instanceof EuroPiiError;
}
