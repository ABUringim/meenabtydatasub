"use strict";
/**
 * BigiSub Response Normalizer
 * Standardizes responses from BigiSub endpoints to match Sayyada Datasub transaction schema.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeBigiSubResponse = normalizeBigiSubResponse;
function normalizeBigiSubResponse(service, data, amountNgn, recipientDetails) {
    const isSuccess = data?.Status?.toLowerCase() === 'successful' ||
        data?.status?.toLowerCase() === 'successful' ||
        data?.status === 'true' ||
        data?.success === true ||
        Boolean(data?.tran_id || data?.request_id);
    let operatorRef = `BS-${Date.now().toString(36).toUpperCase()}`;
    if (data?.tran_id) {
        operatorRef = `BS-${data.tran_id}`;
    }
    else if (data?.request_id) {
        operatorRef = `BS-${data.request_id}`;
    }
    let token;
    let units;
    let pins;
    if (service === 'electricity') {
        if (data?.token) {
            token = String(data.token).replace('Token :', '').trim();
        }
        else if (data?.Token) {
            token = String(data.Token).replace('Token :', '').trim();
        }
        const kwh = (amountNgn / 68.2).toFixed(1);
        units = `${kwh} kWh`;
    }
    if (service === 'exam') {
        if (Array.isArray(data?.pins)) {
            pins = data.pins;
        }
        else if (Array.isArray(data?.pin_list)) {
            pins = data.pin_list.map((p) => ({
                pin: typeof p === 'string' ? p : p.pin || p.code,
                serial: p.serial || `${recipientDetails.examType || 'EXAM'}-SERIAL`,
            }));
        }
        else if (data?.pin) {
            pins = [{ pin: String(data.pin), serial: String(data.serial || `${recipientDetails.examType || 'EXAM'}-SERIAL`) }];
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
//# sourceMappingURL=bigisubNormalizer.js.map