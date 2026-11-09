/**
 * Sayyada Datasub — BigiSub Live VTU Provider Implementation
 *
 * Implements the 5 core VTU services:
 *  1. Airtime Topup (buyAirtime / airtime)
 *  2. Data Topup (buyData / data)
 *  3. Cable TV Bouquet Purchase (buyCable / buyTv / tv)
 *  4. Electricity Recharge (buyElectricity / electricity)
 *  5. Exam Scratch Card PINs (buyExamPin / buyExamPins / examPins)
 *
 * Pre-payment validation methods:
 *  - validateMeter / verifyMeter (Electricity meter number validation)
 *  - validateCable / verifyCable (Cable smartcard / IUC validation)
 *
 * Post-payment requery method (ensuring transaction status consistency):
 *  - requery / requeryTransaction
 *
 * Authenticates all HTTP requests with Axios using:
 *  `Authorization: Token ${bigisubToken.value()}`
 */

import axios from 'axios';

// Resolve Firebase Functions secret parameter with environment fallback
let defineSecretFn;
try {
  const params = await import('firebase-functions/params');
  defineSecretFn = params.defineSecret;
} catch (_) {
  defineSecretFn = null;
}

const rawSecret = defineSecretFn ? defineSecretFn('BIGISUB_TOKEN') : null;

export const bigisubToken = {
  value: () => {
    try {
      if (rawSecret && typeof rawSecret.value === 'function') {
        const val = rawSecret.value();
        if (val) return val;
      }
    } catch (_) {
      // Outside Cloud Functions execution context
    }
    return process.env.BIGISUB_TOKEN || '';
  },
};

/**
 * Maps network string or code to BigiSub network ID:
 * 1 = MTN, 2 = GLO, 3 = 9MOBILE, 4 = AIRTEL
 */
export function mapNetworkToBigisubId(network) {
  if (typeof network === 'number') return network;
  const net = String(network || '').toUpperCase();
  if (net.includes('MTN')) return 1;
  if (net.includes('GLO')) return 2;
  if (net.includes('9MOBILE') || net.includes('ETISALAT')) return 3;
  if (net.includes('AIRTEL')) return 4;
  return 1;
}

/**
 * Maps Electricity Distribution Company (Disco) name/acronym to BigiSub company slug
 */
export function mapDiscoToBigisubCompany(disco) {
  const d = String(disco || '').toLowerCase();
  if (d.includes('ikeja') || d.includes('ikedc')) return 'ikeja-electric';
  if (d.includes('eko') || d.includes('ekedc')) return 'eko-electric';
  if (d.includes('abuja') || d.includes('aedc')) return 'abuja-electric';
  if (d.includes('kano') || d.includes('kedco')) return 'kano-electric';
  if (d.includes('enugu') || d.includes('eedc')) return 'enugu-electric';
  if (d.includes('port') || d.includes('phed')) return 'portharcourt-electric';
  if (d.includes('ibadan') || d.includes('ibedc')) return 'ibadan-electric';
  if (d.includes('jos') || d.includes('jedc')) return 'jos-electric';
  if (d.includes('kaduna') || d.includes('kaedco')) return 'kaduna-electric';
  if (d.includes('benin') || d.includes('bedc')) return 'benin-electric';
  if (d.includes('yola') || d.includes('yedc')) return 'yola-electric';
  return 'ikeja-electric';
}

/**
 * Normalizes raw API response to enforce transaction status consistency
 */
export function normalizeBigisubResponse(service, raw) {
  const rawStatus = String(raw?.Status || raw?.status || '').toLowerCase();
  const rawCode = String(raw?.code || '');

  const isSuccess =
    rawStatus === 'successful' ||
    rawStatus === 'success' ||
    rawCode === '00' ||
    rawCode === '200';

  const isFailed =
    rawStatus === 'failed' ||
    rawStatus === 'cancelled' ||
    rawStatus === 'rejected' ||
    rawStatus === 'reversed';

  let status = 'processing';
  if (isSuccess) {
    status = 'success';
  } else if (isFailed) {
    status = 'failed';
  }

  const tranId =
    raw?.tran_id ||
    raw?.tranx_id ||
    raw?.transaction_id ||
    raw?.id?.toString() ||
    `BIGI_${Date.now()}`;

  const requestId = raw?.request_id || raw?.reference || `REQ_${Date.now()}`;
  const apiId = raw?.api_id || raw?.id?.toString() || null;

  let token = null;
  let units = null;
  let pins = null;

  // Extract electricity token & units
  if (service === 'electricity') {
    if (raw?.token) {
      token = String(raw.token).replace(/^token\s*:\s*/i, '').trim();
    }
    if (raw?.units) {
      units = String(raw.units);
    }
  }

  // Extract exam pins & serials
  if (service === 'exam') {
    if (Array.isArray(raw?.pins)) {
      pins = raw.pins;
    } else if (raw?.pin) {
      pins = [
        {
          pin: raw.pin,
          serial: raw.serial_number || raw.serial || 'N/A',
        },
      ];
    }
  }

  const failureReason = isSuccess
    ? null
    : raw?.response || raw?.message || raw?.detail || raw?.error || 'Transaction unconfirmed';

  return {
    success: isSuccess,
    status,
    provider: 'bigisub',
    tranId,
    requestId,
    apiId,
    operatorRef: raw?.operator_ref || tranId,
    token,
    units,
    pins,
    failureReason,
    rawResponse: raw,
  };
}

export class BigisubProvider {
  constructor(options = {}) {
    this.baseURL =
      options.baseURL ||
      process.env.BIGISUB_BASE_URL ||
      'https://bigisub.ng/api/v1/';
    this.timeout = options.timeout || 25000;

    // Initialize axios client
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor ensuring Authorization: Token ${bigisubToken.value()} is set for all requests
    this.client.interceptors.request.use((config) => {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Token ${bigisubToken.value()}`;
      return config;
    });
  }

  /**
   * 1. Airtime Topup Service
   * POST /api/v1/airtime_topup/
   *
   * @param {Object} params
   * @param {string|number} params.network - MTN, GLO, 9MOBILE, AIRTEL
   * @param {number|string} params.amountNaira - Amount in Naira
   * @param {string} params.phone - Recipient 11-digit phone number
   * @param {'vtu'|'share'} [params.airtimeType='vtu'] - Topup type
   * @param {string} [params.idempotencyKey] - Unique transaction reference
   */
  async buyAirtime(params) {
    const payload = {
      network: mapNetworkToBigisubId(params.network),
      amount: String(params.amountNaira || params.amount || ''),
      phone_number: params.phone || params.phoneNumber || params.phone_number,
      airtime_type: params.airtimeType || params.airtime_type || 'vtu',
    };

    try {
      const res = await this.client.post('airtime_topup/', payload, {
        headers: {
          Authorization: `Token ${bigisubToken.value()}`,
        },
      });
      return normalizeBigisubResponse('airtime', res.data);
    } catch (err) {
      const raw = err?.response?.data || { error: err.message };
      const normalized = normalizeBigisubResponse('airtime', raw);
      normalized.status = 'failed';
      normalized.success = false;
      throw Object.assign(new Error(normalized.failureReason || 'Airtime vending failed'), {
        ...normalized,
        httpStatus: err?.response?.status,
      });
    }
  }

  async airtime(params) {
    return this.buyAirtime(params);
  }

  /**
   * 2. Data Topup Service
   * POST /api/v1/data_topup/
   *
   * @param {Object} params
   * @param {string|number} params.network - Network code
   * @param {string|number} params.planCode - Upstream data plan ID
   * @param {string} params.phone - Beneficiary phone number
   * @param {string} [params.idempotencyKey]
   */
  async buyData(params) {
    const payload = {
      network: mapNetworkToBigisubId(params.network),
      plan: params.planCode || params.plan_code || params.plan,
      phone_number: params.phone || params.phoneNumber || params.phone_number,
    };

    try {
      const res = await this.client.post('data_topup/', payload, {
        headers: {
          Authorization: `Token ${bigisubToken.value()}`,
        },
      });
      return normalizeBigisubResponse('data', res.data);
    } catch (err) {
      const raw = err?.response?.data || { error: err.message };
      const normalized = normalizeBigisubResponse('data', raw);
      normalized.status = 'failed';
      normalized.success = false;
      throw Object.assign(new Error(normalized.failureReason || 'Data bundle vending failed'), {
        ...normalized,
        httpStatus: err?.response?.status,
      });
    }
  }

  async data(params) {
    return this.buyData(params);
  }

  /**
   * Cable TV Verification (Pre-payment validation)
   * POST /api/v1/verify_cable/
   *
   * @param {Object} params
   * @param {string} params.provider - DSTV, GOTV, STARTIMES
   * @param {string} params.smartcard - IUC or Smartcard number
   */
  async validateCable(params) {
    const provider = String(params.provider || params.cable || '').toLowerCase();
    const smartcard = String(params.smartcard || params.iuc || params.smartcardNo || '').trim();

    const payload = {
      cable: provider,
      iuc: smartcard,
    };

    try {
      const res = await this.client.post('verify_cable/', payload, {
        headers: {
          Authorization: `Token ${bigisubToken.value()}`,
        },
      });
      const data = res.data || {};
      const customerName =
        data.Customer_Name ||
        data.customer_name ||
        data.name ||
        data.CustomerName ||
        'Verified Subscriber';

      return {
        customerName,
        currentBouquet: data.current_bouquet || data.package || data.current_plan || null,
        provider,
        smartcard,
        valid: true,
        rawResponse: data,
      };
    } catch (err) {
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Invalid smartcard or IUC number.';
      throw Object.assign(new Error(errorMsg), {
        valid: false,
        rawResponse: err?.response?.data,
        httpStatus: err?.response?.status,
      });
    }
  }

  async verifyCable(params) {
    return this.validateCable(params);
  }

  /**
   * 3. Cable TV Purchase Service
   * POST /api/v1/cable_purchase/
   *
   * @param {Object} params
   * @param {string} params.provider - DSTV, GOTV, STARTIMES
   * @param {string} params.smartcard - Smartcard / IUC number
   * @param {string|number} params.planCode - Upstream cable plan ID
   * @param {string} [params.phone] - Customer contact phone
   * @param {string} [params.idempotencyKey]
   */
  async buyCable(params) {
    const payload = {
      cable: String(params.provider || params.cable || '').toLowerCase(),
      iuc: params.smartcard || params.iuc || params.smartcardNo,
      cable_plan: params.planCode || params.plan_code || params.cable_plan,
      ...(params.phone || params.phoneNumber || params.phone_number
        ? { phone_number: params.phone || params.phoneNumber || params.phone_number }
        : {}),
    };

    try {
      const res = await this.client.post('cable_purchase/', payload, {
        headers: {
          Authorization: `Token ${bigisubToken.value()}`,
        },
      });
      return normalizeBigisubResponse('tv', res.data);
    } catch (err) {
      const raw = err?.response?.data || { error: err.message };
      const normalized = normalizeBigisubResponse('tv', raw);
      normalized.status = 'failed';
      normalized.success = false;
      throw Object.assign(new Error(normalized.failureReason || 'Cable subscription failed'), {
        ...normalized,
        httpStatus: err?.response?.status,
      });
    }
  }

  async buyTv(params) {
    return this.buyCable(params);
  }

  async tv(params) {
    return this.buyCable(params);
  }

  /**
   * Electricity Meter Validation (Pre-payment validation)
   * POST /api/v1/meter_validate/
   *
   * @param {Object} params
   * @param {string} params.disco - Distribution company (e.g. IKEDC, EKEDC, AEDC)
   * @param {string} params.meterNumber - Meter account number
   * @param {'prepaid'|'postpaid'} [params.meterType='prepaid']
   */
  async validateMeter(params) {
    const disco = params.disco || params.company || '';
    const meterNumber = String(params.meterNumber || params.meter_no || params.meterNo || '').trim();
    const meterType = params.meterType || params.meter_type || 'prepaid';

    const payload = {
      company: mapDiscoToBigisubCompany(disco),
      meter_no: meterNumber,
      meter_type: meterType,
    };

    try {
      const res = await this.client.post('meter_validate/', payload, {
        headers: {
          Authorization: `Token ${bigisubToken.value()}`,
        },
      });
      const data = res.data || {};
      const customerName =
        data.Customer_Name ||
        data.customer_name ||
        data.name ||
        data.CustomerName ||
        'Verified Consumer';
      const customerAddress =
        data.Customer_Address || data.address || data.CustomerAddress || 'Service Area';

      return {
        customerName,
        customerAddress,
        disco,
        meterNumber,
        meterType,
        valid: true,
        rawResponse: data,
      };
    } catch (err) {
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Invalid electricity meter number.';
      throw Object.assign(new Error(errorMsg), {
        valid: false,
        rawResponse: err?.response?.data,
        httpStatus: err?.response?.status,
      });
    }
  }

  async verifyMeter(params) {
    return this.validateMeter(params);
  }

  /**
   * 4. Electricity Meter Payment Service
   * POST /api/v1/meter_pay/
   *
   * @param {Object} params
   * @param {string} params.disco - Disco slug or acronym
   * @param {string} params.meterNumber - Meter number
   * @param {'prepaid'|'postpaid'} [params.meterType='prepaid']
   * @param {number|string} params.amountNaira - Amount in Naira
   * @param {string} params.phone - Contact phone for token SMS
   * @param {string} [params.customerName] - Validated customer name
   * @param {string} [params.customerAddress] - Validated customer address
   * @param {string} [params.idempotencyKey]
   */
  async buyElectricity(params) {
    const payload = {
      company: mapDiscoToBigisubCompany(params.disco || params.company),
      meter_no: params.meterNumber || params.meter_no || params.meterNo,
      meter_type: params.meterType || params.meter_type || 'prepaid',
      phone_number: params.phone || params.phoneNumber || params.phone_number,
      amount: String(params.amountNaira || params.amount || ''),
      Customer_name: params.customerName || params.customer_name || 'Customer',
      Customer_address: params.customerAddress || params.customer_address || params.address || 'Service Area',
    };

    try {
      const res = await this.client.post('meter_pay/', payload, {
        headers: {
          Authorization: `Token ${bigisubToken.value()}`,
        },
      });
      return normalizeBigisubResponse('electricity', res.data);
    } catch (err) {
      const raw = err?.response?.data || { error: err.message };
      const normalized = normalizeBigisubResponse('electricity', raw);
      normalized.status = 'failed';
      normalized.success = false;
      throw Object.assign(new Error(normalized.failureReason || 'Electricity payment failed'), {
        ...normalized,
        httpStatus: err?.response?.status,
      });
    }
  }

  async electricity(params) {
    return this.buyElectricity(params);
  }

  /**
   * 5. Exam PIN Purchase Service
   * POST /api/v1/exam_pin_purchase/
   *
   * @param {Object} params
   * @param {string} params.examType - WAEC, NECO, JAMB, NABTEB
   * @param {number} [params.quantity=1] - Number of pins
   * @param {string} [params.idempotencyKey]
   */
  async buyExamPin(params) {
    const examType = String(params.examType || params.exam_name || params.provider || 'waec').toLowerCase();
    const quantity = Number(params.quantity || 1);

    const payload = {
      exam_name: examType,
      quantity,
    };

    try {
      const res = await this.client.post('exam_pin_purchase/', payload, {
        headers: {
          Authorization: `Token ${bigisubToken.value()}`,
        },
      });
      return normalizeBigisubResponse('exam', res.data);
    } catch (err) {
      const raw = err?.response?.data || { error: err.message };
      const normalized = normalizeBigisubResponse('exam', raw);
      normalized.status = 'failed';
      normalized.success = false;
      throw Object.assign(new Error(normalized.failureReason || 'Exam PIN purchase failed'), {
        ...normalized,
        httpStatus: err?.response?.status,
      });
    }
  }

  async buyExamPins(params) {
    return this.buyExamPin(params);
  }

  async examPins(params) {
    return this.buyExamPin(params);
  }

  /**
   * Requery Method (Ensures transaction status consistency)
   * Queries BigiSub status by tran_id or request_id and checks final delivery state.
   *
   * @param {Object} params
   * @param {string} [params.tranId] - Upstream BigiSub transaction ID
   * @param {string} [params.requestId] - Local request / order reference
   * @param {string} [params.service] - Service category (airtime, data, tv, electricity, exam)
   * @returns {Promise<Object>} Normalized transaction status result
   */
  async requery(params) {
    const tranId = params.tranId || params.tran_id;
    const requestId = params.requestId || params.request_id || params.reference;
    const service = params.service || 'vtu';

    const payload = {
      ...(tranId ? { tran_id: tranId } : {}),
      ...(requestId ? { request_id: requestId } : {}),
    };

    try {
      const endpoint = service && service !== 'vtu' ? `${service}_topup/requery/` : 'requery/';

      let res;
      try {
        res = await this.client.post(endpoint, payload, {
          headers: {
            Authorization: `Token ${bigisubToken.value()}`,
          },
        });
      } catch (endpointErr) {
        // Fallback to generic requery/ if service-specific endpoint 404s
        if (endpoint !== 'requery/') {
          res = await this.client.post('requery/', payload, {
            headers: {
              Authorization: `Token ${bigisubToken.value()}`,
            },
          });
        } else {
          throw endpointErr;
        }
      }

      return normalizeBigisubResponse(service, res.data);
    } catch (err) {
      const raw = err?.response?.data || { error: err.message };
      const normalized = normalizeBigisubResponse(service, raw);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        normalized.status = 'processing';
        normalized.success = false;
        normalized.failureReason = 'Requery timed out, transaction may still be in progress';
      }
      return normalized;
    }
  }

  async requeryTransaction(params) {
    return this.requery(params);
  }

  /**
   * Health Check / Connectivity Diagnostic
   * Verifies upstream gateway reachability and token authentication.
   */
  async healthCheck() {
    const startTime = Date.now();
    try {
      await this.client.get('', {
        headers: {
          Authorization: `Token ${bigisubToken.value()}`,
        },
        timeout: 8000,
      });
      const latencyMs = Date.now() - startTime;
      return {
        status: 'ok',
        latencyMs,
        provider: 'bigisub',
        message: 'BigiSub Gateway Handshake Verified (HTTP 200 OK)',
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
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
export default bigisubProvider;
