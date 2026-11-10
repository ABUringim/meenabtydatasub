import React, { useState, useEffect, useCallback } from 'react';
import { NetworkProvider, ProductItem } from '../../../types';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  Clock,
  Zap,
  Moon,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
} from 'lucide-react';

export interface DataPricePrediction {
  network: string;
  planName: string;
  currentPriceNgn: number;
  recommendation: 'BUY_NOW' | 'WAIT_OFF_PEAK' | 'ACCUMULATE' | string;
  recommendationTitle: string;
  recommendationDetail: string;
  bestTimeToBuy: string;
  volatilityScore: number;
  volatilityLevel: string;
  expectedSavingsPercent: number;
  targetOffPeakHour?: string;
  trendDirection: 'dropping' | 'stable' | 'rising' | string;
  currentTrendSummary?: string;
  hourlyForecast: Array<{
    time: string;
    priceEstimateNgn: number;
    label: string;
    isCheapest?: boolean;
  }>;
  marketSignals: string[];
}

interface DataPricePredictorWidgetProps {
  network: NetworkProvider;
  selectedPlan: ProductItem | undefined;
  onApplyPlan?: (planId: string) => void;
}

export const DataPricePredictorWidget: React.FC<DataPricePredictorWidgetProps> = ({
  network,
  selectedPlan,
}) => {
  const [prediction, setPrediction] = useState<DataPricePrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [source, setSource] = useState<string>('gemini-3.8-flash');

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    setError(null);

    const priceNgn = selectedPlan ? selectedPlan.selling_price / 100 : 290;
    const planName = selectedPlan?.name || '1.0 GB SME Data';

    try {
      const response = await fetch('/api/ai/predict-data-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network,
          planName,
          currentPriceNgn: priceNgn,
          dataType: selectedPlan?.category || 'SME',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch AI price prediction (HTTP ${response.status})`);
      }

      const data = await response.json();
      setPrediction(data.prediction);
      if (data.source) {
        setSource(data.source);
      }
    } catch (err: any) {
      console.warn('Price predictor error:', err);
      setError(err?.message || 'Could not load AI trend analysis.');
    } finally {
      setLoading(false);
    }
  }, [network, selectedPlan]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  const getRecommendationBadge = () => {
    if (!prediction) return null;
    const rec = prediction.recommendation;

    if (rec === 'WAIT_OFF_PEAK') {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-900',
        cardBg: 'bg-gradient-to-r from-amber-50/80 to-amber-100/50 border-amber-200',
        icon: Moon,
        iconColor: 'text-amber-600',
        tagBg: 'bg-amber-100 text-amber-800',
        glow: 'border-l-4 border-l-amber-500',
      };
    }

    if (rec === 'ACCUMULATE') {
      return {
        bg: 'bg-blue-500/10 border-blue-500/30 text-blue-900',
        cardBg: 'bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border-blue-200',
        icon: TrendingUp,
        iconColor: 'text-blue-600',
        tagBg: 'bg-blue-100 text-blue-800',
        glow: 'border-l-4 border-l-blue-500',
      };
    }

    // Default: BUY_NOW
    return {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900',
      cardBg: 'bg-gradient-to-r from-emerald-50/90 to-teal-50/60 border-emerald-200',
      icon: Zap,
      iconColor: 'text-emerald-600',
      tagBg: 'bg-emerald-100 text-emerald-800',
      glow: 'border-l-4 border-l-emerald-600',
    };
  };

  const badgeStyle = getRecommendationBadge();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
      {/* Top Header Bar */}
      <div className="bg-slate-900 text-white px-4 sm:px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold tracking-tight">
                AI Data Price Predictor & Volatility Radar
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {network} Live
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Intraday volatility modeling · Powered by Gemini 3.8 Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPrediction}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh AI Price Analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Widget' : 'Expand Widget'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {loading && !prediction ? (
            <div className="py-8 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                Analyzing {network} wholesale bandwidth volatility & rates...
              </p>
              <p className="text-[11px] text-slate-400">
                Querying carrier telemetry and historical intra-day pool pricing
              </p>
            </div>
          ) : error && !prediction ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchPrediction}
                className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-bold"
              >
                Retry
              </button>
            </div>
          ) : prediction ? (
            <>
              {/* Verdict Hero Card */}
              <div className={`p-4 rounded-xl border ${badgeStyle?.cardBg} ${badgeStyle?.glow} space-y-2`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {badgeStyle && <badgeStyle.icon className={`w-5 h-5 shrink-0 ${badgeStyle.iconColor}`} />}
                    <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                      {prediction.recommendationTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${badgeStyle?.bg}`}>
                      {prediction.recommendation.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-white/80 px-2 py-1 rounded-md border border-emerald-200 shadow-2xs">
                      Save up to {prediction.expectedSavingsPercent}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {prediction.recommendationDetail}
                </p>

                {/* Best Time to Buy Highlight */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="text-slate-500">Best Time to Buy:</span>
                  <span className="font-bold text-slate-900">{prediction.bestTimeToBuy}</span>
                </div>
              </div>

              {/* Volatility & Market Gauge Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Volatility Index */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Market Volatility</span>
                    <span className="font-mono font-bold text-slate-800">
                      {prediction.volatilityScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        prediction.volatilityScore < 30
                          ? 'bg-emerald-500'
                          : prediction.volatilityScore < 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, prediction.volatilityScore))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">{prediction.volatilityLevel}</p>
                </div>

                {/* 24h Trend Direction */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-medium block">24h Rate Trend</span>
                  <div className="flex items-center gap-1.5">
                    {prediction.trendDirection === 'dropping' ? (
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                    ) : prediction.trendDirection === 'rising' ? (
                      <TrendingUp className="w-4 h-4 text-rose-600" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-xs font-extrabold uppercase text-slate-900">
                      {prediction.trendDirection}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    {prediction.trendDirection === 'dropping'
                      ? 'Wholesale cost declining'
                      : prediction.trendDirection === 'rising'
                      ? 'Carrier demand rising'
                      : 'Stable bandwidth pool'}
                  </p>
                </div>

                {/* Target Off-Peak Window */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-medium block">Lowest Rate Window</span>
                  <div className="flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                      {prediction.targetOffPeakHour || '11:00 PM WAT'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">Peak off-peak savings window</p>
                </div>
              </div>

              {/* 24-Hour Intra-Day Volatility Timeline */}
              {prediction.hourlyForecast && prediction.hourlyForecast.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Intra-Day Rate Forecast Timeline</span>
                    </span>
                    <span className="text-[10px] text-slate-400">All prices in Naira (₦)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {prediction.hourlyForecast.map((point, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          point.isCheapest
                            ? 'bg-emerald-50 border-emerald-500 shadow-2xs ring-1 ring-emerald-500/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-600">
                            {point.time}
                          </span>
                          {point.isCheapest && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          )}
                        </div>

                        <p className={`text-xs font-mono font-extrabold ${point.isCheapest ? 'text-emerald-800' : 'text-slate-900'}`}>
                          ₦{point.priceEstimateNgn.toLocaleString()}
                        </p>

                        <p className="text-[9px] text-slate-500 mt-0.5 truncate leading-tight" title={point.label}>
                          {point.label}
                        </p>

                        {point.isCheapest && (
                          <span className="mt-1 inline-block text-[8px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                            ★ LOWEST
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-time Market Signals */}
              {prediction.marketSignals && prediction.marketSignals.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Info className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Real-Time Carrier Signals ({network})</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    {prediction.marketSignals.map((signal, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold mt-0.5">›</span>
                        <span className="leading-snug">{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer source note */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>
                  Analysis based on live carrier quotas & historical volatility
                </span>
                <span className="font-mono text-emerald-700 font-medium">
                  {source === 'gemini-3.8-flash' ? '⚡ Gemini 3.8 Intelligence' : '📊 Quant Rate Engine'}
                </span>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
