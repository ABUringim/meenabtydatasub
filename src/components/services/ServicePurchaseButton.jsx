import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import FundWalletModal from '../wallet/FundWalletModal';
import { Zap, PlusCircle } from 'lucide-react';

/**
 * @param {Object} props
 * @param {any} [props.product]
 * @param {(product?: any) => void} [props.onBuy]
 * @param {string} [props.className]
 */
export default function ServicePurchaseButton({
  product = {},
  onBuy = (_product) => {},
  className = '',
}) {
  const { balanceKobo } = useWallet();
  const { user } = useAuth();
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [prefillAmount, setPrefillAmount] = useState(null);

  // In Sayyada Datasub, balanceKobo and product.selling_price are both stored in kobo
  const currentBalance = balanceKobo ?? user?.wallet_balance ?? 0;
  const sellingPrice = product?.selling_price ?? product?.priceKobo ?? 0;

  // Determine affordability
  const canAfford = currentBalance >= sellingPrice;

  // Calculate top-up deficit in Naira
  const deficitKobo = Math.max(0, sellingPrice - currentBalance);
  // Convert kobo to Naira (rounded up to nearest Naira, minimum ₦100)
  const deficitNaira = Math.max(100, Math.ceil(deficitKobo / 100));

  if (canAfford) {
    return (
      <button
        type="button"
        onClick={() => onBuy && onBuy(product)}
        className={
          className ||
          'py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer'
        }
      >
        <Zap className="w-3.5 h-3.5 text-emerald-300" />
        <span>Buy Now</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPrefillAmount(deficitNaira);
          setFundModalOpen(true);
        }}
        className={
          className ||
          'py-2 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer'
        }
        title={`Wallet balance is insufficient. Click to fund ₦${deficitNaira.toLocaleString()}`}
      >
        <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
        <span>Top Up to Buy</span>
      </button>

      <FundWalletModal
        open={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        prefilledAmount={prefillAmount}
      />
    </>
  );
}

export { ServicePurchaseButton };
