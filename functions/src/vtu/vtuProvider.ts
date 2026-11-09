/**
 * VTU Provider Interface
 */

import { NormalizedVtuResult } from './normalizers/bigisubNormalizer';

export interface VendingParams {
  service: 'airtime' | 'data' | 'electricity' | 'tv' | 'exam';
  provider: string;
  amountNgn: number;
  recipientDetails: Record<string, any>;
  reference: string;
}

export interface IVtuProvider {
  name: string;
  code: string;
  buyAirtime(params: VendingParams): Promise<NormalizedVtuResult>;
  buyData(params: VendingParams): Promise<NormalizedVtuResult>;
  buyElectricity(params: VendingParams): Promise<NormalizedVtuResult>;
  buyCableTv(params: VendingParams): Promise<NormalizedVtuResult>;
  buyExamPin(params: VendingParams): Promise<NormalizedVtuResult>;
  verifyMeter(disco: string, meterNo: string, meterType: string): Promise<any>;
  verifyCable(cable: string, iuc: string): Promise<any>;
  requery(reference: string, operatorRef?: string): Promise<any>;
}
