export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEventData {
  userId?: string;
  amountNgn?: number;
  amountKobo?: number;
  service?: string;
  provider?: string;
  reference?: string;
  status?: string;
  latencyMs?: number;
  [key: string]: any;
}

class LoggerService {
  private perfInstance: any = null;
  private perfInitialized = false;

  constructor() {
    this.initPerf();
  }

  private async initPerf() {
    if (typeof window !== 'undefined' && !this.perfInitialized) {
      try {
        const { getPerformance } = await import('firebase/performance');
        const { app } = await import('./firebase');
        if (app) {
          this.perfInstance = getPerformance(app);
          this.perfInitialized = true;
        }
      } catch {
        this.perfInitialized = true;
      }
    }
  }

  private formatMessage(level: LogLevel, eventName: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [Sayyada:${level.toUpperCase()}] [${eventName}]`;
  }

  public logEvent(eventName: string, data: LogEventData = {}): void {
    const prefix = this.formatMessage('info', eventName);
    console.log(prefix, {
      event: eventName,
      ...data,
      platform: 'Sayyada Datasub',
      timestamp: new Date().toISOString(),
    });
  }

  public walletFunded(params: {
    amountNgn: number;
    userId: string;
    reference: string;
    method?: string;
  }): void {
    this.logEvent('wallet_funded', {
      ...params,
      amountKobo: params.amountNgn * 100,
      status: 'success',
    });
  }

  public transactionCompleted(params: {
    service: string;
    provider: string;
    amountNgn: number;
    reference: string;
    status: 'success' | 'failed' | 'processing';
    latencyMs?: number;
    recipient?: string;
  }): void {
    this.logEvent('transaction_completed', {
      ...params,
      amountKobo: params.amountNgn * 100,
    });
  }

  public info(tag: string, message: string, meta?: Record<string, any>): void {
    console.info(this.formatMessage('info', tag), message, meta || '');
  }

  public warn(tag: string, message: string, meta?: Record<string, any>): void {
    console.warn(this.formatMessage('warn', tag), message, meta || '');
  }

  public error(tag: string, message: string, error?: any): void {
    console.error(this.formatMessage('error', tag), message, error || '');
  }
}

export const logger = new LoggerService();
export default logger;
