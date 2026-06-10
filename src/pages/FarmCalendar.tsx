import { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Info,
  Plus,
  X,
} from 'lucide-react';
import { useAgriStore, CROP_CATEGORIES } from '@/store/agriStore';
import type { TaskType, WeatherCondition } from '@/types';
import type { GenerateMode } from '@/store/agriStore';
import { formatDate, addDays, subDays } from '@/data/presets';

const TASK_CONFIG: Record<TaskType, { label: string; color: string; bg: string; icon: string }> = {
  sowing: { label: '播种', color: 'text-harvest-700', bg: 'bg-harvest-400', icon: '🌱' },
  fertilize: { label: '施肥', color: 'text-field-700', bg: 'bg-field-500', icon: '🧪' },
  irrigate: { label: '灌溉', color: 'text-sky-700', bg: 'bg-sky-500', icon: '💧' },
  pesticide: { label: '打药', color: 'text-tomato-700', bg: 'bg-tomato-500', icon: '🧴' },
  weed: { label: '除草', color: 'text-soil-700', bg: 'bg-soil-500', icon: '🌿' },
  harvest: { label: '收获', color: 'text-harvest-800', bg: 'bg-harvest-600', icon: '🌾' },
};

const WEATHER_ICONS: Record<WeatherCondition, JSX.Element> = {
  '晴': <Sun size={20} className="text-harvest-500" />,
  '多云': <Cloud size={20} className="text-soil-500" />,
  '阴': <Cloud size={20} className="text-soil-400" />,
  '小雨': <CloudRain size={20} className="text-sky-500" />,
  '中雨': <CloudRain size={20} className="text-sky-600" />,
  '大雨': <CloudLightning size={20} className="text-tomato-500" />,
};

export default function FarmCalendar() {
  const {
    currentScenarioId,
    plots,
    tasks,
    weather,
    toggleTaskCompleted,
    generateTasksForPlot,
    getCropById,
  } = useAgriStore();

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedPlot, setSelectedPlot] = useState<string>('all');
  const [showGenModal, setShowGenModal] = useState(false);

  const scenarioPlots = useMemo(
    () => plots.filter(p => p.scenarioId === currentScenarioId),
    [plots, currentScenarioId],
  );
  const plotTasks = useMemo(() => {
    const all = tasks.filter(t => {
      const plot = scenarioPlots.find(p => p.id === t.plotId);
      if (!plot) return false;
      if (selectedPlot !== 'all' && t.plotId !== selectedPlot) return false;
      return true;
    });
    return all;
  }, [tasks, scenarioPlots, selectedPlot]);

  // 生成日历格子
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: Date; isCurrent: boolean }[] = [];
    for (let i = startWeekDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrent: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), isCurrent: true });
    }
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date;
      const next = new Date(last);
      next.setDate(next.getDate() + 1);
      days.push({ date: next, isCurrent: false });
    }
    return days;
  }, [viewMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof plotTasks>();
    plotTasks.forEach(t => {
      const arr = map.get(t.date) || [];
      arr.push(t);
      map.set(t.date, arr);
    });
    return map;
  }, [plotTasks]);

  const weatherByDate = useMemo(() => {
    const map = new Map<string, typeof weather[0]>();
    weather.forEach(w => map.set(w.date, w));
    return map;
  }, [weather]);

  const weatherForecast = useMemo(() => {
    const list: { date: string; tempHigh: number; tempLow: number; condition: WeatherCondition; rainfall: number; warning: string | null }[] = [];
    const base = weather.length > 0 ? new Date([...weather].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0].date) : today;
    const conditions: WeatherCondition[] = ['晴', '多云', '晴', '小雨', '多云'];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const cond = conditions[i % 5];
      list.push({
        date: formatDate(d),
        tempHigh: Math.round(26 + Math.random() * 8),
        tempLow: Math.round(16 + Math.random() * 6),
        condition: cond,
        rainfall: cond.includes('雨') ? Math.round(Math.random() * 15 * 10) / 10 : 0,
        warning: cond === '小雨' && i % 4 === 0 ? '连续降雨，注意排水防涝' : null,
      });
    }
    return list;
  }, [weather]);

  // 即将到来的任务
  const upcomingTasks = useMemo(() => {
    const todayStr = formatDate(today);
    const weekEnd = addDays(today, 14);
    return plotTasks
      .filter(t => t.date >= todayStr && t.date <= weekEnd)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [plotTasks]);

  const warnings = useMemo(() => {
    const list = weatherForecast.filter(w => w.warning).map(w => ({
      date: w.date, type: 'weather', msg: w.warning,
    }));
    upcomingTasks.slice(0, 3).forEach(t => {
      if (!t.completed && t.date <= addDays(today, 3)) {
        const plot = scenarioPlots.find(p => p.id === t.plotId);
        list.unshift({
          date: t.date,
          type: 'task',
          msg: `${plot?.name || ''}：${TASK_CONFIG[t.type].icon} ${t.name} 即将执行`,
        });
      }
    });
    return list.slice(0, 5);
  }, [weatherForecast, upcomingTasks, scenarioPlots]);

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  const goToday = () => setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));

  const isToday = (d: Date) => formatDate(d) === formatDate(today);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="page-header">📅 农事日历</h1>
          <p className="page-subtitle mb-0">
            全周期农事计划安排，结合天气提醒合理安排生产活动
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowGenModal(true)}
            className="btn-secondary"
          >
            <Plus size={16} />
            生成农事计划
          </button>
        </div>
      </div>

      {/* 提醒面板 */}
      {warnings.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border flex items-start gap-3
                ${w.type === 'weather'
                  ? 'bg-sky-50/60 border-sky-200'
                  : 'bg-harvest-50/60 border-harvest-200'}`}
            >
              <AlertTriangle
                size={18}
                className={`shrink-0 mt-0.5 ${w.type === 'weather' ? 'text-sky-600' : 'text-harvest-600'}`}
              />
              <div className="min-w-0">
                <div className="text-[11px] text-soil-500 mb-0.5">
                  {new Date(w.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </div>
                <div className="text-xs text-soil-700 leading-snug">{w.msg}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* 日历主区 */}
        <div className="xl:col-span-3 space-y-6">
          <div className="card">
            {/* 日历头部 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-soil-100 text-soil-600 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-center min-w-[140px]">
                  <h3 className="font-song text-xl font-bold text-field-800">
                    {viewMonth.getFullYear()}年{viewMonth.getMonth() + 1}月
                  </h3>
                </div>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-soil-100 text-soil-600 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={goToday}
                  className="ml-2 text-xs px-3 py-1.5 rounded-lg bg-field-50 text-field-700
                    border border-field-200 hover:bg-field-100 transition-colors"
                >
                  今天
                </button>
              </div>
              <select
                value={selectedPlot}
                onChange={e => setSelectedPlot(e.target.value)}
                className="input-base !w-auto !py-2 self-start md:self-auto"
              >
                <option value="all">全部地块</option>
                {scenarioPlots.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.areaMu}亩)</option>
                ))}
              </select>
            </div>

            {/* 图例 */}
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-soil-100">
              {Object.entries(TASK_CONFIG).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5 text-xs text-soil-600">
                  <span className={`w-2.5 h-2.5 rounded-full ${v.bg}`} />
                  {v.icon} {v.label}
                </div>
              ))}
            </div>

            {/* 星期头 */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
                <div
                  key={d}
                  className={`text-center text-xs font-semibold py-2 rounded-lg
                    ${i === 0 || i === 6 ? 'text-tomato-500' : 'text-soil-500'}`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* 日历格 */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map(({ date, isCurrent }, idx) => {
                const dateStr = formatDate(date);
                const dayTasks = tasksByDate.get(dateStr) || [];
                const w = weatherByDate.get(dateStr);
                const _today = isToday(date);
                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-2 rounded-xl border transition-all
                      ${!isCurrent
                        ? 'bg-soil-50/30 border-soil-100 opacity-40'
                        : _today
                          ? 'bg-field-50/50 border-field-400 shadow-sm ring-2 ring-field-500/10'
                          : 'bg-white border-soil-200/70 hover:border-field-200 hover:bg-field-50/30'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-semibold
                        ${_today ? 'text-field-700 bg-field-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}
                        ${!_today && (date.getDay() === 0 || date.getDay() === 6) ? 'text-tomato-500' : 'text-soil-700'}`}
                      >
                        {date.getDate()}
                      </span>
                      {w && WEATHER_ICONS[w.condition]}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map(t => {
                        const cfg = TASK_CONFIG[t.type];
                        const plot = scenarioPlots.find(p => p.id === t.plotId);
                        return (
                          <div
                            key={t.id}
                            className={`group relative text-[10px] px-1.5 py-1 rounded-md truncate cursor-pointer
                              ${t.completed ? 'bg-soil-100 text-soil-400 line-through' : `bg-opacity-90 ${cfg.bg} text-white`}`}
                            title={`${plot?.name} - ${t.name}\n${t.description}`}
                            onClick={() => toggleTaskCompleted(t.id)}
                          >
                            <span className="opacity-80">{cfg.icon}</span>{' '}
                            <span className="truncate">{t.name}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-soil-400 text-center">
                          +{dayTasks.length - 3} 项
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 天气卡片 */}
          <div className="card overflow-hidden">
            <div className="p-5 rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 text-white -mx-1 -mt-1 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sky-100 text-xs">今日天气</p>
                  <h4 className="text-3xl font-bold font-song mt-1">
                    {(weatherForecast[0]?.tempHigh || 26)}°
                    <span className="text-xl font-normal opacity-80"> / {weatherForecast[0]?.tempLow || 18}°</span>
                  </h4>
                  <p className="mt-1 text-sm text-sky-100">{weatherForecast[0]?.condition || '晴'}</p>
                </div>
                <Sun size={42} className="text-harvest-300 drop-shadow-lg opacity-90" />
              </div>
              {weatherForecast[0]?.rainfall > 0 && (
                <p className="mt-2 text-xs bg-white/15 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1">
                  <CloudRain size={12} /> 降雨量 {weatherForecast[0].rainfall}mm
                </p>
              )}
            </div>
            <h5 className="text-xs font-semibold text-soil-500 uppercase tracking-wider mb-3 px-1">
              未来7天预报
            </h5>
            <div className="space-y-2">
              {weatherForecast.map(w => (
                <div key={w.date} className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-soil-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-center w-10 shrink-0">
                      <div className="text-[11px] text-soil-400">
                        {new Date(w.date).toLocaleDateString('zh-CN', { weekday: 'short' }).replace('星期', '周')}
                      </div>
                      <div className="text-xs font-semibold text-soil-700">
                        {new Date(w.date).getDate()}日
                      </div>
                    </div>
                    {WEATHER_ICONS[w.condition]}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-soil-800">
                      {w.tempHigh}° <span className="text-soil-400 font-normal">/ {w.tempLow}°</span>
                    </div>
                    {w.rainfall > 0 && (
                      <div className="text-[10px] text-sky-500">💧 {w.rainfall}mm</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 近期任务 */}
          <div className="card">
            <h5 className="flex items-center gap-2 font-song font-bold text-field-800 mb-4">
              <Calendar size={18} className="text-field-500" />
              近期待办任务
            </h5>
            {upcomingTasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-soil-400">
                <Info size={24} className="mx-auto mb-2 opacity-50" />
                暂无近期任务
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map(t => {
                  const cfg = TASK_CONFIG[t.type];
                  const plot = scenarioPlots.find(p => p.id === t.plotId);
                  const crop = t.cropId ? getCropById(t.cropId) : null;
                  const daysLeft = Math.ceil((new Date(t.date).getTime() - today.getTime()) / 86400000);
                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border transition-all group cursor-pointer
                        ${t.completed
                          ? 'bg-soil-50 border-soil-100 opacity-60'
                          : `border-l-4 ${cfg.bg.replace('bg-', 'border-l-').split(' ')[0]} bg-white border-soil-200 hover:shadow-sm`}`}
                      onClick={() => toggleTaskCompleted(t.id)}
                    >
                      <div className="flex items-start gap-2.5">
                        <button className="mt-0.5 shrink-0">
                          {t.completed ? (
                            <CheckCircle2 size={18} className="text-field-500" />
                          ) : (
                            <Circle size={18} className="text-soil-300 group-hover:text-field-400 transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center gap-1.5 flex-wrap text-sm ${t.completed ? 'line-through text-soil-400' : 'text-soil-800 font-medium'}`}>
                            <span>{cfg.icon}</span>
                            {t.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-soil-500 flex-wrap">
                            <span>📍 {plot?.name}</span>
                            {crop && (
                              <span>
                                {CROP_CATEGORIES.find(c => c.id === crop.categoryId)?.icon} {crop.name.slice(0, 6)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`text-right shrink-0 ${daysLeft <= 3 && !t.completed ? 'text-tomato-500' : 'text-soil-500'}`}>
                          <div className="text-[11px]">
                            {new Date(t.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                          </div>
                          <div className="text-xs font-semibold">
                            {daysLeft === 0 ? '今天' : daysLeft < 0 ? `${-daysLeft}天前` : `${daysLeft}天后`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 生成计划弹窗 */}
      {showGenModal && (
        <GeneratePlanModal
          plots={scenarioPlots}
          tasks={plotTasks}
          onClose={() => setShowGenModal(false)}
          onGenerate={(plotId, date, mode) => {
            generateTasksForPlot(plotId, date, mode);
            setShowGenModal(false);
          }}
        />
      )}
    </div>
  );
}

interface GenProps {
  plots: ReturnType<typeof useAgriStore.getState>['plots'];
  tasks: ReturnType<typeof useAgriStore.getState>['tasks'];
  onClose: () => void;
  onGenerate: (plotId: string, sowingDate: string, mode: GenerateMode) => void;
}

function GeneratePlanModal({ plots, tasks, onClose, onGenerate }: GenProps) {
  const [plotId, setPlotId] = useState(plots[0]?.id || '');
  const [date, setDate] = useState(formatDate(new Date()));
  const [mode, setMode] = useState<GenerateMode>('overwrite');
  const plotsWithCrop = plots.filter(p => p.cropId);
  const selectedPlotTasks = tasks.filter(t => t.plotId === plotId);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-0 max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-soil-100 flex items-center justify-between">
          <h3 className="font-song text-lg font-bold text-field-800">
            📋 生成农事计划
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-soil-100 text-soil-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {plotsWithCrop.length === 0 ? (
            <div className="py-8 text-center text-sm text-soil-500">
              所有地块还未分配作物，请先在「作物档案」中分配。
            </div>
          ) : (
            <>
              <div>
                <label className="label-base">选择地块</label>
                <select
                  className="input-base"
                  value={plotId}
                  onChange={e => setPlotId(e.target.value)}
                >
                  {plotsWithCrop.map(p => (
                    <option key={p.id} value={p.id}>{p.name}（{p.areaMu}亩）</option>
                  ))}
                </select>
                {selectedPlotTasks.length > 0 && (
                  <p className="text-xs text-soil-500 mt-1.5">
                    当前地块已有 <span className="font-semibold text-field-600">{selectedPlotTasks.length}</span> 条任务
                  </p>
                )}
              </div>
              <div>
                <label className="label-base">播种起始日期</label>
                <input
                  type="date"
                  className="input-base"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label-base">生成模式</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('overwrite')}
                    className={`p-3 rounded-xl border-2 text-left transition-all
                      ${mode === 'overwrite'
                        ? 'border-field-500 bg-field-50 shadow-sm'
                        : 'border-soil-200 hover:border-field-300 bg-white'}`}
                  >
                    <div className={`text-sm font-semibold ${mode === 'overwrite' ? 'text-field-700' : 'text-soil-700'}`}>
                      🔄 覆盖生成
                    </div>
                    <div className="text-xs text-soil-500 mt-1">
                      清除原有任务，重新生成完整计划
                    </div>
                  </button>
                  <button
                    onClick={() => setMode('append')}
                    className={`p-3 rounded-xl border-2 text-left transition-all
                      ${mode === 'append'
                        ? 'border-harvest-500 bg-harvest-50 shadow-sm'
                        : 'border-soil-200 hover:border-harvest-300 bg-white'}`}
                  >
                    <div className={`text-sm font-semibold ${mode === 'append' ? 'text-harvest-700' : 'text-soil-700'}`}>
                      ➕ 补充生成
                    </div>
                    <div className="text-xs text-soil-500 mt-1">
                      保留原有任务，只追加新的任务
                    </div>
                  </button>
                </div>
              </div>
              <p className="text-xs text-soil-500 bg-soil-50 p-3 rounded-lg border border-soil-100">
                💡 系统将根据所选作物的标准农事模板，自动计算各任务日期。
                {mode === 'overwrite' && ' 覆盖模式下，该地块原有任务将被全部替换。'}
                {mode === 'append' && ' 补充模式下，同名同日期的任务不会重复添加。'}
              </p>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-soil-100 bg-soil-50/50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary px-5">取消</button>
          {plotsWithCrop.length > 0 && (
            <button onClick={() => onGenerate(plotId, date, mode)} className="btn-primary">
              生成计划
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 防止 subDays 未使用警告
void subDays;
