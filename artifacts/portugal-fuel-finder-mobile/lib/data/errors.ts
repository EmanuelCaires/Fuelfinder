export type DataErrorCode =
  | 'not-configured'
  | 'network'
  | 'unauthorized'
  | 'rate-limited'
  | 'invalid-response'
  | 'unknown';

export class FuelFinderDataError extends Error {
  code: DataErrorCode;
  retryable: boolean;

  constructor(
    code: DataErrorCode,
    message: string,
    retryable = false,
  ) {
    super(message);
    this.name = 'FuelFinderDataError';
    this.code = code;
    this.retryable = retryable;
  }
}

export function normalizeDataError(error: unknown): FuelFinderDataError {
  if (error instanceof FuelFinderDataError) return error;

  if (error instanceof TypeError) {
    return new FuelFinderDataError(
      'network',
      'Não foi possível contactar o serviço de dados.',
      true,
    );
  }

  return new FuelFinderDataError(
    'unknown',
    'Ocorreu um erro ao obter os dados.',
    true,
  );
}
