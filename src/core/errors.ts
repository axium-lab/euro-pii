export type NeriumErrorCategory = 'invalid_input' | 'unknown_entity';

export interface NeriumErrorParams {
  category: NeriumErrorCategory;
  message: string;
}

export class NeriumError extends Error {
  readonly category: NeriumErrorCategory;

  constructor({ category, message }: NeriumErrorParams) {
    super(message);
    this.name = 'NeriumError';
    this.category = category;
  }
}

export function isNeriumError(value: unknown): value is NeriumError {
  return value instanceof NeriumError;
}
