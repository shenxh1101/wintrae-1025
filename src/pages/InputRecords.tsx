import { useMemo, useState } from 'react';
import {
  ClipboardList,
  Plus,
  X,
  Save,
  Filter,
  Beaker,
  Droplets,
  Bug,
  Trash2,
  DollarSign,
  BarChart3,
  Search,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useAgriStore } from '@/store/agriStore';
import type { InputCategory, InputRecord } from '@/types';
import { formatDate } from '@/data/presets';

const CATEGORY_CONFIG: Record<InputCategory, {
  label: string; icon: any; color: string; bg: string; chip: string;
}> = {
  fertilizer: {
    label: '施肥', icon: Beaker, color: '#2D6A4F',
    bg: 'bg-field-50 border-field-200 text-field-700',
    chip: 'bg-field-50 text-field-700 border border-field-200',
  },
  irrigation: {
    label: '灌溉', icon: Droplets, color: '#457B9D',
    bg: 'bg-sky-50 border-sky-200 text-sky-700',
    chip: 'bg-sky-50 text-sky-700 border border-sky-200',
  },
  pesticide: {
    label: '打药', icon: Bug, color: '#E76F51',
    bg: 'bg-tomato-50 border-tomato-200 text-tomato-700',
    chip: 'bg-tomato-50 text-tomato-700 border border-tomato-200',
  },
};

const PIE_COLORS = ['#2D6A4F', '#457B9D', '#E76F51'];

const DEFAULT_UNITS: Record<InputCategory, string[]> = {
  fertilizer: ['kg', '袋', '吨'],
  irrigation: ['亩', '次', '吨'],
  pesticide: ['瓶', '袋', 'L', 'kg'],
};

export default function InputRecords() {
  const {
    currentScenarioId,
    plots,
    inputs,
    addInput,
    updateInput,
    deleteInput,
    computeRevenue,
  } = useAgriStore();

  const [filterCategory, setFilterCategory] = useState<InputCategory | 'all'>('all');
  const [filterPlot, setFilterPlot] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InputRecord | null>(null);

  const scenarioPlots = useMemo(
    () => plots.filter(p => p.scenarioId === currentScenarioId),
    [plots, currentScenarioId],
  );
  const scenarioInputs = useMemo(
    () => inputs.filter(i => i.scenarioId === currentScenarioId),
    [inputs, currentScenarioId],
  );

  const filtered = useMemo(() => {
    return scenarioInputs
      .filter(i => filterCategory === 'all' || i.category === filterCategory)
      .filter(i => filterPlot === 'all' || i.plotId === filterPlot)
      .filter(i => !search.trim() || i.name.includes(search.trim()) || i.notes.includes(search.trim()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [scenarioInputs, filterCategory, filterPlot, search]);

  const revenue = useMemo(() => computeRevenue(), [computeRevenue]);

  // 按分类统计
  const categoryStats = useMemo(() => {
    return (['fertilizer', 'irrigation', 'pesticide'] as InputCategory[]).map(cat => {
      const data = scenarioInputs.filter(i => i.category === cat);
      const material = data.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const labor = data.reduce((s, i) => s + i.laborCost, 0);
      return {
        name: CATEGORY_CONFIG[cat].label,
        value: material + labor,
        material,
        labor,
        count: data.length,
        color: CATEGORY_CONFIG[cat].color,
      };
    });
  }, [scenarioInputs]);

  // 按地块统计柱状图
  const plotStats = useMemo(() => {
    const map = new Map<string, { name: string; material: number; labor: number }>();
    scenarioInputs.forEach(i => {
      const plot = scenarioPlots.find(p => p.id === i.plotId);
      const key = i.plotId;
      const cur = map.get(key) || { name: plot?.name || '未知', material: 0, labor: 0 };
      cur.material += i.quantity * i.unitPrice;
      cur.labor += i.laborCost;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.material + b.labor - a.material - a.labor);
  }, [scenarioInputs, scenarioPlots]);

  // 按月趋势
  const monthlyStats = useMemo(() => {
    const map = new Map<string, { month: string; 物资: number; 人工: number }>();
    scenarioInputs.forEach(i => {
      const ym = i.date.slice(0, 7);
      const cur = map.get(ym) || { month: ym, 物资: 0, 人工: 0 };
      cur.物资 += i.quantity * i.unitPrice;
      cur.人工 += i.laborCost;
      map.set(ym, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [scenarioInputs]);

  const totals = useMemo(() => {
    const material = scenarioInputs.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const labor = scenarioInputs.reduce((s, i) => s + i.laborCost, 0);
    const count = scenarioInputs.length;
    return { material, labor, total: material + labor, count };
  }, [scenarioInputs]);

  const openNew = (cat?: InputCategory) => {
    setEditing(null);
    setShowModal(true);
    if (cat) {
      // 稍后在弹窗中设置
      setTimeout(() => {
        const sel = document.getElementById('input-category') as HTMLSelectElement | null;
        if (sel && cat) sel.value = cat;
      }, 50);
    }
  };
  const openEdit = (r: InputRecord) => {
    setEditing(r);
    setShowModal(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="page-header">📋 投入品记录</h1>
          <p className="page-subtitle mb-0">
            记录施肥、灌溉、打药等生产投入，自动统计物料与人工成本
          </p>
        </div>
        <button onClick={() => openNew()} className="btn-primary self-start md:self-auto">
          <Plus size={18} />
          新增记录
        </button>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card bg-gradient-to-br from-field-400 to-field-600 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <DollarSign size={22} />
            </div>
            <span className="text-xs opacity-80">总投入成本</span>
          </div>
          <div className="text-3xl font-bold font-song">¥{totals.total.toFixed(0)}</div>
          <div className="text-xs opacity-80 mt-1">共 {totals.count} 条记录</div>
        </div>

        {(['fertilizer', 'irrigation', 'pesticide'] as InputCategory[]).map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          const stat = categoryStats.find(s => s.name === cfg.label)!;
          const Icon = cfg.icon;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
              className={`stat-card text-left transition-all !rounded-2xl ${
                filterCategory === cat ? 'ring-2 ring-offset-2 ring-offset-soil-50 ring-field-500' : ''
              }`}
              style={{ background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color}99)`, color: '#fff' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Icon size={22} />
                </div>
                <span className="text-xs opacity-80">{cfg.label}投入</span>
              </div>
              <div className="text-3xl font-bold font-song">¥{stat.value.toFixed(0)}</div>
              <div className="text-xs opacity-80 mt-1">{stat.count} 次 · 占比 {totals.total > 0 ? ((stat.value / totals.total) * 100).toFixed(0) : 0}%</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* 左侧：记录表格 */}
        <div className="xl:col-span-3 space-y-4">
          {/* 筛选栏 */}
          <div className="card p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soil-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜索投入品名称、备注..."
                  className="input-base pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value as any)}
                  className="input-base !w-auto !py-2"
                >
                  <option value="all">全部分类</option>
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}记录</option>
                  ))}
                </select>
                <select
                  value={filterPlot}
                  onChange={e => setFilterPlot(e.target.value)}
                  className="input-base !w-auto !py-2"
                >
                  <option value="all">全部地块</option>
                  {scenarioPlots.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setFilterCategory('all'); setFilterPlot('all'); setSearch(''); }}
                  className="btn-secondary !px-4 !py-2 text-sm"
                >
                  <Filter size={14} /> 重置
                </button>
              </div>
            </div>
          </div>

          {/* 快速分类录入 */}
          <div className="grid grid-cols-3 gap-3">
            {(['fertilizer', 'irrigation', 'pesticide'] as InputCategory[]).map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              return (
                <button
                  key={cat}
                  onClick={() => openNew(cat)}
                  className={`p-4 rounded-xl border-2 border-dashed ${cfg.bg} hover:border-solid hover:shadow-sm transition-all group`}
                >
                  <Icon size={22} className="mx-auto mb-1 opacity-70 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-medium">快速录入{cfg.label}</div>
                </button>
              );
            })}
          </div>

          {/* 记录表格 */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto scrollbar-thin">
              <table className="w-full min-w-[720px]">
                <thead className="sticky top-0 bg-white z-10">
                  <tr>
                    <th className="table-header">日期</th>
                    <th className="table-header">分类</th>
                    <th className="table-header">投入品</th>
                    <th className="table-header">地块</th>
                    <th className="table-header text-right">用量</th>
                    <th className="table-header text-right">物资费</th>
                    <th className="table-header text-right">人工费</th>
                    <th className="table-header text-right pr-6">合计</th>
                    <th className="table-header text-center pr-6">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <ClipboardList size={40} className="mx-auto mb-3 opacity-40 text-soil-400" />
                        <p className="text-soil-500">暂无投入记录，点击上方按钮快速录入</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map(r => {
                      const cfg = CATEGORY_CONFIG[r.category];
                      const plot = scenarioPlots.find(p => p.id === r.plotId);
                      const mat = r.quantity * r.unitPrice;
                      const total = mat + r.laborCost;
                      return (
                        <tr key={r.id} className="hover:bg-soil-50/50 transition-colors border-b border-soil-50 last:border-0">
                          <td className="table-cell whitespace-nowrap text-soil-700">{r.date}</td>
                          <td className="table-cell">
                            <span className={`chip text-xs ${cfg.chip}`}>
                              <cfg.icon size={12} /> {cfg.label}
                            </span>
                          </td>
                          <td className="table-cell font-medium text-soil-800">
                            <div>{r.name}</div>
                            {r.notes && (
                              <div className="text-[11px] text-soil-400 mt-0.5 truncate max-w-[180px]">
                                {r.notes}
                              </div>
                            )}
                          </td>
                          <td className="table-cell text-sm">{plot?.name || '—'}</td>
                          <td className="table-cell text-right whitespace-nowrap">
                            {r.quantity} {r.unit}
                          </td>
                          <td className="table-cell text-right whitespace-nowrap text-soil-600">¥{mat.toFixed(0)}</td>
                          <td className="table-cell text-right whitespace-nowrap text-soil-600">¥{r.laborCost.toFixed(0)}</td>
                          <td className="table-cell text-right whitespace-nowrap">
                            <span className="font-semibold text-harvest-700">¥{total.toFixed(0)}</span>
                          </td>
                          <td className="table-cell pr-6">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEdit(r)}
                                className="p-1.5 rounded-lg hover:bg-field-50 text-field-600 transition-colors"
                              >
                                <Plus size={14} className="rotate-45" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`确定删除这条记录？`)) deleteInput(r.id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-tomato-50 text-tomato-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 右侧：统计图表 */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-song text-base font-bold text-field-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-field-500" />
              分类成本占比
            </h3>
            <div className="h-56">
              {categoryStats.reduce((s, c) => s + c.value, 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {categoryStats.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(value: number) => `¥${value.toFixed(0)}`}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2d5c0' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-soil-400 text-sm">
                  暂无数据
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-soil-100">
              {categoryStats.map(s => (
                <div key={s.name} className="text-center">
                  <div className="text-[10px] text-soil-500 mb-0.5">{s.name}人工</div>
                  <div className="text-sm font-semibold" style={{ color: s.color }}>
                    ¥{s.labor.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-song text-base font-bold text-field-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-field-500" />
              各地块投入对比
            </h3>
            <div className="h-56">
              {plotStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={plotStats.slice(0, 8)} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2d5c0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6f4734' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6f4734' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                    />
                    <RTooltip
                      formatter={(value: number) => `¥${value.toFixed(0)}`}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2d5c0' }}
                    />
                    <Bar dataKey="material" name="物资费" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="labor" name="人工费" fill="#D4A72C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-soil-400 text-sm">
                  暂无数据
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-song text-base font-bold text-field-800 mb-4">
              💡 成本分析
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-field-50/60 border border-field-100">
                <div>
                  <div className="text-xs text-field-600">亩均投入成本</div>
                </div>
                <div className="text-lg font-bold font-song text-field-800">
                  ¥{revenue.totalArea > 0 ? (revenue.totalCost / revenue.totalArea).toFixed(0) : 0}
                  <span className="text-xs font-normal text-field-600 ml-1">/亩</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/60 border border-sky-100">
                <div>
                  <div className="text-xs text-sky-600">人工占比</div>
                </div>
                <div className="text-lg font-bold font-song text-sky-800">
                  {totals.total > 0 ? ((totals.labor / totals.total) * 100).toFixed(1) : 0}
                  <span className="text-xs font-normal ml-1">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-harvest-50/60 border border-harvest-100">
                <div>
                  <div className="text-xs text-harvest-600">平均单次投入</div>
                </div>
                <div className="text-lg font-bold font-song text-harvest-800">
                  ¥{totals.count > 0 ? (totals.total / totals.count).toFixed(0) : 0}
                  <span className="text-xs font-normal ml-1 text-harvest-600">/次</span>
                </div>
              </div>
            </div>
            {monthlyStats.length > 1 && (
              <div className="mt-5 pt-4 border-t border-soil-100">
                <div className="text-xs font-semibold text-soil-500 mb-2">月度投入趋势</div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2d5c0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Bar dataKey="物资" fill="#2D6A4F" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="人工" fill="#D4A72C" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 弹窗 */}
      {showModal && (
        <RecordModal
          editing={editing}
          plots={scenarioPlots}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={(data) => {
            if (editing) updateInput(editing.id, data);
            else addInput(data);
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

interface ModalProps {
  editing: InputRecord | null;
  plots: ReturnType<typeof useAgriStore.getState>['plots'];
  onClose: () => void;
  onSave: (data: Omit<InputRecord, 'id' | 'scenarioId'>) => void;
}

function RecordModal({ editing, plots, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState<Omit<InputRecord, 'id' | 'scenarioId'>>({
    plotId: plots[0]?.id || '',
    category: editing?.category || 'fertilizer',
    name: editing?.name || '',
    date: editing?.date || formatDate(new Date()),
    quantity: editing?.quantity || 0,
    unit: editing?.unit || 'kg',
    unitPrice: editing?.unitPrice || 0,
    laborCost: editing?.laborCost || 0,
    notes: editing?.notes || '',
  });

  const total = form.quantity * form.unitPrice + form.laborCost;

  const units = DEFAULT_UNITS[form.category];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-0 max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-soil-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-song text-lg font-bold text-field-800">
            {editing ? '✏️ 编辑记录' : '➕ 新增投入记录'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-soil-100 text-soil-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">投入分类</label>
              <select
                id="input-category"
                className="input-base"
                value={form.category}
                onChange={e => {
                  const cat = e.target.value as InputCategory;
                  setForm({ ...form, category: cat, unit: DEFAULT_UNITS[cat][0] });
                }}
              >
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">日期</label>
              <input
                type="date"
                className="input-base"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="label-base">投入品名称 *</label>
              <input
                type="text"
                className="input-base"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={
                  form.category === 'fertilizer' ? '如：复合肥、尿素、有机肥'
                  : form.category === 'irrigation' ? '如：滴灌、漫灌'
                  : '如：杀虫剂、除草剂'
                }
              />
            </div>
            <div>
              <label className="label-base">地块</label>
              <select
                className="input-base"
                value={form.plotId}
                onChange={e => setForm({ ...form, plotId: e.target.value })}
              >
                {plots.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.areaMu}亩)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">用量</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="input-base flex-1"
                  value={form.quantity || ''}
                  onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                />
                <select
                  className="input-base !w-24"
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                >
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label-base">单价(元/{form.unit})</label>
              <input
                type="number"
                step="0.01"
                className="input-base"
                value={form.unitPrice || ''}
                onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="label-base">人工费(元)</label>
              <input
                type="number"
                step="0.01"
                className="input-base"
                value={form.laborCost || ''}
                onChange={e => setForm({ ...form, laborCost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <label className="label-base">备注</label>
              <textarea
                rows={2}
                className="input-base resize-none"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="使用方法、注意事项等..."
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-r from-field-50 to-harvest-50 border border-field-200/50
            flex items-center justify-between">
            <div className="text-sm text-soil-600">
              <div>物资费：¥{(form.quantity * form.unitPrice).toFixed(2)}</div>
              <div>人工费：¥{form.laborCost.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-soil-500">本次合计</div>
              <div className="text-2xl font-bold font-song text-harvest-700">¥{total.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-soil-100 bg-soil-50/50 flex justify-end gap-3 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="btn-secondary px-5">取消</button>
          <button
            onClick={() => {
              if (!form.name.trim()) { alert('请填写投入品名称'); return; }
              if (!form.plotId) { alert('请选择地块'); return; }
              onSave(form);
            }}
            className="btn-primary"
          >
            <Save size={16} /> 保存
          </button>
        </div>
      </div>
    </div>
  );
}
