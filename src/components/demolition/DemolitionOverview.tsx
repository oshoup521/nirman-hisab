import React from 'react';
import { Hammer, Trash2, Package, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { useAppContext } from '../../context/AppContext';

export default function DemolitionOverview() {
  const { state, calcs } = useAppContext();
  const { malwaCost, demolitionThekaCost, demolitionThekaPending, scrapIncome, brickRecoveryValue, totalRecovery } = calcs;

  const totalKharcha = malwaCost + demolitionThekaCost;
  const net = totalRecovery - totalKharcha;
  const isProfit = net >= 0;

  const totalBricks = state.brickRecovery.reduce((a, b) => a + b.recovered, 0);
  const brokenBricks = state.brickRecovery.reduce((a, b) => a + b.broken, 0);

  return (
    <div className="space-y-3">
      {/* 1 — Net Bachat hero */}
      <div className={cn(
        'rounded-3xl p-5',
        isProfit
          ? 'bg-gradient-to-br from-emerald-500 to-green-600'
          : 'bg-gradient-to-br from-red-500 to-rose-600'
      )}>
        <p className="text-white/70 text-[10px] font-bold uppercase tracking-wide">Net Bachat</p>
        <p className="text-white/60 text-[10px] mt-0.5">Kamai − Kharcha (Paid)</p>
        <p className="text-white text-4xl font-bold mt-2 leading-none">
          {isProfit ? '' : '−'}{formatCurrency(Math.abs(net))}
        </p>
        <p className={cn('text-xs font-bold mt-2', isProfit ? 'text-green-100' : 'text-red-200')}>
          {isProfit && net > 0 ? 'Tod-phod se faayda ho raha hai 👍' : net === 0 ? 'Break even' : 'Abhi nuksaan hai — kamai badhao'}
        </p>
      </div>

      {/* 2 — Kharcha vs Kamai */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={13} className="text-red-400" />
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Kharcha</p>
          </div>
          <p className="text-xl font-bold text-red-600 leading-none">{formatCurrency(totalKharcha)}</p>
          {demolitionThekaPending > 0 && (
            <p className="text-[10px] text-orange-500 font-bold mt-1.5">
              +{formatCurrency(demolitionThekaPending)} baaki
            </p>
          )}
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={13} className="text-emerald-500" />
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Kamai</p>
          </div>
          <p className="text-xl font-bold text-emerald-600 leading-none">{formatCurrency(totalRecovery)}</p>
        </div>
      </div>

      {/* 3 — Bricks Recovered (prominent) */}
      {totalBricks > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              🧱
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Eetein Bachai</p>
              <p className="text-3xl font-bold text-amber-900 leading-none mt-0.5">
                {formatNumber(totalBricks)}
                <span className="text-sm font-bold text-amber-600 ml-1">pcs</span>
              </p>
              {brokenBricks > 0 && (
                <p className="text-[10px] text-slate-400 font-bold mt-1">{formatNumber(brokenBricks)} tooti hui</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Value</p>
            <p className="font-bold text-emerald-600 text-lg mt-0.5">{formatCurrency(brickRecoveryValue)}</p>
          </div>
        </div>
      )}

      {/* 4 — Itemised breakdown */}
      {(malwaCost > 0 || demolitionThekaCost > 0 || demolitionThekaPending > 0 || scrapIncome > 0 || brickRecoveryValue > 0) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {malwaCost > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Trash2 size={13} className="text-slate-400" />
                </div>
                <span className="text-sm text-slate-600">Malwa Disposal</span>
              </div>
              <span className="font-bold text-red-500 text-sm">−{formatCurrency(malwaCost)}</span>
            </div>
          )}
          {demolitionThekaCost > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Hammer size={13} className="text-slate-400" />
                </div>
                <span className="text-sm text-slate-600">Theka Diya (Paid)</span>
              </div>
              <span className="font-bold text-red-500 text-sm">−{formatCurrency(demolitionThekaCost)}</span>
            </div>
          )}
          {demolitionThekaPending > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Hammer size={13} className="text-orange-400" />
                </div>
                <span className="text-sm text-slate-600">Theka Baaki (Pending)</span>
              </div>
              <span className="font-bold text-orange-500 text-sm">−{formatCurrency(demolitionThekaPending)}</span>
            </div>
          )}
          {scrapIncome > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Package size={13} className="text-emerald-500" />
                </div>
                <span className="text-sm text-slate-600">Scrap / Kabaad</span>
              </div>
              <span className="font-bold text-emerald-600 text-sm">+{formatCurrency(scrapIncome)}</span>
            </div>
          )}
          {brickRecoveryValue > 0 && (
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Layers size={13} className="text-amber-500" />
                </div>
                <span className="text-sm text-slate-600">Eent Recovery Value</span>
              </div>
              <span className="font-bold text-emerald-600 text-sm">+{formatCurrency(brickRecoveryValue)}</span>
            </div>
          )}
        </div>
      )}

      {/* 5 — Thekedar Status */}
      {(state.demolitionThekas || []).length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">Thekedar Status</p>
          {(state.demolitionThekas || []).map(t => {
            const paid = t.payments.reduce((a, p) => a + p.amount, 0);
            const pending = t.totalAmount - paid;
            const pct = t.totalAmount > 0 ? (paid / t.totalAmount) * 100 : 0;
            const done = pct >= 100;
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full inline-block mt-1">
                      {t.workType}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-bold text-sm', done ? 'text-emerald-600' : 'text-red-500')}>
                      {done ? '✓ Full paid' : `−${formatCurrency(pending)}`}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{done ? 'Complete' : 'Baaki hai'}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all', done ? 'bg-emerald-500' : 'bg-orange-500')}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <p className="text-[10px] text-slate-400">Diya: {formatCurrency(paid)}</p>
                  <p className="text-[10px] text-slate-400">{pct.toFixed(0)}% complete</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
