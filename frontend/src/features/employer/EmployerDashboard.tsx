import React, { useState, useRef, useEffect } from 'react';
import { useEmployer } from '../../hooks/useEmployer';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { EmployerStatsBanner } from './EmployerStatsBanner';
import { EmployerJobsList } from './EmployerJobsList';
import { parseWorkDates } from '../../utils/workDates';

interface EmployerDashboardProps {
  onPostJobClick: () => void;
  onViewApplicantsClick: () => void;
  onViewChatsClick: () => void;
  onViewAllJobsClick: () => void;
  onViewAnalyticsClick?: () => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  onPostJobClick,
  onViewAllJobsClick,
  onViewApplicantsClick,
  onViewChatsClick,
  onViewAnalyticsClick
}) => {
  const { postedJobs, applications, language } = useEmployer();
  
  // Stats
  const activeJobsCount = postedJobs.filter(j => j.status !== 'completed').length;
  const pendingApplicantsCount = applications.filter(a => a.status === 'applied').length;
  // These two were fixed at 1204 and 85 — an employer with no postings at all
  // was still shown 1,204 views and an 85% fill rate as their own figures.
  const totalViews = postedJobs.reduce((sum, j) => sum + (Number(j.views) || 0), 0);
  const vacancyTotal = postedJobs.reduce(
    (sum, j) => sum + (Number(j.vacancies) || Number(j.neededWorkers) || 1), 0);
  const hiredTotal = postedJobs.reduce((sum, j) => sum + (Number(j.hiredCount) || 0), 0);
  const avgFillRate = vacancyTotal > 0 ? Math.round((hiredTotal / vacancyTotal) * 100) : 0;

  // Date picker state
  const TOTAL_DAYS = 37;
  const PAST_DAYS = 30;
  const [selectedDate, setSelectedDate] = useState<number>(PAST_DAYS);
  const [showAllDates, setShowAllDates] = useState(false);
  const dates = Array.from({ length: TOTAL_DAYS }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - PAST_DAYS + i);
    const localYYYYMMDD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isToday = i === PAST_DAYS;
    return {
      dayStr: language === 'uz' 
        ? ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'][d.getDay()]
        : language === 'ru' ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      dateNum: d.getDate(),
      index: i,
      fullDateStr: localYYYYMMDD,
      isToday
    };
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.children[selectedDate] as HTMLElement;
      if (activeElement) {
        // A slight timeout ensures the DOM is fully painted before scrolling
        const timeout = setTimeout(() => {
          activeElement.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
        }, 100);
        return () => clearTimeout(timeout);
      }
    }
  }, []); // Run once on mount

  // Filter jobs by selected date
  const selectedFullDateStr = dates[selectedDate].fullDateStr;
  const filteredJobs = showAllDates ? postedJobs : postedJobs.filter(job => parseWorkDates(job.workDate).includes(selectedFullDateStr));

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-6">
      
      {/* Top Banner & Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <EmployerStatsBanner 
          language={language}
          activeJobsCount={activeJobsCount}
          pendingApplicantsCount={pendingApplicantsCount}
          totalViews={totalViews}
          avgFillRate={avgFillRate}
          onViewAnalyticsClick={onViewAnalyticsClick}
          onViewAllJobsClick={onViewAllJobsClick}
          onViewApplicantsClick={onViewApplicantsClick}
          onPostJobClick={onPostJobClick}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col gap-6">
        {/* Date Picker */}
        <div ref={scrollContainerRef} className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x px-4 md:px-6">
          {dates.map((d) => {
            const isActive = !showAllDates && selectedDate === d.index;
            return (
              <button
                key={d.index}
                onClick={() => { setSelectedDate(d.index); setShowAllDates(false); }}
                aria-pressed={isActive}
                aria-label={d.fullDateStr}
                className={`snap-center flex flex-col items-center justify-center min-w-[68px] h-[80px] rounded-[22px] transition-all cursor-pointer shrink-0 relative ${
                  isActive 
                    ? 'bg-brand-primary text-white shadow-[0_8px_16px_rgba(0,6,102,0.24)] scale-100' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 scale-[0.98]'
                }`}
              >
                <span className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isActive ? 'text-white/90' : 'text-slate-400'}`}>
                  {d.isToday ? (language === 'uz' ? 'Bugun' : language === 'ru' ? 'Сегодня' : 'Today') : d.dayStr}
                </span>
                <span className={`font-display font-black text-2xl leading-none ${isActive ? 'text-white' : 'text-slate-800'}`}>
                  {d.dateNum}
                </span>
                {d.isToday && !isActive && (
                  <div className="absolute bottom-1.5 w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Jobs List */}
        <div className="px-4 md:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600" aria-live="polite">
              {showAllDates
                ? (language === 'uz' ? 'Barcha sanalardagi e’lonlar' : language === 'ru' ? 'Объявления за все даты' : 'Postings for all dates')
                : `${language === 'uz' ? 'Tanlangan sana' : language === 'ru' ? 'Выбранная дата' : 'Selected date'}: ${selectedFullDateStr}`}
              {' · '}{filteredJobs.length} / {postedJobs.length}
            </p>
            <button onClick={() => setShowAllDates(!showAllDates)} aria-pressed={showAllDates} className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-brand-primary">
              {showAllDates ? (language === 'uz' ? 'Tanlangan kun' : language === 'ru' ? 'Выбранный день' : 'Selected day') : (language === 'uz' ? 'Barcha sanalar' : language === 'ru' ? 'Все даты' : 'All dates')}
            </button>
          </div>
          <EmployerJobsList 
            language={language}
            postedJobs={filteredJobs}
            onViewAllJobsClick={onViewAllJobsClick}
          />
        </div>
      </motion.div>
    </div>
  );
};
