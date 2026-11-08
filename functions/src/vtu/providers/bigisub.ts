/**
 * BigiSub Live VTU Provider Implementation
 * Authenticated via `Authorization: Token <token>` header.
 * Interacts with bigisub.ng/api/v1/ endpoints for Airtime, Data, TV, Electricity, and Exam Pins.
 */

import axios, { AxiosInstance } from 'axios';
import { getBigisubToken, getBigisubBaseUrl, sanitizeLog } from '../../config/secrets';
import {
  normalizeBigisubResponse,
  mapNetworkToBigisubId,
  mapDiscoToBigisubCompany,
  NormalizedVtuResult,
} from '../normalizers/bigisubNormalizer';
import { mapBigisubError } from '../errors/bigisubErrors';

export class BigisubProvider {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getBigisubBaseUrl(),
      timeout: 25000, // 25s timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to attach fresh token and sanitize logging
    this.client.interceptors.request.use((config) => {
      const token = getBigisubToken();
      config.headers.Authorization = `Token ${token}`;
      return config;
    });
  }

  /**
   * 1. Airtime Topup
   * POST /api/v1/airtime_topup/
   */
  async buyAirtime(params: {
    network: string;
    amountNaira: number;
    phone: string;
    airtimeType?: 'vtu' | 'share';
    idempotencyKey: string;
  }): Promise<NormalizedVtuResult> {
    const payload = {
      network: mapNetworkToBigisubId(params.network),
      amount: params.amountNaira.toString(),
      phone_number: params.phone,
      airtime_type: params.airtimeType || 'vtu',
    };

    try {
      const res = await this.client.post('airtime_topup/', payload);
      return normalizeBigisubResponse('airtime', res.data);
    } catch (err: any) {
      const mapped = mapBigisubError(err);
      throw { ...mapped, rawResponse: err?.response?.data };
    }
  }

  /**
   * 2. Data Topup
   * POST /api/v1/data_topup/
   */
  async buyData(params: {
    network: string;
    planCode: string | number;
    phone: string;
    idempotencyKey: string;
  }): Promise<NormalizedVtuResult> {
    const payload = {
      network: mapNetworkToBigisubId(params.network),
      plan: params.planCode,
      phone_number: params.phone,
    };

    try {
      const res = await this.client.post('data_topup/', payload);
      return normalizeBigisubResponse('data', res.data);
    } catch (err: any) {
      const mapped = mapBigisubError(err);
      throw { ...mapped, rawResponse: err?.response?.data };
    }
  }

  /**
   * 3. Cable TV Verification
   * POST /api/v1/verify_cable/
   */
  async verifyCable(params: {
    provider: string; // DSTV, GOTV, STARTIMES
    smartcard: string;
  }): Promise<{ customerName: string; currentBouquet?: string; valid: boolean }> {
    const payload = {
      cable: params.provider.toLowerCase(),
      iuc: params.smartcard,
    };

    try {
      const res = await this.client.post('verify_cable/', payload);
      const data = res.data;
      const customerName = data.Customer_Name || data.customer_name || data.name || 'Verified Subscriber';
      return {
        customerName,
        currentBouquet: data.current_bouquet || data.package,
        valid: true,
      };
    } catch (err: any) {
      const mapped = mapBigisubError(err);
      throw { ...mapped, message: 'Invalid smartcard or IUC number.' };
    }
  }

  /**
   * 4. Cable TV Bouquet Purchase
   * POST /api/v1/cable_purchase/
   */
  async buyCable(params: {
    provider: string;
    smartcard: string;
    planCode: string | number;
    phone?: string;
    idempotencyKey: string;
  }): Promise<NormalizedVtuResult> {
    const payload = {
      cable: params.provider.toLowerCase(),
      iuc: params.smartcard,
      cable_plan: params.planCode,
      ...(params.phone ? { phone_number: params.phone } : {}),
    };

    try {
      const res = await this.client.post('cable_purchase/', payload);
      return normalizeBigisubResponse('tv', res.data);
    } catch (err: any) {
      const mapped = mapBigisubError(err);
      throw { ...mapped, rawResponse: err?.response?.data };
    }
  }

  /**
   * 5. Electricity Meter Validation
   * POST /api/v1/meter_validate/
   */
  async verifyMeter(params: {
    disco: string;
    meterNumber: string;
    meterType: 'prepaid' | 'postpaid';
  }): Promise<{ customerName: string; customerAddress?: string; disco: string; valid: boolean }> {
    const payload = {
      company: mapDiscoToBigisubCompany(params.disco),
      meter_no: params.meterNumber,
      meter_type: params.meterType,
    };

    try {
      const res = await this.client.post('meter_validate/', payload);
      const data = res.data;
      const customerName = data.Customer_Name || data.customer_name || data.name || 'Verified Consumer';
      const customerAddress = data.Customer_Address || data.address || 'Service Area';
      return {
        customerName,
        customerAddress,
        disco: params.disco,
        valid: true,
      };
    } catch (err: any) {
      const mapped = mapBigisubError(err);
      throw { ...mapped, message: 'Invalid electricity meter number.' };
    }
  }

  /**
   * 6. Electricity Meter Payment
   * POST /api/v1/meter_pay/
   */
  async buyElectricity(params: {
    disco: string;
    meterNumber: string;
    meterType: 'prepaid' | 'postpaid';
    amountNaira: number;
    phone: string;
    customerName?: string;
    customerAddress?: string;
    idempotencyKey: string;
  }): Promise<NormalizedVtuResult> {
    const payload = {
      company: mapDiscoToBigisubCompany(params.disco),
      meter_no: params.meterNumber,
      meter_type: params.meterType,
      phone_number: params.phone,
      amount: params.amountNaira.toString(),
      Customer_name: params.customerName || 'Ayo',
      Customer_address: params.customerAddress || 'Service Area',
    };

    try {
      const res = await this.client.post('meter_pay/', payload);
      return normalizeBigisubResponse('electricity', res.data);
    } catch (err: any) {
      const mapped = mapBigisubError(err);
      throw { ...mapped, rawResponse: err?.response?.data };
    }
  }

  /**
   * 7. Exam PIN Purchase
   * POST /api/v1/exam_pin_purchase/
   */
  async buyExamPin(params: {
    examType: string; // WAEC, NECO, JAMB, NABTEB
    quantity: number;
    idempotencyKey: string;
  }): Promise<NormalizedVtuResult> {
    const payload = {
      exam_name: params.examType.toLowerCase(),
      quantity: params.quantity,
    };

    try {
      const res = await this.client.post('exam_pin_purchase/', payload);
      return normalizeBigisubResponse('exam', res.data);
    } catch (err: any) {
      const mapped = mapBigisubError(err);
      throw { ...mapped, rawResponse: err?.response?.data };
    }
  }

  /**
   * 8. Requery Transaction Status
   * Queries BigiSub status using either tran_id or request_id
   */
  async requery(params: {
    tranId?: string;
    requestId?: string;
    service?: string;
  }): Promise<NormalizedVtuResult> {
    try {
      const endpoint = params.service ? `${params.service}_topup/requery/` : 'requery/';
      const res = await this.client.post(endpoint, {
        tran_id: params.tranId,
        request_id: params.requestId,
      });
      return normalizeBigisubResponse(params.service || 'vtu', res.data);
    } catch (err: any) {
      const mapped = mapBigisubError(err);
      throw { ...mapped, rawResponse: err?.response?.data };
    }
  }

  /**
   * 9. Health Check
   * Pings the API to verify token authentication and latency without placing a real order.
   */
  async healthCheck(): Promise<{
    status: 'ok' | 'down';
    latencyMs: number;
    provider: string;
    message: string;
  }> {
    const startTime = Date.now();
    try {
      // Lightweight call to verify authentication token
      await this.client.get('', { timeout: 8000 });
      const latencyMs = Date.now() - startTime;
      return {
        status: 'ok',
        latencyMs,
        provider: 'bigisub',
        message: 'BigiSub Gateway Handshake Verified (HTTP 200 OK)',
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      // Even if root path returns 404/200, if token authenticated without 401/403, connection is verified
      const httpStatus = err?.response?.status;
      if (httpStatus && httpStatus !== 401 && httpStatus !== 403 && httpStatus < 500) {
        return {
          status: 'ok',
          latencyMs,
          provider: 'bigisub',
          message: `BigiSub Handshake Verified (HTTP ${httpStatus})`,
        };
      }
      return {
        status: 'down',
        latencyMs,
        provider: 'bigisub',
        message: err?.response?.data?.detail || err?.message || 'Connection failed',
      };
    }
  }
}

export const bigisubProvider = new BigisubProvider();
