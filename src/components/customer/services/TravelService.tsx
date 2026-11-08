import React, { useState } from 'react';
import { useWallet } from '../../../context/WalletContext';
import { formatNgn, formatKoboToNgn, generateReference } from '../../../lib/formatters';
import { PinConfirmModal } from '../../shared/PinConfirmModal';
import { Plane, Zap, AlertCircle } from 'lucide-react';

export const TravelService: React.FC = () => {
  const { vend, balanceKobo } = useWallet();

  const [bookingType, setBookingType] = useState<'flight' | 'hotel'>('flight');
  const [route, setRoute] = useState<string>('Kano (KAN) → Abuja (ABV)');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [passengerName, setPassengerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [amountNgn, setAmountNgn] = useState<number>(75000);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const routes = [
    'Kano (KAN) → Abuja (ABV)',
    'Kano (KAN) → Lagos (LOS)',
    'Abuja (ABV) → Lagos (LOS)',
    'Lagos (LOS) → Port Harcourt (PHC)',
    'Abuja (ABV) → Enugu (ENU)',
  ];

  const hotels = [
    'Tahil Cliff Luxury Hotel, Kano',
    'Transcorp Hilton, Abuja FCT',
    'Eko Hotels & Suites, Victoria Island, Lagos',
    'Bristol Palace Hotel, Farm Centre, Kano',
  ];

  const totalKobo = amountNgn * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName || passengerName.length < 3) {
      setError('Please enter passenger / guest full legal name (matching government ID)');
      return;
    }
    if (!phone) {
      setError('Please enter contact telephone number');
      return;
    }
    if (totalKobo > balanceKobo) {
      setError(
        `Insufficient wallet balance. Total needed is ${formatKoboToNgn(
          totalKobo
        )}, but your balance is ${formatKoboToNgn(balanceKobo)}.`
      );
      return;
    }

    setIsPinModalOpen(true);
  };

  const handleConfirmVend = async () => {
    setIsLoading(true);
    try {
      const reference = generateReference('SD_TRAVEL');
      await vend({
        service: 'travel',
        provider: bookingType === 'flight' ? 'Air Peace / Max Air' : 'Partner Hotel Suites',
        amountKobo: totalKobo,
        costKobo: Math.round(totalKobo * 0.96),
        profitKobo: Math.round(totalKobo * 0.04),
        reference,
        recipientDetails: {
          bookingType,
          route,
          date,
          passengerName,
          phone,
        },
      });

      setIsPinModalOpen(false);
      setPassengerName('');
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
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Travel & Hotel Vouchers</h2>
            <p className="text-xs text-slate-500">
              Direct wallet booking for domestic flights (Max Air, Air Peace) & verified hotel reservations
            </p>
          </div>
        </div>

        {/* Booking type tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-4">
          <button
            type="button"
            onClick={() => {
              setBookingType('flight');
              setRoute(routes[0]);
              setAmountNgn(75000);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${
              bookingType === 'flight' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Domestic Flights
          </button>
          <button
            type="button"
            onClick={() => {
              setBookingType('hotel');
              setRoute(hotels[0]);
              setAmountNgn(45000);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${
              bookingType === 'hotel' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Hotel Booking Voucher
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Destination */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {bookingType === 'flight' ? 'Flight Route' : 'Hotel Destination'}
            </label>
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              {(bookingType === 'flight' ? routes : hotels).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {bookingType === 'flight' ? 'Departure Date' : 'Check-In Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Passenger Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Legal Passenger / Guest Name
            </label>
            <input
              type="text"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              placeholder="e.g. ABUBAKAR BELLO RINGIM"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact Phone Number
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

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fare / Rate (₦)
            </label>
            <input
              type="number"
              min={10000}
              max={500000}
              value={amountNgn}
              onChange={(e) => setAmountNgn(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>Book & Pay {formatNgn(amountNgn)}</span>
          </button>
        </form>
      </div>

      <PinConfirmModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmVend}
        amountKobo={totalKobo}
        recipientDescription={`${bookingType.toUpperCase()} for ${passengerName} (${route})`}
        isLoading={isLoading}
      />
    </div>
  );
};
