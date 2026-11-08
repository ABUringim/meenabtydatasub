import { getActiveVtuProvider } from './providers';

export const vtuProvider = {
  buyAirtime: (params: any) => getActiveVtuProvider().buyAirtime(params),
  buyData: (params: any) => getActiveVtuProvider().buyData(params),
  buyCable: (params: any) => getActiveVtuProvider().buyCable(params),
  buyElectricity: (params: any) => getActiveVtuProvider().buyElectricity(params),
  buyExamPin: (params: any) => getActiveVtuProvider().buyExamPin(params),
  verifyMeter: (params: any) => getActiveVtuProvider().verifyMeter(params),
  verifyCable: (params: any) => getActiveVtuProvider().verifyCable(params),
  requery: (params: any) => getActiveVtuProvider().requery(params),
  healthCheck: () => getActiveVtuProvider().healthCheck(),
};
