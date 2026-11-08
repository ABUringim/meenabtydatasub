import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/Modal';
import { Beneficiary, BeneficiaryType } from '../../../types';
import { NIGERIAN_BANKS } from '../../../data/initialData';
import { Phone, Zap, Tv, Building2, GraduationCap, Car, CheckCircle } from 'lucide-react';

interface BeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    type: BeneficiaryType;
    label: string;
    value: string;
    provider: string;
    meta?: Record<string, any>;
    additionalInfo?: string;
  }) => void;
  initialBeneficiary?: Beneficiary | null;
}

const CATEGORIES: Array<{ type: BeneficiaryType; label: string; icon: any }> = [
  { type: 'phone', label: 'Phone (Airtime/Data)', icon: Phone },
  { type: 'meter', label: 'Electricity Meter', icon: Zap },
  { type: 'smartcard', label: 'Cable TV Smartcard', icon: Tv },
  { type: 'bank', label: 'Bank Account', icon: Building2 },
  { type: 'exam', label: 'Exam Candidate', icon: GraduationCap },
  { type: 'plate', label: 'Vehicle Toll Plate', icon: Car },
];

const NETWORKS = ['MTN', 'Airtel', 'Glo', '9mobile'];
const DISCOS = [
  'IKEDC (Ikeja Electric)',
  'EKEDC (Eko Electric)',
  'AEDC (Abuja Electric)',
  'KEDCO (Kano Electric)',
  'PHEDC (Port Harcourt)',
  'IBEDC (Ibadan Electric)',
];
const TV_PROVIDERS = ['DSTV', 'GOTV', 'Startimes', 'Showmax'];
const EXAM_BODIES = ['WAEC', 'NECO', 'JAMB', 'NABTEB'];

export const BeneficiaryModal: React.FC<BeneficiaryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBeneficiary,
}) => {
  const isEditing = Boolean(initialBeneficiary);

  const [type, setType] = useState<BeneficiaryType>('phone');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [provider, setProvider] = useState('MTN');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialBeneficiary) {
      setType(initialBeneficiary.type);
      setLabel(initialBeneficiary.label);
      setValue(initialBeneficiary.value);
      setProvider(initialBeneficiary.provider);
      setAdditionalInfo(initialBeneficiary.additionalInfo || '');
      if (initialBeneficiary.meta?.meterType) {
        setMeterType(initialBeneficiary.meta.meterType);
      }
    } else {
      setType('phone');
      setLabel('');
      setValue('');
      setProvider('MTN');
      setMeterType('prepaid');
      setAdditionalInfo('');
    }
    setValidationError('');
  }, [initialBeneficiary, isOpen]);

  // Adjust default provider when type changes
  const handleTypeChange = (newType: BeneficiaryType) => {
    setType(newType);
    setValidationError('');
    if (newType === 'phone') setProvider('MTN');
    else if (newType === 'meter') setProvider('KEDCO (Kano Electric)');
    else if (newType === 'smartcard') setProvider('DSTV');
    else if (newType === 'bank') setProvider(NIGERIAN_BANKS[0].name);
    else if (newType === 'exam') setProvider('WAEC');
    else if (newType === 'plate') setProvider('Cowry Transit / Toll');
  };

  const validateInput = (): boolean => {
    setValidationError('');
    const trimmedVal = value.trim();

    if (!label.trim()) {
      setValidationError('Please enter a descriptive label for this beneficiary.');
      return false;
    }

    if (!trimmedVal) {
      setValidationError('Please provide the account number, meter number, or phone value.');
      return false;
    }

    if (type === 'phone') {
      const cleanPhone = trimmedVal.replace(/\s+/g, '');
      if (!/^(0[789][01]\d{8}|234[789][01]\d{8})$/.test(cleanPhone)) {
        setValidationError('Invalid Nigerian phone number. Format: 08012345678 or 08145239871.');
        return false;
      }
    } else if (type === 'meter') {
      if (!/^\d{8,13}$/.test(trimmedVal)) {
        setValidationError('Meter number must be between 8 and 13 digits.');
        return false;
      }
    } else if (type === 'smartcard') {
      if (!/^\d{8,12}$/.test(trimmedVal)) {
        setValidationError('Smartcard/IUC number must be between 8 and 12 digits.');
        return false;
      }
    } else if (type === 'bank') {
      if (!/^\d{10}$/.test(trimmedVal)) {
        setValidationError('Nigerian NUBAN bank account number must be exactly 10 digits.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSave({
        type,
        label: label.trim(),
        value: value.trim(),
        provider,
        meta: {
          ...(type === 'meter' ? { meterType } : {}),
        },
        additionalInfo: additionalInfo.trim() || undefined,
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Saved Beneficiary' : 'Enroll New Beneficiary'}
      subtitle={
        isEditing
          ? 'Update label or provider configuration for this stored contact'
          : 'Save frequent recipients for 1-click auto-fill during checkout'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selector Grid */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Beneficiary Service Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = type === cat.type;
              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => handleTypeChange(cat.type)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold truncate">{cat.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Label Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Beneficiary Label (Nickname / Owner) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. My Personal MTN Line / Kano House Meter"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
        </div>

        {/* Identifier Value */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {type === 'phone'
              ? 'Phone Number'
              : type === 'meter'
              ? 'Electricity Meter Number'
              : type === 'smartcard'
              ? 'Smartcard / IUC Number'
              : type === 'bank'
              ? '10-Digit NUBAN Account Number'
              : type === 'exam'
              ? 'Candidate Registration / Phone'
              : 'Vehicle Plate / Toll ID'}{' '}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              type === 'phone'
                ? '08145239871'
                : type === 'meter'
                ? '04182910492'
                : type === 'smartcard'
                ? '1092837461'
                : type === 'bank'
                ? '0123456789'
                : 'Enter identifier'
            }
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
        </div>

        {/* Provider Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Provider / Operator
            </label>
            {type === 'phone' && (
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {NETWORKS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            )}

            {type === 'meter' && (
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {DISCOS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {type === 'smartcard' && (
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {TV_PROVIDERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            {type === 'bank' && (
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {type === 'exam' && (
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {EXAM_BODIES.map((eb) => (
                  <option key={eb} value={eb}>
                    {eb}
                  </option>
                ))}
              </select>
            )}

            {type === 'plate' && (
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Cowry Transit / LCC Toll"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            )}
          </div>

          {/* Conditional sub-field: Meter Type */}
          {type === 'meter' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meter Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMeterType('prepaid')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    meterType === 'prepaid'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Prepaid (STS)
                </button>
                <button
                  type="button"
                  onClick={() => setMeterType('postpaid')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    meterType === 'postpaid'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Postpaid
                </button>
              </div>
            </div>
          )}

          {/* Optional additional notes */}
          {type !== 'meter' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Notes / Location
              </label>
              <input
                type="text"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="e.g. Living room / Kano office"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {validationError}
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Save Beneficiary'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
