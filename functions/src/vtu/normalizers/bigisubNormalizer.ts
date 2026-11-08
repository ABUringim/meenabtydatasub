/**
 * BigiSub Response Normalizer
 * Maps raw responses from BigiSub's REST API into Sayyada Datasub's standard transaction schema.
 */

export interface NormalizedVtuResult {
  success: boolean;
  status: 'success' | 'failed' | 'processing';
  provider: 'bigisub';
  tranId: string;
  requestId: string;
  apiId?: string;
  operatorRef?: string;
  token?: string;
  units?: string;
  pins?: Array<{ pin: string; serial: string }>;
  failureReason?: string;
  rawResponse: any;
}

export const normalizeBigisubResponse = (service: string, raw: any): NormalizedVtuResult => {
  const isSuccess =
    raw?.Status === 'successful' ||
    raw?.status === 'successful' ||
    raw?.status === 'success' ||
    raw?.code === '00';

  const tranId =
    raw?.tran_id ||
    raw?.tranx_id ||
    raw?.transaction_id ||
    raw?.id?.toString() ||
    `BIGI_${Date.now()}`;

  const requestId = raw?.request_id || raw?.reference || `REQ_${Date.now()}`;
  const apiId = raw?.api_id || raw?.id?.toString() || undefined;

  let token: string | undefined;
  let units: string | undefined;
  let pins: Array<{ pin: string; serial: string }> | undefined;

  // 1. Electricity Token Extraction
  if (service === 'electricity') {
    if (raw?.token) {
      // BigiSub format: "Token : 26362054405982757802" or direct token string
      token = raw.token.replace(/^token\s*:\s*/i, '').trim();
    }
    if (raw?.units) {
      units = raw.units.toString();
    }
  }

  // 2. Exam PINs Extraction
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

  return {
    success: isSuccess,
    status: isSuccess ? 'success' : 'failed',
    provider: 'bigisub',
    tranId,
    requestId,
    apiId,
    operatorRef: raw?.operator_ref || tranId,
    token,
    units,
    pins,
    failureReason: isSuccess ? undefined : (raw?.response || raw?.message || 'Transaction failed'),
    rawResponse: raw,
  };
};

/**
 * Maps Sayyada network identifier to BigiSub network ID:
 * 1 = MTN, 2 = GLO, 3 = 9MOBILE, 4 = AIRTEL
 */
export const mapNetworkToBigisubId = (network: string): number => {
  const net = network.toUpperCase();
  if (net.includes('MTN')) return 1;
  if (net.includes('GLO')) return 2;
  if (net.includes('9MOBILE') || net.includes('ETISALAT')) return 3;
  if (net.includes('AIRTEL')) return 4;
  return 1;
};

/**
 * Maps Sayyada Disco provider names to BigiSub company slug:
 * e.g., IKEDC -> "ikeja-electric", EKEDC -> "eko-electric", IBEDC -> "ibadan-electric", etc.
 */
export const mapDiscoToBigisubCompany = (disco: string): string => {
  const d = disco.toLowerCase();
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
};
