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
          ? 'bg-emerald-600 dark:bg-emerald-500/20 dark:border dark:border-emerald-500/30'
          : 'bg-red-600 dark:bg-red-500/20 dark:border dark:border-red-500/30'
      )}>
        <p className={cn("text-caption font-bold uppercase tracking-wide", isProfit ? "text-emerald-100 dark:text-emerald-400" : "text-red-100 dark:text-red-400")}>Net Bachat</p>
        <p className={cn("text-caption mt-0.5", isProfit ? "text-emerald-200 dark:text-emerald-500/80" : "text-red-200 dark:text-red-500/80")}>Kamai − Kharcha (Paid)</p>
        <p className={cn("text-display font-bold mt-2 leading-none", isProfit ? "text-surface dark:text-emerald-300" : "text-surface dark:text-red-300")}>
          {isProfit ? '' : '−'}{formatCurrency(Math.abs(net))}
        </p>
        <p className={cn('text-body-sm font-bold mt-2', isProfit ? 'text-emerald-100 dark:text-emerald-400/80' : 'text-red-200 dark:text-red-400/80')}>
          {isProfit && net > 0 ? 'Tod-phod se faayda ho raha hai 👍' : net === 0 ? 'Break even' : 'Abhi nuksaan hai — kamai badhao'}
        </p>
      </div>

      {/* 2 — Kharcha vs Kamai */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={13} className="text-red-500" />
            <p className="text-caption font-bold text-red-500 uppercase tracking-wide">Kharcha</p>
          </div>
          <p className="text-title-lg font-bold text-red-600 dark:text-red-400 leading-none">{formatCurrency(totalKharcha)}</p>
          {demolitionThekaPending > 0 && (
            <p className="text-caption text-amber-500 font-bold mt-1.5">
              +{formatCurrency(demolitionThekaPending)} baaki
            </p>
          )}
        </div>
        <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={13} className="text-emerald-500" />
            <p className="text-caption font-bold text-emerald-500 uppercase tracking-wide">Kamai</p>
          </div>
          <p className="text-title-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none">{formatCurrency(totalRecovery)}</p>
        </div>
      </div>

      {/* 3 — Bricks Recovered (prominent) */}
      {totalBricks > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              🧱
            </div>
            <div>
              <p className="text-caption font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wide">Eetein Bachai</p>
              <p className="text-display font-bold text-amber-700 dark:text-amber-400 leading-none mt-0.5">
                {formatNumber(totalBricks)}
                <span className="text-body-sm font-bold text-amber-600 dark:text-amber-500 ml-1">pcs</span>
              </p>
              {brokenBricks > 0 && (
                <p className="text-caption text-text-subdued font-bold mt-1">{formatNumber(brokenBricks)} tooti hui</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-caption text-text-subdued font-bold uppercase">Value</p>
            <p className="text-title-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(brickRecoveryValue)}</p>
          </div>
        </div>
      )}

      {/* 4 — Itemised breakdown */}
      {(malwaCost > 0 || demolitionThekaCost > 0 || demolitionThekaPending > 0 || scrapIncome > 0 || brickRecoveryValue > 0) && (
        <div className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
          {malwaCost > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-b border-border-subdued">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-surface-subdued rounded-lg flex items-center justify-center">
                  <Trash2 size={13} className="text-text-secondary" />
                </div>
                <span className="text-body-sm text-text-secondary">Malwa Disposal</span>
              </div>
              <span className="text-body-sm font-bold text-red-500">−{formatCurrency(malwaCost)}</span>
            </div>
          )}
          {demolitionThekaCost > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-b border-border-subdued">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-surface-subdued rounded-lg flex items-center justify-center">
                  <Hammer size={13} className="text-text-secondary" />
                </div>
                <span className="text-body-sm text-text-secondary">Theka Diya (Paid)</span>
              </div>
              <span className="text-body-sm font-bold text-red-500">−{formatCurrency(demolitionThekaCost)}</span>
            </div>
          )}
          {demolitionThekaPending > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-b border-border-subdued">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Hammer size={13} className="text-amber-500" />
                </div>
                <span className="text-body-sm text-text-secondary">Theka Baaki (Pending)</span>
              </div>
              <span className="text-body-sm font-bold text-amber-500">−{formatCurrency(demolitionThekaPending)}</span>
            </div>
          )}
          {scrapIncome > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-b border-border-subdued">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Package size={13} className="text-emerald-500" />
                </div>
                <span className="text-body-sm text-text-secondary">Scrap / Kabaad</span>
              </div>
              <span className="text-body-sm font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(scrapIncome)}</span>
            </div>
          )}
          {brickRecoveryValue > 0 && (
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Layers size={13} className="text-amber-500" />
                </div>
                <span className="text-body-sm text-text-secondary">Eent Recovery Value</span>
              </div>
              <span className="text-body-sm font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(brickRecoveryValue)}</span>
            </div>
          )}
        </div>
      )}

      {/* 5 — Thekedar Status */}
      {(state.demolitionThekas || []).length > 0 && (
        <div className="space-y-2.5">
          <p className="text-caption font-bold text-text-subdued uppercase tracking-wide px-1">Thekedar Status</p>
          {(state.demolitionThekas || []).map(t => {
            const paid = t.payments.reduce((a, p) => a + p.amount, 0);
            const pending = t.totalAmount - paid;
            const pct = t.totalAmount > 0 ? (paid / t.totalAmount) * 100 : 0;
            const done = pct >= 100;
            return (
              <div key={t.id} className="bg-surface rounded-2xl border border-border-default shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-heading text-title font-bold text-text-primary">{t.name}</p>
                    <span className="text-caption font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full inline-block mt-1">
                      {t.workType}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-bold text-body-sm', done ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                      {done ? '✓ Full paid' : `−${formatCurrency(pending)}`}
                    </p>
                    <p className="text-caption text-text-subdued mt-0.5">{done ? 'Complete' : 'Baaki hai'}</p>
                  </div>
                </div>
                <div className="w-full bg-border-default h-1.5 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all', done ? 'bg-emerald-500' : 'bg-amber-500')}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <p className="text-caption text-text-subdued">Diya: {formatCurrency(paid)}</p>
                  <p className="text-caption text-text-subdued">{pct.toFixed(0)}% complete</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
