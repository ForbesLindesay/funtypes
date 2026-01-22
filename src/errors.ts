import { Failure, FullError, showError } from './result';

export class ValidationError extends Error {
  public readonly name: 'ValidationError' = 'ValidationError';
  public readonly key: string | undefined;
  public readonly shortMessage!: string;
  public readonly fullError: FullError | undefined;

  constructor(failure: Omit<Failure, 'success'>) {
    super(showError(failure));
    Object.defineProperties(this, {
      key: { enumerable: false, value: failure.key },
      shortMessage: { enumerable: false, value: failure.message },
      fullError: { enumerable: false, value: failure.fullError },
    });
  }
  /**
   * @deprecated use shortMessage instead
   */
  getShortMessage() {
    return this.shortMessage;
  }
  /**
   * @deprecated use fullError instead
   */
  getFullError() {
    return this.fullError;
  }
}
