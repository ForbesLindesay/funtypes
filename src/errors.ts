import { Failure, FullError, showError } from './result';

export class ValidationError extends Error {
  public readonly name: 'ValidationError' = 'ValidationError';
  public readonly key: string | undefined;
  public readonly getShortMessage: () => string;
  public readonly getFullError: () => FullError | undefined;

  constructor(failure: Omit<Failure, 'success'>) {
    super(showError(failure));
    this.key = failure.key;
    this.getShortMessage = () => failure.message;
    this.getFullError = () => failure.fullError;
  }
}
