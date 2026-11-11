import React, { useState } from 'react';
import { useWallet } from '../../../context/WalletContext';
import { formatKoboToNgn, generateReference, isValidNigerianPhone } from '../../../lib/formatters';
import { PinConfirmModal } from '../../shared/PinConfirmModal';
import { GraduationCap, Zap, AlertCircle } from 'lucide-react';
import { ProductItem } from '../../../types';
import ServiceAccessButton from '../../services/ServiceAccessButton';

export const ExamPinService: React.FC = () => {
  const { products, vend, balanceKobo } = useWallet();

  const [selectedExamId, setSelectedExamId] = useState<string>('exam-waec-checker');
  const [quantity, setQuantity] = useState<number>(1);
  const [phone, setPhone] = useState<string>('');
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const examProducts = products.filter((p) => p.service === 'exam' && p.active);
  const selectedProduct: ProductItem | undefined =
    examProducts.find((p) => p.id === selectedExamId) || examProducts[0];

  const totalSellingKobo = (selectedProduct?.selling_price || 0) * quantity;
  const totalCostKobo = (selectedProduct?.cost_price || 0) * quantity;
  const totalProfitKobo = totalSellingKobo - totalCostKobo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select an exam PIN type');
      return;
    }
    if (!isValidNigerianPhone(phone)) {
      setError('Please enter a valid Nigerian phone number for SMS delivery');
      return;
    }
    if (quantity < 1 || quantity > 20) {
      setError('Quantity must be between 1 and 20');
      return;
    }
    if (totalSellingKobo > balanceKobo) {
      setError(
        `Insufficient wallet balance. Total required is ${formatKoboToNgn(
          totalSellingKobo
        )}, but your balance is ${formatKoboToNgn(balanceKobo)}.`
      );
      return;
    }

    setIsPinModalOpen(true);
  };

  const handleConfirmVend = async () => {
    if (!selectedProduct) return;
    setIsLoading(true);
    try {
      const reference = generateReference('SD_EXAM');
      await vend({
        service: 'exam',
        provider: selectedProduct.provider,
        amountKobo: totalSellingKobo,
        costKobo: totalCostKobo,
        profitKobo: totalProfitKobo,
        reference,
        recipientDetails: {
          examType: selectedProduct.name,
          quantity,
          phone,
        },
      });

      setIsPinModalOpen(false);
      setPhone('');
      setQuantity(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">School & Exam e-PINs</h2>
            <p className="text-xs text-slate-500">
              Instant delivery of WAEC, NECO, JAMB & NABTEB result checker PINs & tokens
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Exam Type Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Examination Body
            </label>
            <div className="space-y-2">
              {examProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedExamId(p.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedExamId === p.id
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{p.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Instant Serial & PIN Generation</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-emerald-800">
                      {formatKoboToNgn(p.selling_price)}
                    </span>
                    <ServiceAccessButton
                      product={p}
                      onBuy={(product: ProductItem) => {
                        setSelectedExamId(product.id);
                        if (!phone) {
                          setError('Please enter a recipient phone number first');
                          return;
                        }
                        setIsPinModalOpen(true);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quantity of PINs
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 5, 10].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-md border transition-colors ${
                    quantity === q
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Phone for SMS notification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Recipient Phone Number (for SMS Delivery Backup)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 08145239871"
              maxLength={11}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Price Summary */}
          {selectedProduct && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Unit Price:</span>
                <span className="font-mono">{formatKoboToNgn(selectedProduct.selling_price)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Quantity:</span>
                <span className="font-semibold">{quantity} unit(s)</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="font-mono">{formatKoboToNgn(totalSellingKobo)}</span>
              </div>
            </div>
          )}

          {selectedProduct ? (
            <ServiceAccessButton
              product={{
                ...selectedProduct,
                selling_price: totalSellingKobo,
              }}
              onBuy={() => {
                if (!isValidNigerianPhone(phone)) {
                  setError('Please enter a valid Nigerian phone number for SMS delivery');
                  return;
                }
                setIsPinModalOpen(true);
              }}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            />
          ) : (
            <button
              type="submit"
              disabled={true}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs opacity-50"
            >
              <Zap className="w-4 h-4 text-emerald-300" />
              <span>Select an exam to proceed</span>
            </button>
          )}
        </form>
      </div>

      <PinConfirmModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmVend}
        amountKobo={totalSellingKobo}
        recipientDescription={`${quantity}x ${selectedProduct?.name} for ${phone}`}
        isLoading={isLoading}
      />
    </div>
  );
};
