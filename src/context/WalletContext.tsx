import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Transaction,
  Beneficiary,
  ProductItem,
  DisputeTicket,
  ServiceCategory,
  CustomerActivity,
  CustomerReceipt,
  CustomerSpending,
} from '../types';
import { storage } from '../services/storage';
import { vtuProvider, VendingRequestPayload } from '../services/vtuProvider';
import { paystack } from '../services/paystack';
import { useAuth } from './AuthContext';
import { logger } from '../lib/logger';

export interface VendedRecipientPrompt {
  service: ServiceCategory;
  recipient: string;
  provider: string;
}

interface WalletContextType {
  balanceKobo: number;
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  activities: CustomerActivity[];
  receipts: CustomerReceipt[];
  spending: CustomerSpending[];
  products: ProductItem[];
  disputes: DisputeTicket[];
  activeReceiptTxn: Transaction | null;
  setActiveReceiptTxn: (txn: Transaction | null) => void;
  recentVendedRecipient: VendedRecipientPrompt | null;
  setRecentVendedRecipient: (val: VendedRecipientPrompt | null) => void;
  dismissBeneficiaryPrompt: () => void;
  fundWallet: (amountNgn: number) => Promise<boolean>;
  vend: (payload: Omit<VendingRequestPayload, 'userId'>) => Promise<Transaction>;
  addBeneficiary: (b: Omit<Beneficiary, 'id' | 'user_id' | 'created_at'>) => void;
  updateBeneficiary: (id: string, updates: Partial<Beneficiary>) => void;
  deleteBeneficiary: (id: string) => void;
  createDispute: (txnRef: string, description: string) => Promise<boolean>;
  refreshAll: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [spending, setSpending] = useState<CustomerSpending[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeTicket[]>([]);
  const [activeReceiptTxn, setActiveReceiptTxn] = useState<Transaction | null>(null);
  const [recentVendedRecipient, setRecentVendedRecipient] = useState<VendedRecipientPrompt | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const dismissBeneficiaryPrompt = () => {
    setRecentVendedRecipient(null);
  };

  const loadData = () => {
    if (!user) return;
    const txns = user.role === 'admin' ? storage.getTransactions() : storage.getUserTransactions(user.uid);
    setTransactions(txns);
    setBeneficiaries(storage.getBeneficiaries(user.uid));
    setActivities(storage.getActivities(user.uid));
    setReceipts(storage.getReceipts(user.uid));
    setSpending(storage.getSpending(user.uid));
    setProducts(storage.getProducts());
    setDisputes(
      user.role === 'admin'
        ? storage.getDisputes()
        : storage.getDisputes().filter((d) => d.user_id === user.uid)
    );
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const fundWallet = async (amountNgn: number): Promise<boolean> => {
    if (!user) return false;
    const amountKobo = amountNgn * 100;

    await paystack.processFunding({
      email: user.email,
      amountKobo,
      userId: user.uid,
      onSuccess: () => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
        storage.recordUserActivity(
          user.uid,
          'fund_wallet',
          `Wallet Funded ₦${amountNgn.toLocaleString()} via Paystack`,
          amountKobo,
          'success'
        );
        logger.walletFunded({
          amountNgn,
          userId: user.uid,
          reference: `FUND_${Date.now()}`,
          method: 'paystack',
        });
        showToast(`Successfully credited ₦${amountNgn.toLocaleString()} to your wallet!`);
        refreshUser();
        loadData();
      },
      onCancel: () => {
        logger.warn('wallet', 'Wallet funding cancelled by customer', { userId: user.uid, amountNgn });
        showToast('Wallet funding cancelled');
      },
    });

    return true;
  };

  const vend = async (payload: Omit<VendingRequestPayload, 'userId'>): Promise<Transaction> => {
    if (!user) throw new Error('Authentication required');

    const fullPayload: VendingRequestPayload = {
      ...payload,
      userId: user.uid,
    };

    const result = await vtuProvider.vendService(fullPayload);
    refreshUser();
    loadData();

    if (result.status === 'success') {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
      logger.transactionCompleted({
        service: payload.service,
        provider: payload.provider,
        amountNgn: result.amount / 100,
        reference: result.reference,
        status: 'success',
      });
      showToast(`${payload.service.toUpperCase()} delivered successfully!`);
      setActiveReceiptTxn(result);

      // Check if recipient is already a beneficiary; if not, trigger inline banner
      const recVal =
        payload.recipientDetails.phone ||
        payload.recipientDetails.meterNo ||
        payload.recipientDetails.smartcardNo ||
        payload.recipientDetails.accountNumber;
      if (recVal) {
        const alreadySaved = storage.getBeneficiaries(user.uid).some((b) => b.value.trim() === recVal.trim());
        if (!alreadySaved) {
          setRecentVendedRecipient({
            service: payload.service,
            recipient: recVal,
            provider: payload.provider,
          });
        }
      }
    } else {
      showToast(`Transaction failed: ${result.failure_reason || 'Auto-refunded to wallet'}`);
    }

    return result;
  };

  const addBeneficiary = (b: Omit<Beneficiary, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const item: Beneficiary = {
      ...b,
      id: `ben_${Date.now()}`,
      user_id: user.uid,
      created_at: new Date().toISOString(),
    };
    storage.addBeneficiary(item);
    setBeneficiaries(storage.getBeneficiaries(user.uid));
    setActivities(storage.getActivities(user.uid));
    showToast(`Saved beneficiary: ${b.label}`);
  };

  const updateBeneficiary = (id: string, updates: Partial<Beneficiary>) => {
    if (!user) return;
    storage.updateBeneficiary(id, updates);
    setBeneficiaries(storage.getBeneficiaries(user.uid));
    showToast('Beneficiary updated successfully');
  };

  const deleteBeneficiary = (id: string) => {
    if (!user) return;
    storage.deleteBeneficiary(id);
    setBeneficiaries(storage.getBeneficiaries(user.uid));
    showToast('Beneficiary removed');
  };

  const createDispute = async (txnRef: string, description: string): Promise<boolean> => {
    if (!user) return false;
    const txn = storage.getTransactionByReference(txnRef);
    if (!txn) {
      showToast('Error: Transaction reference not found.');
      return false;
    }

    const ticket: DisputeTicket = {
      id: `disp_${Date.now()}`,
      transaction_id: txn.id,
      transaction_ref: txn.reference,
      user_id: user.uid,
      user_email: user.email,
      user_phone: user.phone,
      service: txn.service,
      amount: txn.amount,
      status: 'open',
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    storage.createDispute(ticket);
    storage.recordUserActivity(
      user.uid,
      'dispute_raised',
      `Dispute Raised for ref ${txn.reference}`,
      txn.amount,
      'pending',
      txn.reference
    );
    setDisputes(storage.getDisputes().filter((d) => d.user_id === user.uid));
    setActivities(storage.getActivities(user.uid));
    showToast('Dispute ticket raised. Our support team will investigate.');
    return true;
  };

  return (
    <WalletContext.Provider
      value={{
        balanceKobo: user?.wallet_balance || 0,
        transactions,
        beneficiaries,
        activities,
        receipts,
        spending,
        products,
        disputes,
        activeReceiptTxn,
        setActiveReceiptTxn,
        recentVendedRecipient,
        setRecentVendedRecipient,
        dismissBeneficiaryPrompt,
        fundWallet,
        vend,
        addBeneficiary,
        updateBeneficiary,
        deleteBeneficiary,
        createDispute,
        refreshAll: () => {
          refreshUser();
          loadData();
        },
        toastMessage,
        showToast,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
};
