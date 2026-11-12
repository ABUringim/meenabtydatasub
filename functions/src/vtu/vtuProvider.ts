/**
 * VTU Provider Interface
 */

import { NormalizedVtuResult } from './normalizers/bigisubNormalizer';
import { bigiSubProvider } from './providers/bigisub';

export interface VendingParams {
  service?: 'airtime' | 'data' | 'electricity' | 'tv' | 'exam' | string;
  provider?: string;
  amountNgn?: number;
  amountNaira?: number;
  recipientDetails?: Record<string, any>;
  reference?: string;
  network?: string;
  disco?: string;
  examType?: string;
  phone?: string;
  smartcard?: string;
  meterNumber?: string;
  meterType?: string;
  customerName?: string;
  customerAddress?: string;
  airtimeType?: string;
  planCode?: string;
  quantity?: number;
  idempotencyKey?: string;
  [key: string]: any;
}

export interface IVtuProvider {
  name: string;
  code: string;
  buyAirtime(params: VendingParams): Promise<NormalizedVtuResult>;
  buyData(params: VendingParams): Promise<NormalizedVtuResult>;
  buyElectricity(params: VendingParams): Promise<NormalizedVtuResult>;
  buyCableTv(params: VendingParams): Promise<NormalizedVtuResult>;
  buyCable?(params: VendingParams): Promise<NormalizedVtuResult>;
  buyExamPin(params: VendingParams): Promise<NormalizedVtuResult>;
  verifyMeter(disco: string, meterNo: string, meterType: string): Promise<any>;
  verifyCable(cable: string, iuc: string): Promise<any>;
  requery(reference: any, operatorRef?: any): Promise<any>;
  healthCheck?(): Promise<any>;
}

export const vtuProvider: IVtuProvider = bigiSubProvider;
