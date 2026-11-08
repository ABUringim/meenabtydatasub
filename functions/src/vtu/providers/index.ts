import { bigisubProvider } from './bigisub';

export interface VtuProviderInterface {
  buyAirtime(params: any): Promise<any>;
  buyData(params: any): Promise<any>;
  buyCable(params: any): Promise<any>;
  buyElectricity(params: any): Promise<any>;
  buyExamPin(params: any): Promise<any>;
  verifyMeter(params: any): Promise<any>;
  verifyCable(params: any): Promise<any>;
  requery(params: any): Promise<any>;
  healthCheck(): Promise<any>;
}

export const getActiveVtuProvider = (providerCode = 'bigisub'): VtuProviderInterface => {
  // BigiSub is the live primary provider
  return bigisubProvider;
};
