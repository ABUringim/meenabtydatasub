/**
 * BigiSub VTU Gateway Implementation
 * Direct integration with bigisub.ng production API.
 */

import axios from 'axios';
import { IVtuProvider, VendingParams } from '../vtuProvider';
import { BIGISUB_BASE_URL, BIGISUB_TOKEN_SECRET } from '../../config/secrets';
import { normalizeBigiSubResponse, NormalizedVtuResult } from '../normalizers/bigisubNormalizer';
import { mapBigiSubError } from '../errors/bigisubErrors';

export class BigiSubProvider implements IVtuProvider {
  name = 'BigiSub VTU Gateway';
  code = 'bigisub';

  private getHeaders() {
    return {
      Authorization: `Token ${BIGISUB_TOKEN_SECRET}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private mapNetwork(network: string): number {
    const n = network.toUpperCase();
    if (n.includes('MTN')) return 1;
    if (n.includes('GLO')) return 2;
    if (n.includes('9MOB') || n.includes('ETISALAT')) return 3;
    if (n.includes('AIRTEL')) return 4;
    return 1;
  }

  private mapDisco(disco: string): number {
    const d = disco.toUpperCase();
    if (d.includes('ABUJA') || d.includes('AEDC')) return 1;
    if (d.includes('EKO') || d.includes('EKEDC')) return 2;
    if (d.includes('IKEJA') || d.includes('IKEDC')) return 3;
    if (d.includes('IBADAN') || d.includes('IBEDC')) return 4;
    if (d.includes('JOS') || d.includes('JED')) return 5;
    if (d.includes('KADUNA') || d.includes('KAEDCO')) return 6;
    if (d.includes('KANO') || d.includes('KEDCO')) return 7;
    if (d.includes('PORT HARCOURT') || d.includes('PHED')) return 8;
    if (d.includes('ENUGU') || d.includes('EEDC')) return 9;
    if (d.includes('BENIN') || d.includes('BEDC')) return 10;
    if (d.includes('YOLA') || d.includes('YEDC')) return 11;
    return 7;
  }

  private mapCable(cable: string): number {
    const c = cable.toUpperCase();
    if (c.includes('DSTV')) return 1;
    if (c.includes('GOTV')) return 2;
    if (c.includes('STARTIMES') || c.includes('STAR')) return 3;
    return 1;
  }

  async buyAirtime(params: VendingParams): Promise<NormalizedVtuResult> {
    try {
      const netId = this.mapNetwork(params.provider || params.recipientDetails.network || 'MTN');
      const phone = (params.recipientDetails.phone || '').replace(/\s+/g, '');
      const res = await axios.post(
        `${BIGISUB_BASE_URL}/airtime_topup/`,
        {
          network: netId,
          amount: params.amountNgn,
          phone_number: phone,
          airtime_type: 'vtu',
        },
        { headers: this.getHeaders(), timeout: 20000 }
      );
      return normalizeBigiSubResponse('airtime', res.data, params.amountNgn, params.recipientDetails);
    } catch (err: any) {
      throw new Error(mapBigiSubError(err));
    }
  }

  async buyData(params: VendingParams): Promise<NormalizedVtuResult> {
    try {
      const netId = this.mapNetwork(params.provider || params.recipientDetails.network || 'MTN');
      const phone = (params.recipientDetails.phone || '').replace(/\s+/g, '');
      const plan = params.recipientDetails.planCode || params.recipientDetails.planId || 1;
      const res = await axios.post(
        `${BIGISUB_BASE_URL}/data_topup/`,
        {
          network: netId,
          plan,
          phone_number: phone,
        },
        { headers: this.getHeaders(), timeout: 25000 }
      );
      return normalizeBigiSubResponse('data', res.data, params.amountNgn, params.recipientDetails);
    } catch (err: any) {
      throw new Error(mapBigiSubError(err));
    }
  }

  async buyElectricity(params: VendingParams): Promise<NormalizedVtuResult> {
    try {
      const discoId = this.mapDisco(params.provider || params.recipientDetails.disco || '');
      const meterNo = (params.recipientDetails.meterNo || '').trim();
      const meterType = (params.recipientDetails.meterType || 'prepaid').toLowerCase();
      const res = await axios.post(
        `${BIGISUB_BASE_URL}/meter_pay/`,
        {
          disco: discoId,
          meter_number: meterNo,
          meter_type: meterType,
          amount: params.amountNgn,
        },
        { headers: this.getHeaders(), timeout: 30000 }
      );
      return normalizeBigiSubResponse('electricity', res.data, params.amountNgn, params.recipientDetails);
    } catch (err: any) {
      throw new Error(mapBigiSubError(err));
    }
  }

  async buyCableTv(params: VendingParams): Promise<NormalizedVtuResult> {
    try {
      const cableId = this.mapCable(params.provider || '');
      const iuc = (params.recipientDetails.smartcardNo || '').trim();
      const pkg = params.recipientDetails.packageId || 1;
      const res = await axios.post(
        `${BIGISUB_BASE_URL}/cable_purchase/`,
        {
          cable: cableId,
          package: pkg,
          iuc,
        },
        { headers: this.getHeaders(), timeout: 25000 }
      );
      return normalizeBigiSubResponse('tv', res.data, params.amountNgn, params.recipientDetails);
    } catch (err: any) {
      throw new Error(mapBigiSubError(err));
    }
  }

  async buyExamPin(params: VendingParams): Promise<NormalizedVtuResult> {
    try {
      const examName = (params.provider || params.recipientDetails.examType || 'WAEC').toUpperCase();
      const quantity = Number(params.recipientDetails.quantity || 1);
      const res = await axios.post(
        `${BIGISUB_BASE_URL}/exam_pin_purchase/`,
        {
          exam_name: examName,
          quantity,
        },
        { headers: this.getHeaders(), timeout: 25000 }
      );
      return normalizeBigiSubResponse('exam', res.data, params.amountNgn, params.recipientDetails);
    } catch (err: any) {
      throw new Error(mapBigiSubError(err));
    }
  }

  async verifyMeter(disco: string, meterNo: string, meterType: string): Promise<any> {
    const discoId = this.mapDisco(disco);
    const res = await axios.post(
      `${BIGISUB_BASE_URL}/meter_validate/`,
      {
        disco: discoId,
        meter_number: meterNo.trim(),
        meter_type: meterType,
      },
      { headers: this.getHeaders(), timeout: 15000 }
    );
    return res.data;
  }

  async verifyCable(cable: string, iuc: string): Promise<any> {
    const cableId = this.mapCable(cable);
    const res = await axios.post(
      `${BIGISUB_BASE_URL}/verify_cable/`,
      {
        cable: cableId,
        iuc: iuc.trim(),
      },
      { headers: this.getHeaders(), timeout: 15000 }
    );
    return res.data;
  }

  async requery(reference: string, operatorRef?: string): Promise<any> {
    try {
      const res = await axios.post(
        `${BIGISUB_BASE_URL}/requery/`,
        {
          tran_id: operatorRef || reference,
        },
        { headers: this.getHeaders(), timeout: 15000 }
      );
      return res.data;
    } catch (err: any) {
      return { status: 'reconciled_fallback', reference };
    }
  }
}

export const bigiSubProvider = new BigiSubProvider();
