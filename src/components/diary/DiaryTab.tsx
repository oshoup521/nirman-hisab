import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, addDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import {
  Sun, Cloud, CloudRain, Flame, Snowflake,
  ChevronLeft, ChevronRight, ImageIcon, Search, CalendarDays, NotebookPen, X,
  Users, Wrench, Package, AlertTriangle, IndianRupee,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { genId } from '../../utils/helpers';
import { formatCurrency } from '../../utils/formatters';
import { useAppContext } from '../../context/AppContext';
import { DiaryEntry, Weather } from '../../types';
import PhotoThumb from '../common/PhotoThumb';
import Lightbox from '../common/Lightbox';

type View = 'entry' | 'calendar' | 'search';

const WEATHER_OPTS: { id: Weather; label: string; Icon: React.ElementType; tone: string }[] = [
  { id: 'sunny',  label: 'Dhoop',  Icon: Sun,        tone: 'text-amber-500'  },
  { id: 'cloudy', label: 'Baadal', Icon: Cloud,      tone: 'text-slate-400'  },
  { id: 'rain',   label: 'Baarish',Icon: CloudRain,  tone: 'text-blue-500'   },
  { id: 'hot',    label: 'Garmi',  Icon: Flame,      tone: 'text-red-500'    },
  { id: 'cold',   label: 'Sardi',  Icon: Snowflake,  tone: 'text-cyan-500'   },
];

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export default function DiaryTab() {
  const { state, setState, askConfirm, photos } = useAppContext();
  const { photoUploading, getSignedUrl, uploadPhoto, deletePhoto, lightboxPhoto, setLightboxPhoto } = photos;

  const [view, setView] = useState<View>('entry');
  const [date, setDate] = useState<string>(todayStr());
  const [calMonth, setCalMonth] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  const diary = state.diary || [];
  const entry = useMemo(() => diary.find(d => d.date === date), [diary, date]);

  // Local draft so typing is instant; we flush to global state on blur (debounced).
  const [draft, setDraft] = useState<Partial<DiaryEntry>>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft({
      weather: entry?.weather,
      whoCame: entry?.whoCame ?? '',
      workDone: entry?.workDone ?? '',
      delivered: entry?.delivered ?? '',
      problems: entry?.problems ?? '',
    });
  }, [entry?.id, date]);

  const persist = (patch: Partial<DiaryEntry>) => {
    setState(prev => {
      const list = prev.diary || [];
      const existing = list.find(d => d.date === date);
      if (existing) {
        return {
          ...prev,
          diary: list.map(d => d.date === date ? { ...d, ...patch } : d),
        };
      }
      // Don't create empty entries — only if patch has content
      const hasContent =
        patch.weather ||
        (patch.whoCame ?? '').trim() ||
        (patch.workDone ?? '').trim() ||
        (patch.delivered ?? '').trim() ||
        (patch.problems ?? '').trim() ||
        (patch.photos && patch.photos.length > 0);
      if (!hasContent) return prev;
      const fresh: DiaryEntry = { id: genId(), date, ...patch };
      return { ...prev, diary: [...list, fresh] };
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const scheduleFlush = (patch: Partial<DiaryEntry>) => {
    setDraft(prev => ({ ...prev, ...patch }));
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => persist(patch), 600);
  };

  const flushNow = () => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current);
      flushTimer.current = null;
    }
    persist(draft);
  };

  const setWeather = (w: Weather) => {
    const next = draft.weather === w ? undefined : w;
    setDraft(prev => ({ ...prev, weather: next }));
    persist({ weather: next });
  };

  const goPrev = () => { flushNow(); setDate(d => format(addDays(parseISO(d), -1), 'yyyy-MM-dd')); };
  const goNext = () => { flushNow(); setDate(d => format(addDays(parseISO(d), 1), 'yyyy-MM-dd')); };

  // ---- Today's auto summary (read-only) ----
  const summary = useMemo(() => {
    const expensesToday = (state.expenses || []).filter(e => e.date.slice(0, 10) === date);
    const totalKharcha = expensesToday.reduce((s, e) => s + e.amount, 0);

    const labourPresent = (state.labours || []).reduce((acc, l) => {
      const att = l.attendance?.[date];
      if (att === 'present') return acc + 1;
      if (att === 'half') return acc + 0.5;
      return acc;
    }, 0);

    const milestonesActive = (state.milestones || []).filter(m =>
      m.status === 'in-progress' || (m.status === 'completed' && m.endDate === date)
    );

    return { totalKharcha, expenseCount: expensesToday.length, labourPresent, milestonesActive };
  }, [state.expenses, state.labours, state.milestones, date]);

  // ---- Calendar grid ----
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    const days = eachDayOfInterval({ start, end });
    // Pad start to Sunday
    const firstDow = start.getDay();
    const padStart = Array(firstDow).fill(null);
    return [...padStart, ...days];
  }, [calMonth]);

  const entryByDate = useMemo(() => {
    const map: Record<string, DiaryEntry> = {};
    diary.forEach(d => { map[d.date] = d; });
    return map;
  }, [diary]);

  // ---- Search ----
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return diary
      .filter(d => {
        const blob = `${d.whoCame ?? ''} ${d.workDone ?? ''} ${d.delivered ?? ''} ${d.problems ?? ''}`.toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [diary, search]);

  // -----------------------------------------------------------------
  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <NotebookPen size={22} className="text-emerald-600" /> Site Diary
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-0.5">Aaj kya hua — roz ka record</p>
          </div>
          {savedFlash && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              Saved ✓
            </span>
          )}
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
        {([
          { id: 'entry',    label: 'Aaj',      Icon: NotebookPen },
          { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
          { id: 'search',   label: 'Khojo',    Icon: Search },
        ] as const).map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => { flushNow(); setView(id); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all',
                active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'
              )}
            >
              <Icon size={13} /> {label}
            </button>
          );
        })}
      </div>

      {view === 'entry' && (
        <>
          {/* Date strip */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex items-center gap-2">
            <button onClick={goPrev} className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 active:bg-slate-100">
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={e => { flushNow(); setDate(e.target.value || todayStr()); }}
              className="flex-1 text-center font-bold text-slate-800 bg-slate-50 rounded-xl py-2 px-2 border-none focus:ring-2 focus:ring-emerald-500"
            />
            <button onClick={goNext} disabled={date >= todayStr()}
              className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 active:bg-slate-100 disabled:opacity-30">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Auto summary card */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-4 text-white shadow-sm shadow-emerald-200/40">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-100">Is din ka auto-hisaab</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <SummaryStat Icon={IndianRupee} label="Kharcha" value={formatCurrency(summary.totalKharcha)} sub={`${summary.expenseCount} entries`} />
              <SummaryStat Icon={Users} label="Labour" value={summary.labourPresent ? `${summary.labourPresent}` : '—'} sub="present" />
              <SummaryStat Icon={Wrench} label="Active" value={`${summary.milestonesActive.length}`} sub="phases" />
            </div>
          </div>

          {/* Weather */}
          <Section icon={<Sun size={14} />} title="Mausam">
            <div className="flex flex-wrap gap-2">
              {WEATHER_OPTS.map(({ id, label, Icon, tone }) => {
                const sel = draft.weather === id;
                return (
                  <button
                    key={id}
                    onClick={() => setWeather(id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all',
                      sel ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-100'
                    )}
                  >
                    <Icon size={14} className={sel ? 'text-emerald-600' : tone} /> {label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Who came */}
          <Section icon={<Users size={14} />} title="Kaun aaya">
            <textarea
              rows={2}
              value={draft.whoCame ?? ''}
              onChange={e => scheduleFlush({ whoCame: e.target.value })}
              onBlur={flushNow}
              placeholder="e.g. Raju mistri + 4 mazdoor, Plumber Salim"
              className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 resize-none"
            />
          </Section>

          {/* Work done */}
          <Section icon={<Wrench size={14} />} title="Kya kaam hua">
            <textarea
              rows={3}
              value={draft.workDone ?? ''}
              onChange={e => scheduleFlush({ workDone: e.target.value })}
              onBlur={flushNow}
              placeholder="2 line mein likho — aaj kya kaam khatam hua, kya bacha"
              className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 resize-none"
            />
          </Section>

          {/* Delivered */}
          <Section icon={<Package size={14} />} title="Kya delivery aayi">
            <textarea
              rows={2}
              value={draft.delivered ?? ''}
              onChange={e => scheduleFlush({ delivered: e.target.value })}
              onBlur={flushNow}
              placeholder="e.g. 10 bori cement, 2 trolley reti, 1 truck sariya"
              className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 resize-none"
            />
          </Section>

          {/* Problems */}
          <Section icon={<AlertTriangle size={14} />} title="Problem / Dikkat">
            <textarea
              rows={2}
              value={draft.problems ?? ''}
              onChange={e => scheduleFlush({ problems: e.target.value })}
              onBlur={flushNow}
              placeholder="Koi issue, vendor delay, paani/light ki problem..."
              className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 resize-none"
            />
          </Section>

          {/* Photos */}
          <Section icon={<ImageIcon size={14} />} title={`Photos ${entry?.photos?.length ? `(${entry.photos.length})` : ''}`}>
            <div className="flex items-center justify-end mb-2">
              {photoUploading === `diary:${entry?.id ?? ''}` ? (
                <span className="text-xs text-slate-400 font-bold">Uploading…</span>
              ) : (
                <label className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer bg-slate-100 text-slate-600 active:bg-slate-200">
                  <ImageIcon size={12} /> Photo Add
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Ensure entry exists before upload — flush a stub
                        let id = entry?.id;
                        if (!id) {
                          id = genId();
                          const stubId = id;
                          setState(prev => ({
                            ...prev,
                            diary: [...(prev.diary || []), { id: stubId, date }],
                          }));
                        }
                        const caption = prompt('Photo ka naam / caption (optional):') ?? '';
                        uploadPhoto('diary', id, file, caption);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
            {entry?.photos && entry.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {entry.photos.map(photo => (
                  <PhotoThumb
                    key={photo.path}
                    path={photo.path}
                    caption={photo.caption}
                    getSignedUrl={getSignedUrl}
                    onOpen={(url, caption) => setLightboxPhoto({ url, caption })}
                    onDelete={() => askConfirm('Is photo ko delete karein?', () => deletePhoto('diary', entry.id, photo.path))}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">Koi photo nahi — site ki tasveer add karo</p>
            )}
          </Section>
        </>
      )}

      {view === 'calendar' && (
        <div className="space-y-3">
          {/* Month nav */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex items-center gap-2">
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 active:bg-slate-100">
              <ChevronLeft size={18} />
            </button>
            <p className="flex-1 text-center font-bold text-slate-800">{format(calMonth, 'MMMM yyyy')}</p>
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 active:bg-slate-100">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-[10px] font-bold text-slate-400 text-center py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={i} />;
                const ds = format(day, 'yyyy-MM-dd');
                const has = !!entryByDate[ds];
                const photoCount = entryByDate[ds]?.photos?.length ?? 0;
                const inMonth = isSameMonth(day, calMonth);
                const today = isToday(day);
                return (
                  <button
                    key={i}
                    onClick={() => { setDate(ds); setView('entry'); }}
                    disabled={!inMonth}
                    className={cn(
                      'aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all',
                      today && 'ring-2 ring-emerald-500',
                      has ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-50 text-slate-500',
                      !inMonth && 'opacity-30',
                    )}
                  >
                    <span className="text-xs">{day.getDate()}</span>
                    {has && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        {photoCount > 0 && <span className="w-1 h-1 rounded-full bg-amber-500" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-slate-400 font-bold">
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Entry</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Photo</div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Entries</p>
              <p className="text-2xl font-bold text-slate-900">{diary.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">With Photos</p>
              <p className="text-2xl font-bold text-slate-900">{diary.filter(d => d.photos?.length).length}</p>
            </div>
          </div>
        </div>
      )}

      {view === 'search' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="kuch bhi search karo — vendor, kaam, problem"
              className="flex-1 bg-transparent text-sm text-slate-800 focus:outline-none placeholder-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                <X size={14} />
              </button>
            )}
          </div>

          {!search && (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-sm font-bold text-slate-600">Purani diary entries mein khojo</p>
              <p className="text-xs text-slate-400 mt-1">"6 mahine pehle yeh kab hua tha?" wala sawal yahan se hal hoga</p>
            </div>
          )}

          {search && searchResults.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-sm font-bold text-slate-600">Koi entry nahi mili</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <p className="text-xs font-bold text-slate-400 px-1">{searchResults.length} entr{searchResults.length === 1 ? 'y' : 'ies'} mile</p>
          )}

          {searchResults.map(d => (
            <button
              key={d.id}
              onClick={() => { setDate(d.date); setView('entry'); }}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-bold text-slate-800 text-sm">{format(parseISO(d.date), 'dd MMM yyyy, EEE')}</p>
                {d.photos?.length ? <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{d.photos.length} 📷</span> : null}
              </div>
              <SearchSnippet entry={d} query={search} />
            </button>
          ))}
        </div>
      )}

      <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
    </div>
  );
}

// ---- Helper components ----

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function SummaryStat({ Icon, label, value, sub }: { Icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white/15 rounded-xl p-2.5">
      <div className="flex items-center gap-1 text-emerald-100 text-[9px] font-bold uppercase">
        <Icon size={10} /> {label}
      </div>
      <p className="text-white text-sm font-bold mt-1 leading-tight truncate">{value}</p>
      <p className="text-emerald-200 text-[9px] font-bold">{sub}</p>
    </div>
  );
}

function SearchSnippet({ entry, query }: { entry: DiaryEntry; query: string }) {
  const q = query.trim().toLowerCase();
  const fields: { label: string; text: string }[] = [
    { label: 'Kaun aaya', text: entry.whoCame ?? '' },
    { label: 'Kaam',      text: entry.workDone ?? '' },
    { label: 'Delivery',  text: entry.delivered ?? '' },
    { label: 'Problem',   text: entry.problems ?? '' },
  ].filter(f => f.text.toLowerCase().includes(q));

  return (
    <div className="space-y-1">
      {fields.slice(0, 2).map(({ label, text }) => {
        const idx = text.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 20);
        const end = Math.min(text.length, idx + q.length + 40);
        const snip = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
        return (
          <p key={label} className="text-xs text-slate-500 leading-snug">
            <span className="font-bold text-slate-400">{label}:</span> {snip}
          </p>
        );
      })}
    </div>
  );
}
