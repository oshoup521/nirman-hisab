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
    <>
    {/* ═══ DESKTOP ═══ */}
    <div className="hidden md:block space-y-6">
      {/* Top Stats Row: 3 side-by-side cards */}
      <div className="grid grid-cols-3 gap-5">
        {/* Net Bachat Card */}
        <div className={cn(
          'bg-surface p-6 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]',
          isProfit ? 'border-emerald-500/20' : 'border-red-500/20'
        )}>
          <div className={cn('absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-20', isProfit ? 'bg-emerald-500' : 'bg-red-500')} />
          <div>
            <p className="text-caption font-bold text-text-subdued uppercase tracking-widest">Net Bachat</p>
            <p className="text-caption text-text-subdued mt-0.5">Kamai − Kharcha (Paid)</p>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <p className={cn("text-display font-bold leading-none", isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
              {isProfit ? '' : '−'}{formatCurrency(Math.abs(net))}
            </p>
            <div className={cn('px-2.5 py-1 rounded-lg text-caption font-bold', isProfit ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600')}>
              {isProfit ? <TrendingUp size={14} className="inline mr-1" /> : <TrendingDown size={14} className="inline mr-1" />}
              {isProfit ? 'PROFIT' : 'LOSS'}
            </div>
          </div>
        </div>

        {/* Kharcha Card */}
        <div className="bg-surface p-6 rounded-3xl border border-border-default shadow-sm min-h-[140px] flex flex-col justify-between">
          <div>
            <p className="text-caption font-bold text-text-subdued uppercase tracking-widest">Total Kharcha</p>
            <p className="text-caption text-text-subdued mt-0.5">Theka + Malwa</p>
          </div>
          <div className="mt-4">
            <p className="text-display font-bold text-text-primary leading-none">{formatCurrency(totalKharcha)}</p>
            {demolitionThekaPending > 0 && (
              <p className="text-caption text-amber-500 font-bold mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {formatCurrency(demolitionThekaPending)} baaki
              </p>
            )}
          </div>
        </div>

        {/* Kamai Card */}
        <div className="bg-surface p-6 rounded-3xl border border-border-default shadow-sm min-h-[140px] flex flex-col justify-between">
          <div>
            <p className="text-caption font-bold text-text-subdued uppercase tracking-widest">Total Kamai</p>
            <p className="text-caption text-text-subdued mt-0.5">Scrap + Bricks</p>
          </div>
          <div className="mt-4">
            <p className="text-display font-bold text-text-primary leading-none">{formatCurrency(totalRecovery)}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Breakdown & Bricks (Left) | Thekedar Status (Right) */}
      <div className="grid grid-cols-5 gap-6 items-start">
        {/* Left Column: 2 units */}
        <div className="col-span-2 space-y-6">
          {/* Bricks Stats */}
          {totalBricks > 0 && (
            <div className="bg-surface p-6 rounded-3xl border border-border-default shadow-sm relative overflow-hidden">
               <div className="absolute -right-2 -top-2 text-4xl opacity-10 rotate-12 select-none">🧱</div>
               <p className="text-caption font-bold text-text-subdued uppercase tracking-widest mb-4">Brick Recovery</p>
               <div className="flex justify-between items-end">
                  <div>
                    <p className="text-display-sm font-bold text-text-primary">{formatNumber(totalBricks)} <span className="text-title text-text-subdued">pcs</span></p>
                    {brokenBricks > 0 && <p className="text-caption text-red-500 font-bold mt-1">{formatNumber(brokenBricks)} broken</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-caption font-bold text-text-subdued uppercase">Value</p>
                    <p className="text-title font-bold text-emerald-600">{formatCurrency(brickRecoveryValue)}</p>
                  </div>
               </div>
            </div>
          )}

          {/* Itemised breakdown */}
          <div className="bg-surface rounded-3xl border border-border-default shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subdued">
              <h4 className="font-heading text-title font-bold text-text-primary">Detailed Breakdown</h4>
            </div>
            <div className="divide-y divide-border-subdued">
              {malwaCost > 0 && (
                <div className="flex justify-between items-center px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center"><Trash2 size={14} className="text-text-secondary" /></div>
                    <span className="text-body-sm text-text-secondary">Malwa Disposal</span>
                  </div>
                  <span className="text-body-sm font-bold text-red-500">−{formatCurrency(malwaCost)}</span>
                </div>
              )}
              {demolitionThekaCost > 0 && (
                <div className="flex justify-between items-center px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-subdued rounded-xl flex items-center justify-center"><Hammer size={14} className="text-text-secondary" /></div>
                    <span className="text-body-sm text-text-secondary">Theka Diya (Paid)</span>
                  </div>
                  <span className="text-body-sm font-bold text-red-500">−{formatCurrency(demolitionThekaCost)}</span>
                </div>
              )}
              {scrapIncome > 0 && (
                <div className="flex justify-between items-center px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center"><Package size={14} className="text-emerald-500" /></div>
                    <span className="text-body-sm text-text-secondary">Scrap / Kabaad</span>
                  </div>
                  <span className="text-body-sm font-bold text-emerald-600">+{formatCurrency(scrapIncome)}</span>
                </div>
              )}
              {brickRecoveryValue > 0 && (
                <div className="flex justify-between items-center px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center"><Layers size={14} className="text-amber-500" /></div>
                    <span className="text-body-sm text-text-secondary">Brick Value</span>
                  </div>
                  <span className="text-body-sm font-bold text-emerald-600">+{formatCurrency(brickRecoveryValue)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 3 units (Thekedar Status) */}
        <div className="col-span-3 space-y-4">
          <p className="text-caption font-bold text-text-subdued uppercase tracking-widest px-1">Thekedar Payments</p>
          {(state.demolitionThekas || []).length > 0 ? (
            <div className="grid gap-4">
              {(state.demolitionThekas || []).map(t => {
                const paid = t.payments.reduce((a, p) => a + p.amount, 0);
                const pending = t.totalAmount - paid;
                const pct = t.totalAmount > 0 ? (paid / t.totalAmount) * 100 : 0;
                const done = pct >= 100;
                return (
                  <div key={t.id} className="bg-surface rounded-3xl border border-border-default shadow-sm p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="font-heading text-title-lg font-bold text-text-primary">{t.name}</p>
                        <span className="text-caption font-bold px-3 py-1 bg-surface-subdued text-text-secondary rounded-full inline-block mt-2 uppercase tracking-tighter">
                          {t.workType}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-title-lg font-bold', done ? 'text-emerald-600' : 'text-red-500')}>
                          {done ? '✓ Fully Paid' : formatCurrency(pending)}
                        </p>
                        <p className="text-caption font-bold text-text-subdued mt-1 uppercase tracking-widest">{done ? 'Settled' : 'Pending Payment'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-caption font-bold text-text-subdued uppercase">
                          <span>Progress</span>
                          <span>{pct.toFixed(0)}%</span>
                       </div>
                       <div className="w-full bg-surface-subdued h-2 rounded-full overflow-hidden border border-border-subdued">
                          <div
                            className={cn('h-full transition-all duration-1000 ease-out rounded-full', done ? 'bg-emerald-500' : 'bg-brand')}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                       </div>
                    </div>
                    <div className="flex justify-between mt-4 pt-4 border-t border-border-subdued">
                       <div>
                          <p className="text-caption font-bold text-text-subdued uppercase">Total Theka</p>
                          <p className="text-body-sm font-bold text-text-primary">{formatCurrency(t.totalAmount)}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-caption font-bold text-text-subdued uppercase">Paid So Far</p>
                          <p className="text-body-sm font-bold text-emerald-600">{formatCurrency(paid)}</p>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface p-8 rounded-3xl border-2 border-dashed border-border-subdued text-center">
               <p className="text-body-sm text-text-subdued font-bold">No thekedar records found</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ═══ MOBILE ═══ */}
    <div className="md:hidden space-y-3">

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
    </>
  );
}
