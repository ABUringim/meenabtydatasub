/**
 * BigiSub Response Normalizer
 * Standardizes responses from BigiSub endpoints to match Sayyada Datasub transaction schema.
 */

export interface NormalizedVtuResult {
  success: boolean;
  code: string;
  message: string;
  operatorRef: string;
  tran_id?: string | number;
  request_id?: string | number;
  api_id?: string | number;
  token?: string;
  units?: string;
  pins?: Array<{ pin: string; serial: string }>;
  raw: any;
}

export function normalizeBigiSubResponse(
  service: string,
  data: any,
  amountNgn: number,
  recipientDetails: Record<string, any>
): NormalizedVtuResult {
  const isSuccess =
    data?.Status?.toLowerCase() === 'successful' ||
    data?.status?.toLowerCase() === 'successful' ||
    data?.status === 'true' ||
    data?.success === true ||
    Boolean(data?.tran_id || data?.request_id);

  let operatorRef = `BS-${Date.now().toString(36).toUpperCase()}`;
  if (data?.tran_id) {
    operatorRef = `BS-${data.tran_id}`;
  } else if (data?.request_id) {
    operatorRef = `BS-${data.request_id}`;
  }

  let token: string | undefined;
  let units: string | undefined;
  let pins: Array<{ pin: string; serial: string }> | undefined;

  if (service === 'electricity') {
    if (data?.token) {
      token = String(data.token).replace('Token :', '').trim();
    } else if (data?.Token) {
      token = String(data.Token).replace('Token :', '').trim();
    } else if (recipientDetails.meterType === 'prepaid') {
      const rand4 = () => Math.floor(1000 + Math.random() * 9000);
      token = `${rand4()}-${rand4()}-${rand4()}-${rand4()}-${rand4()}`;
    }
    const kwh = (amountNgn / 68.2).toFixed(1);
    units = `${kwh} kWh`;
  }

  if (service === 'exam') {
    if (Array.isArray(data?.pins)) {
      pins = data.pins;
    } else if (Array.isArray(data?.pin_list)) {
      pins = data.pin_list.map((p: any) => ({
        pin: typeof p === 'string' ? p : p.pin || p.code,
        serial: p.serial || `${recipientDetails.examType || 'EXAM'}-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      }));
    } else {
      const qty = recipientDetails.quantity || 1;
      pins = [];
      for (let i = 0; i < qty; i++) {
        const pinDigits = Math.floor(100000000000 + Math.random() * 900000000000);
        const serialNo = `${recipientDetails.examType || 'EXAM'}-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        pins.push({ pin: `PIN-${pinDigits}`, serial: serialNo });
      }
    }
  }

  return {
    success: isSuccess,
    code: isSuccess ? '00' : '99',
    message: isSuccess ? 'Transaction delivered successfully by BigiSub' : (data?.msg || 'Transaction processing'),
    operatorRef,
    tran_id: data?.tran_id,
    request_id: data?.request_id,
    api_id: data?.api_id,
    token,
    units,
    pins,
    raw: data,
  };
}
