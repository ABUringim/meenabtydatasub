import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider, useWallet } from './context/WalletContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Sidebar } from './components/layout/Sidebar';
import { FundWalletModal } from './components/customer/FundWalletModal';
import { ReceiptModal } from './components/shared/ReceiptModal';
import { storage } from './services/storage';

// Public Pages
import { LandingPage } from './components/public/LandingPage';
import { ServicesOverview } from './components/public/ServicesOverview';
import { RatesPage } from './components/public/RatesPage';
import { ReferenceLookupPage } from './components/public/ReferenceLookupPage';
import { BlogPage } from './components/public/BlogPage';
import { AuthPages } from './components/public/AuthPages';

// Customer Services
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { AirtimeService } from './components/customer/services/AirtimeService';
import { DataService } from './components/customer/services/DataService';
import { ElectricityService } from './components/customer/services/ElectricityService';
import { TvService } from './components/customer/services/TvService';
import { ExamPinService } from './components/customer/services/ExamPinService';
import { RemitService } from './components/customer/services/RemitService';
import { InvoiceService } from './components/customer/services/InvoiceService';
import { GiftCardService } from './components/customer/services/GiftCardService';
import { TransportService } from './components/customer/services/TransportService';
import { TravelService } from './components/customer/services/TravelService';

// Customer Account Pages
import { TransactionsPage } from './components/customer/TransactionsPage';
import { BeneficiariesPage } from './components/customer/BeneficiariesPage';
import { KycPage } from './components/customer/KycPage';
import { SettingsPage } from './components/customer/SettingsPage';
import { SupportPage } from './components/customer/SupportPage';

// Route Guards & Verification (Firebase Auth)
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthRoute } from './components/AuthRoute';
import { VerifyEmailPage } from './components/public/VerifyEmailPage';

// Admin Suite (14 Modules & Dedicated 2FA Authentication)
import { AdminSuite } from './components/admin/AdminSuite';
import { AdminLogin } from './components/admin/AdminLogin';
import { AlertTriangle } from 'lucide-react';

function MainApp() {
  const { user, isAdmin } = useAuth();
  const { activeReceiptTxn, setActiveReceiptTxn, toastMessage } = useWallet();
  const settings = storage.getSettings();

  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('verified') === '1') return 'login';
    }
    return 'landing';
  });
  const [hasVerifiedNotice, setHasVerifiedNotice] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('verified') === '1';
    }
    return false;
  });
  const [verifyEmailTarget, setVerifyEmailTarget] = useState<string>('');
  const [verifyPasswordTarget, setVerifyPasswordTarget] = useState<string>('');
  const [customerTab, setCustomerTab] = useState<string>('overview');
  const [adminTab, setAdminTab] = useState<string>('overview');
  const [isFundWalletOpen, setIsFundWalletOpen] = useState<boolean>(false);
  const [disputePrefillRef, setDisputePrefillRef] = useState<string>('');

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQuickService = (serviceId: string) => {
    setCustomerTab(serviceId);
    setCurrentView('customer-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRaiseDispute = (ref: string) => {
    setDisputePrefillRef(ref);
    setCustomerTab('support');
    setCurrentView('customer-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDashboardView = currentView === 'customer-dashboard';
  const isAdminView = currentView === 'admin-dashboard';
  const isAdminLoginView = currentView === 'admin-login';

  // If in Admin Console, render full AdminSuite without public navbar/footer
  if (isAdminView) {
    return (
      <AdminSuite
        currentTab={adminTab}
        onSelectTab={(tab) => {
          setAdminTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onExitAdmin={() => handleNavigate('customer-dashboard')}
      />
    );
  }

  // Dedicated Admin Login Page
  if (isAdminLoginView) {
    return (
      <AdminLogin
        onSuccess={() => handleNavigate('admin-dashboard')}
        onReturnToHome={() => handleNavigate('landing')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Maintenance Mode Emergency Alert Banner (Configured via Admin Settings) */}
      {settings.maintenanceMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{settings.maintenanceMessage}</span>
        </div>
      )}

      {/* Top Public / Customer Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenFundWallet={() => setIsFundWalletOpen(true)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col">
        {isDashboardView ? (
          <ProtectedRoute
            onRedirectToAuth={() => handleNavigate('login')}
            onRedirectToVerify={(unverifiedEmail) => {
              if (unverifiedEmail) setVerifyEmailTarget(unverifiedEmail);
              handleNavigate('verify-email');
            }}
          >
            <div className="flex-1 flex">
              <Sidebar
                currentTab={customerTab}
                onSelectTab={(tab) => {
                  setCustomerTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenFundWallet={() => {
                  if (!user) {
                    handleNavigate('login');
                  } else {
                    setIsFundWalletOpen(true);
                  }
                }}
                onLogout={() => handleNavigate('login')}
              />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
                {customerTab === 'overview' && (
                  <CustomerDashboard
                    onSelectService={(tab) => setCustomerTab(tab)}
                    onOpenFundWallet={() => {
                      if (!user) {
                        handleNavigate('login');
                      } else {
                        setIsFundWalletOpen(true);
                      }
                    }}
                  />
                )}
                {customerTab === 'service-airtime' && <AirtimeService />}
                {customerTab === 'service-data' && <DataService />}
                {customerTab === 'service-electricity' && <ElectricityService />}
                {customerTab === 'service-tv' && <TvService />}
                {customerTab === 'service-exam' && <ExamPinService />}
                {customerTab === 'service-remit' && (
                  <RemitService onNavigateToKyc={() => setCustomerTab('kyc')} />
                )}
                {customerTab === 'service-invoice' && <InvoiceService />}
                {customerTab === 'service-giftcard' && <GiftCardService />}
                {customerTab === 'service-transport' && <TransportService />}
                {customerTab === 'service-travel' && <TravelService />}
                {customerTab === 'transactions' && (
                  <TransactionsPage
                    onRaiseDispute={handleRaiseDispute}
                    onRepeatService={(tab) => setCustomerTab(tab)}
                  />
                )}
                {customerTab === 'beneficiaries' && (
                  <BeneficiariesPage
                    onUseBeneficiary={(tab) => setCustomerTab(tab)}
                  />
                )}
                {customerTab === 'kyc' && <KycPage />}
                {customerTab === 'settings' && <SettingsPage />}
                {customerTab === 'support' && <SupportPage initialRef={disputePrefillRef} />}
              </main>
            </div>
          </ProtectedRoute>
        ) : (
          <main className="flex-1">
            {currentView === 'landing' && (
              <LandingPage
                onNavigate={handleNavigate}
                onOpenQuickService={handleOpenQuickService}
              />
            )}
            {currentView === 'services-overview' && (
              <ServicesOverview onSelectService={handleOpenQuickService} />
            )}
            {currentView === 'rates' && (
              <RatesPage onNavigateToRegister={() => handleNavigate('register')} />
            )}
            {currentView === 'track-ref' && (
              <ReferenceLookupPage onRaiseDispute={handleRaiseDispute} />
            )}
            {currentView === 'blog' && (
              <BlogPage onNavigateToService={handleOpenQuickService} />
            )}
            {currentView === 'verify-email' && (
              <VerifyEmailPage
                email={verifyEmailTarget || user?.email || 'your email'}
                initialPassword={verifyPasswordTarget}
                onNavigateToLogin={() => handleNavigate('login')}
                onNavigateToDashboard={() => handleNavigate('customer-dashboard')}
              />
            )}
            {currentView === 'login' && (
              <AuthRoute onRedirectToDashboard={() => handleNavigate('customer-dashboard')}>
                <AuthPages
                  initialMode="login"
                  verifiedSuccessNotice={hasVerifiedNotice}
                  onSuccess={() => {
                    setHasVerifiedNotice(false);
                    handleNavigate('customer-dashboard');
                  }}
                  onNavigateMode={(m) => handleNavigate(m)}
                  onRequireVerification={(targetEmail, pwd) => {
                    setVerifyEmailTarget(targetEmail);
                    if (pwd) setVerifyPasswordTarget(pwd);
                    handleNavigate('verify-email');
                  }}
                />
              </AuthRoute>
            )}
            {currentView === 'register' && (
              <AuthRoute onRedirectToDashboard={() => handleNavigate('customer-dashboard')}>
                <AuthPages
                  initialMode="register"
                  onSuccess={() => handleNavigate('customer-dashboard')}
                  onNavigateMode={(m) => handleNavigate(m)}
                  onRequireVerification={(targetEmail, pwd) => {
                    setVerifyEmailTarget(targetEmail);
                    if (pwd) setVerifyPasswordTarget(pwd);
                    handleNavigate('verify-email');
                  }}
                />
              </AuthRoute>
            )}
            {currentView === 'forgot' && (
              <AuthRoute onRedirectToDashboard={() => handleNavigate('customer-dashboard')}>
                <AuthPages
                  initialMode="forgot"
                  onSuccess={() => handleNavigate('login')}
                  onNavigateMode={(m) => handleNavigate(m)}
                  onRequireVerification={(targetEmail, pwd) => {
                    setVerifyEmailTarget(targetEmail);
                    if (pwd) setVerifyPasswordTarget(pwd);
                    handleNavigate('verify-email');
                  }}
                />
              </AuthRoute>
            )}
            {(currentView === 'terms' || currentView === 'privacy' || currentView === 'faq') && (
              <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 space-y-6">
                <button
                  onClick={() => handleNavigate('landing')}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  ← Return to Home
                </button>
                <h1 className="text-2xl font-black text-slate-900 capitalize">
                  {currentView === 'terms'
                    ? 'Terms of Service & Vending Policy'
                    : currentView === 'privacy'
                    ? 'NDPR Privacy & Data Governance'
                    : 'Frequently Asked Questions'}
                </h1>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-4 shadow-xs">
                  <p>
                    Sayyada Datasub Integrated Technologies provides automated telecommunications value-added services
                    (VTU), electricity STS prepaid tokens, and utility payments. Every transaction is processed with
                    server-side cryptographic idempotency keys.
                  </p>
                  <p>
                    All customer wallet top-ups are secured via Paystack PCI-DSS certified gateway with instant ledger
                    verification. In the rare event of upstream carrier timeout, our atomic transaction monitor
                    automatically reverts the wallet balance with zero double debits.
                  </p>
                  <p>
                    For inquiries, contact our 24/7 desk at {settings.supportPhone} or email {settings.supportEmail}.
                  </p>
                </div>
              </div>
            )}
          </main>
        )}
      </div>

      {/* Global Wallet Funding Modal */}
      <FundWalletModal
        isOpen={isFundWalletOpen}
        onClose={() => setIsFundWalletOpen(false)}
      />

      {/* Global Transaction Receipt & Dispute Modal */}
      <ReceiptModal
        transaction={activeReceiptTxn}
        onClose={() => setActiveReceiptTxn(null)}
        onRaiseDispute={handleRaiseDispute}
      />

      {/* Footer */}
      {!isDashboardView && <Footer onNavigate={handleNavigate} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <MainApp />
      </WalletProvider>
    </AuthProvider>
  );
}
