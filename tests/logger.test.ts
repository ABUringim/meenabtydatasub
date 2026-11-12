import { logger } from '../src/lib/logger';

describe('Logger Service Unit Tests', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('walletFunded emits structured log with event: wallet_funded and amount in kobo', () => {
    logger.walletFunded({
      amountNgn: 5000,
      userId: 'user_xyz',
      reference: 'SD_PAY_12345',
      method: 'paystack',
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    const logCall = consoleLogSpy.mock.calls[0];
    expect(logCall[0]).toContain('[wallet_funded]');
    expect(logCall[1]).toMatchObject({
      event: 'wallet_funded',
      amountNgn: 5000,
      amountKobo: 500000,
      userId: 'user_xyz',
      reference: 'SD_PAY_12345',
      status: 'success',
      platform: 'Sayyada Datasub',
    });
  });

  test('transactionCompleted emits structured log with event: transaction_completed', () => {
    logger.transactionCompleted({
      service: 'airtime',
      provider: 'AIRTEL',
      amountNgn: 1000,
      reference: 'SD_VEND_9988',
      status: 'success',
      latencyMs: 165,
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    const logCall = consoleLogSpy.mock.calls[0];
    expect(logCall[0]).toContain('[transaction_completed]');
    expect(logCall[1]).toMatchObject({
      event: 'transaction_completed',
      service: 'airtime',
      provider: 'AIRTEL',
      amountNgn: 1000,
      amountKobo: 100000,
      reference: 'SD_VEND_9988',
      status: 'success',
    });
  });

  test('error and warn methods output appropriate prefixes and metadata', () => {
    logger.warn('vending', 'Upstream latency high', { latencyMs: 2500 });
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('[Sayyada:WARN] [vending]');

    logger.error('paystack', 'Webhook signature mismatch', { ip: '102.89.44.1' });
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[Sayyada:ERROR] [paystack]');
  });
});
