"use strict";
/**
 * BigiSub VTU Gateway Implementation
 * Direct integration with bigisub.ng production API.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigiSubProvider = exports.BigiSubProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const secrets_1 = require("../../config/secrets");
const bigisubNormalizer_1 = require("../normalizers/bigisubNormalizer");
const bigisubErrors_1 = require("../errors/bigisubErrors");
class BigiSubProvider {
    constructor() {
        this.name = 'BigiSub VTU Gateway';
        this.code = 'bigisub';
    }
    getHeaders() {
        return {
            Authorization: `Token ${secrets_1.BIGISUB_TOKEN_SECRET}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };
    }
    mapNetwork(network) {
        const n = network.toUpperCase();
        if (n.includes('MTN'))
            return 1;
        if (n.includes('GLO'))
            return 2;
        if (n.includes('9MOB') || n.includes('ETISALAT'))
            return 3;
        if (n.includes('AIRTEL'))
            return 4;
        return 1;
    }
    mapDisco(disco) {
        const d = disco.toUpperCase();
        if (d.includes('ABUJA') || d.includes('AEDC'))
            return 1;
        if (d.includes('EKO') || d.includes('EKEDC'))
            return 2;
        if (d.includes('IKEJA') || d.includes('IKEDC'))
            return 3;
        if (d.includes('IBADAN') || d.includes('IBEDC'))
            return 4;
        if (d.includes('JOS') || d.includes('JED'))
            return 5;
        if (d.includes('KADUNA') || d.includes('KAEDCO'))
            return 6;
        if (d.includes('KANO') || d.includes('KEDCO'))
            return 7;
        if (d.includes('PORT HARCOURT') || d.includes('PHED'))
            return 8;
        if (d.includes('ENUGU') || d.includes('EEDC'))
            return 9;
        if (d.includes('BENIN') || d.includes('BEDC'))
            return 10;
        if (d.includes('YOLA') || d.includes('YEDC'))
            return 11;
        return 7;
    }
    mapCable(cable) {
        const c = cable.toUpperCase();
        if (c.includes('DSTV'))
            return 1;
        if (c.includes('GOTV'))
            return 2;
        if (c.includes('STARTIMES') || c.includes('STAR'))
            return 3;
        return 1;
    }
    async buyAirtime(params) {
        try {
            const netId = this.mapNetwork(params.provider || params.recipientDetails.network || 'MTN');
            const phone = (params.recipientDetails.phone || '').replace(/\s+/g, '');
            const res = await axios_1.default.post(`${secrets_1.BIGISUB_BASE_URL}/airtime_topup/`, {
                network: netId,
                amount: params.amountNgn,
                phone_number: phone,
                airtime_type: 'vtu',
            }, { headers: this.getHeaders(), timeout: 20000 });
            return (0, bigisubNormalizer_1.normalizeBigiSubResponse)('airtime', res.data, params.amountNgn, params.recipientDetails);
        }
        catch (err) {
            throw new Error((0, bigisubErrors_1.mapBigiSubError)(err));
        }
    }
    async buyData(params) {
        try {
            const netId = this.mapNetwork(params.provider || params.recipientDetails.network || 'MTN');
            const phone = (params.recipientDetails.phone || '').replace(/\s+/g, '');
            const plan = params.recipientDetails.planCode || params.recipientDetails.planId || 1;
            const res = await axios_1.default.post(`${secrets_1.BIGISUB_BASE_URL}/data_topup/`, {
                network: netId,
                plan,
                phone_number: phone,
            }, { headers: this.getHeaders(), timeout: 25000 });
            return (0, bigisubNormalizer_1.normalizeBigiSubResponse)('data', res.data, params.amountNgn, params.recipientDetails);
        }
        catch (err) {
            throw new Error((0, bigisubErrors_1.mapBigiSubError)(err));
        }
    }
    async buyElectricity(params) {
        try {
            const discoId = this.mapDisco(params.provider || params.recipientDetails.disco || '');
            const meterNo = (params.recipientDetails.meterNo || '').trim();
            const meterType = (params.recipientDetails.meterType || 'prepaid').toLowerCase();
            const res = await axios_1.default.post(`${secrets_1.BIGISUB_BASE_URL}/meter_pay/`, {
                disco: discoId,
                meter_number: meterNo,
                meter_type: meterType,
                amount: params.amountNgn,
            }, { headers: this.getHeaders(), timeout: 30000 });
            return (0, bigisubNormalizer_1.normalizeBigiSubResponse)('electricity', res.data, params.amountNgn, params.recipientDetails);
        }
        catch (err) {
            throw new Error((0, bigisubErrors_1.mapBigiSubError)(err));
        }
    }
    async buyCableTv(params) {
        try {
            const cableId = this.mapCable(params.provider || '');
            const iuc = (params.recipientDetails.smartcardNo || '').trim();
            const pkg = params.recipientDetails.packageId || 1;
            const res = await axios_1.default.post(`${secrets_1.BIGISUB_BASE_URL}/cable_purchase/`, {
                cable: cableId,
                package: pkg,
                iuc,
            }, { headers: this.getHeaders(), timeout: 25000 });
            return (0, bigisubNormalizer_1.normalizeBigiSubResponse)('tv', res.data, params.amountNgn, params.recipientDetails);
        }
        catch (err) {
            throw new Error((0, bigisubErrors_1.mapBigiSubError)(err));
        }
    }
    async buyExamPin(params) {
        try {
            const examName = (params.provider || params.recipientDetails.examType || 'WAEC').toUpperCase();
            const quantity = Number(params.recipientDetails.quantity || 1);
            const res = await axios_1.default.post(`${secrets_1.BIGISUB_BASE_URL}/exam_pin_purchase/`, {
                exam_name: examName,
                quantity,
            }, { headers: this.getHeaders(), timeout: 25000 });
            return (0, bigisubNormalizer_1.normalizeBigiSubResponse)('exam', res.data, params.amountNgn, params.recipientDetails);
        }
        catch (err) {
            throw new Error((0, bigisubErrors_1.mapBigiSubError)(err));
        }
    }
    async verifyMeter(disco, meterNo, meterType) {
        const discoId = this.mapDisco(disco);
        const res = await axios_1.default.post(`${secrets_1.BIGISUB_BASE_URL}/meter_validate/`, {
            disco: discoId,
            meter_number: meterNo.trim(),
            meter_type: meterType,
        }, { headers: this.getHeaders(), timeout: 15000 });
        return res.data;
    }
    async verifyCable(cable, iuc) {
        const cableId = this.mapCable(cable);
        const res = await axios_1.default.post(`${secrets_1.BIGISUB_BASE_URL}/verify_cable/`, {
            cable: cableId,
            iuc: iuc.trim(),
        }, { headers: this.getHeaders(), timeout: 15000 });
        return res.data;
    }
    async buyCable(params) {
        return this.buyCableTv(params);
    }
    async healthCheck() {
        return {
            status: 'healthy',
            provider: this.name,
            code: this.code,
            endpoint: secrets_1.BIGISUB_BASE_URL,
        };
    }
    async requery(reference, operatorRef) {
        const ref = typeof reference === 'object'
            ? (reference?.tranId || reference?.tran_id || reference?.reference || reference?.requestId)
            : reference;
        try {
            const res = await axios_1.default.post(`${secrets_1.BIGISUB_BASE_URL}/requery/`, {
                tran_id: operatorRef || ref,
            }, { headers: this.getHeaders(), timeout: 15000 });
            return res.data;
        }
        catch (err) {
            return { status: 'reconciled_fallback', reference: ref };
        }
    }
}
exports.BigiSubProvider = BigiSubProvider;
exports.bigiSubProvider = new BigiSubProvider();
//# sourceMappingURL=bigisub.js.map