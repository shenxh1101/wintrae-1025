import { useMemo, useState } from 'react';
import {
  MapPin,
  Layers,
  Sprout,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Ruler,
} from 'lucide-react';
import { useAgriStore, CROP_CATEGORIES } from '@/store/agriStore';
import type { Plot, PlotStatus, SoilType } from '@/types';

const STATUS_COLORS: Record<PlotStatus, { bg: string; text: string; dot: string }> = {
  '空闲': { bg: 'bg-soil-100', text: 'text-soil-700', dot: 'bg-soil-400' },
  '备耕': { bg: 'bg-soil-200/70', text: 'text-soil-800', dot: 'bg-soil-500' },
  '种植中': { bg: 'bg-harvest-100', text: 'text-harvest-700', dot: 'bg-harvest-400' },
  '生长中': { bg: 'bg-field-100', text: 'text-field-700', dot: 'bg-field-500' },
  '待采收': { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
  '已采收': { bg: 'bg-field-200/50', text: 'text-field-800', dot: 'bg-field-600' },
};

const SOIL_TYPES: SoilType[] = ['沙壤土', '粘壤土', '壤土', '砂土', '粘土'];
const STATUSES: PlotStatus[] = ['空闲', '备耕', '种植中', '生长中', '待采收', '已采收'];

interface EmptyPlot extends Omit<Plot, 'id' | 'scenarioId'> {}

const defaultPlot: EmptyPlot = {
  name: '',
  areaMu: 0,
  location: '',
  soilType: '壤土',
  cropId: null,
  status: '空闲',
  notes: '',
};

export default function PlotDashboard() {
  const {
    currentScenarioId,
    plots,
    addPlot,
    updatePlot,
    deletePlot,
    getAllCrops,
    getCropById,
    computeRevenue,
  } = useAgriStore();
  const [editing, setEditing] = useState<{ isNew: boolean; plot: EmptyPlot | Plot } | null>(null);

  const allCrops = useMemo(() => getAllCrops(), [getAllCrops]);
  const scenarioPlots = useMemo(
    () => plots.filter(p => p.scenarioId === currentScenarioId),
    [plots, currentScenarioId],
  );
  const revenue = useMemo(() => computeRevenue(), [computeRevenue]);

  const stats = useMemo(() => {
    const total = scenarioPlots.length;
    const area = scenarioPlots.reduce((s, p) => s + p.areaMu, 0);
    const cropCount = new Set(scenarioPlots.map(p => p.cropId).filter(Boolean)).size;
    const growing = scenarioPlots.filter(
      p => p.status === '种植中' || p.status === '生长中' || p.status === '待采收',
    ).length;
    return { total, area, cropCount, growing };
  }, [scenarioPlots]);

  const openNew = () => setEditing({ isNew: true, plot: { ...defaultPlot } });
  const openEdit = (plot: Plot) => setEditing({ isNew: false, plot: { ...plot } });
  const close = () => setEditing(null);

  const save = () => {
    if (!editing) return;
    const p = editing.plot;
    if (!p.name.trim() || p.areaMu <= 0) {
      alert('请填写地块名称和面积');
      return;
    }
    if (editing.isNew) {
      addPlot(p);
    } else {
      updatePlot((p as Plot).id, p);
    }
    close();
  };

  const getCropColor = (cropId: string | null): string => {
    if (!cropId) return '#d0b897';
    const crop = getCropById(cropId);
    if (!crop) return '#d0b897';
    const cat = CROP_CATEGORIES.find(c => c.id === crop.categoryId);
    return cat?.color || '#2D6A4F';
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="page-header">🗺️ 地块看板</h1>
          <p className="page-subtitle mb-0">
            总览全部地块信息，管理种植区域，直观展示生产布局
          </p>
        </div>
        <button onClick={openNew} className="btn-primary self-start md:self-auto">
          <Plus size={18} />
          新增地块
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card bg-gradient-to-br from-field-400 to-field-600 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Layers size={22} />
            </div>
            <span className="text-xs text-field-100/80">地块数</span>
          </div>
          <div className="text-3xl font-bold font-song">{stats.total}</div>
          <div className="text-xs text-field-100/90 mt-1">块登记地块</div>
        </div>

        <div className="stat-card bg-gradient-to-br from-harvest-400 to-harvest-600 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Ruler size={22} />
            </div>
            <span className="text-xs text-harvest-50/90">总面积</span>
          </div>
          <div className="text-3xl font-bold font-song">
            {stats.area.toFixed(0)}
            <span className="text-base font-normal ml-1 opacity-80">亩</span>
          </div>
          <div className="text-xs text-harvest-50/90 mt-1">
            平均 {(stats.total ? stats.area / stats.total : 0).toFixed(1)} 亩/块
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-sky-400 to-sky-600 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Sprout size={22} />
            </div>
            <span className="text-xs text-sky-50/90">作物种类</span>
          </div>
          <div className="text-3xl font-bold font-song">{stats.cropCount}</div>
          <div className="text-xs text-sky-50/90 mt-1">个作物品种</div>
        </div>

        <div className="stat-card bg-gradient-to-br from-field-600 to-harvest-500 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
            <span className="text-xs opacity-80">在生长中</span>
          </div>
          <div className="text-3xl font-bold font-song">
            {stats.growing}
            <span className="text-base font-normal ml-1 opacity-80">/ {stats.total}</span>
          </div>
          <div className="text-xs opacity-80 mt-1">
            预估产量 {revenue.estimatedYield.toFixed(0)} kg
          </div>
        </div>
      </div>

      {/* 地块网格视图 */}
      <div className="card mb-6">
        <h3 className="font-song text-lg font-bold text-field-800 mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-field-500" />
          地块分布总览
        </h3>

        {scenarioPlots.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-6xl mb-4 opacity-40">🌱</div>
            <p className="text-soil-500 mb-4">还没有登记地块，开始创建第一个地块吧</p>
            <button onClick={openNew} className="btn-primary">
              <Plus size={18} />
              新增地块
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scenarioPlots.map((plot, idx) => {
              const statusStyle = STATUS_COLORS[plot.status];
              const crop = plot.cropId ? getCropById(plot.cropId) : null;
              const color = getCropColor(plot.cropId);
              return (
                <div
                  key={plot.id}
                  className="group relative overflow-hidden rounded-2xl border border-soil-200/80
                    bg-white transition-all duration-300 hover:shadow-hover hover:-translate-y-0.5 cursor-pointer"
                  style={{ animationDelay: `${idx * 40}ms` }}
                  onClick={() => openEdit(plot)}
                >
                  {/* 色块顶部 */}
                  <div
                    className="h-24 relative"
                    style={{
                      background: `linear-gradient(135deg, ${color}cc 0%, ${color}88 100%)`,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 12px)",
                      }}
                    />
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <span
                        className={`badge ${statusStyle.bg} ${statusStyle.text} backdrop-blur-sm`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {plot.status}
                      </span>
                      <span className="text-white/95 font-bold text-lg drop-shadow">
                        {plot.areaMu}亩
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <div className="text-xs opacity-90">地块</div>
                      <div className="font-song font-bold text-lg leading-tight drop-shadow">
                        {plot.name}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        {crop ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">
                              {CROP_CATEGORIES.find(c => c.id === crop.categoryId)?.icon}
                            </span>
                            <span className="text-sm font-medium text-soil-800 truncate">
                              {crop.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-soil-400 italic">未分配作物</span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-soil-500 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span className="truncate">{plot.location || '位置未标注'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers size={12} />
                        <span>{plot.soilType}</span>
                      </div>
                    </div>

                    {plot.notes && (
                      <p className="text-xs text-soil-400 mt-2 pt-2 border-t border-soil-100 line-clamp-2">
                        {plot.notes}
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-t border-soil-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(plot); }}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-field-50 text-field-700
                          hover:bg-field-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit3 size={13} /> 编辑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定删除地块「${plot.name}」？相关记录也会一并删除`)) {
                            deletePlot(plot.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-tomato-50 text-tomato-600
                          hover:bg-tomato-100 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 地块列表表格 */}
      {scenarioPlots.length > 0 && (
        <div className="card">
          <h3 className="font-song text-lg font-bold text-field-800 mb-4">详细清单</h3>
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  <th className="table-header pl-6">地块名称</th>
                  <th className="table-header">面积(亩)</th>
                  <th className="table-header">位置</th>
                  <th className="table-header">土壤</th>
                  <th className="table-header">种植作物</th>
                  <th className="table-header">状态</th>
                  <th className="table-header pr-6 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {scenarioPlots.map(plot => {
                  const ss = STATUS_COLORS[plot.status];
                  const crop = plot.cropId ? getCropById(plot.cropId) : null;
                  return (
                    <tr key={plot.id} className="hover:bg-soil-50/40 transition-colors">
                      <td className="table-cell pl-6 font-medium text-soil-800">{plot.name}</td>
                      <td className="table-cell font-semibold text-field-700">{plot.areaMu}</td>
                      <td className="table-cell">{plot.location}</td>
                      <td className="table-cell">{plot.soilType}</td>
                      <td className="table-cell">
                        {crop ? (
                          <span className="chip bg-field-50 text-field-700 border border-field-100">
                            {CROP_CATEGORIES.find(c => c.id === crop.categoryId)?.icon}{' '}
                            {crop.name}
                          </span>
                        ) : (
                          <span className="text-soil-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${ss.bg} ${ss.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                          {plot.status}
                        </span>
                      </td>
                      <td className="table-cell pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(plot)}
                            className="p-1.5 rounded-lg hover:bg-field-50 text-field-600 transition-colors"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`确定删除「${plot.name}」？`)) deletePlot(plot.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-tomato-50 text-tomato-500 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editing && (
        <div className="modal-overlay" onClick={close}>
          <div
            className="modal-content p-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-soil-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-song text-lg font-bold text-field-800">
                {editing.isNew ? '🌱 新增地块' : '✏️ 编辑地块'}
              </h3>
              <button
                onClick={close}
                className="p-2 rounded-lg hover:bg-soil-100 text-soil-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-base">地块名称 *</label>
                  <input
                    type="text"
                    className="input-base"
                    value={editing.plot.name}
                    onChange={e =>
                      setEditing({ ...editing, plot: { ...editing.plot, name: e.target.value } })
                    }
                    placeholder="如：东大田"
                  />
                </div>
                <div>
                  <label className="label-base">面积(亩) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="input-base"
                    value={editing.plot.areaMu || ''}
                    onChange={e =>
                      setEditing({
                        ...editing,
                        plot: { ...editing.plot, areaMu: parseFloat(e.target.value) || 0 },
                      })
                    }
                    placeholder="如：50"
                  />
                </div>
                <div>
                  <label className="label-base">土壤类型</label>
                  <select
                    className="input-base"
                    value={editing.plot.soilType}
                    onChange={e =>
                      setEditing({
                        ...editing,
                        plot: { ...editing.plot, soilType: e.target.value as SoilType },
                      })
                    }
                  >
                    {SOIL_TYPES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label-base">位置/片区</label>
                  <input
                    type="text"
                    className="input-base"
                    value={editing.plot.location}
                    onChange={e =>
                      setEditing({ ...editing, plot: { ...editing.plot, location: e.target.value } })
                    }
                    placeholder="如：村东区域、北冲田"
                  />
                </div>
                <div>
                  <label className="label-base">种植状态</label>
                  <select
                    className="input-base"
                    value={editing.plot.status}
                    onChange={e =>
                      setEditing({
                        ...editing,
                        plot: { ...editing.plot, status: e.target.value as PlotStatus },
                      })
                    }
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base">种植作物</label>
                  <select
                    className="input-base"
                    value={editing.plot.cropId || ''}
                    onChange={e =>
                      setEditing({
                        ...editing,
                        plot: { ...editing.plot, cropId: e.target.value || null },
                      })
                    }
                  >
                    <option value="">暂未分配</option>
                    <optgroup label="-- 预设品种库 --">
                      {allCrops.map(c => (
                        <option key={c.id} value={c.id}>
                          {CROP_CATEGORIES.find(cc => cc.id === c.categoryId)?.icon} {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label-base">备注</label>
                  <textarea
                    rows={2}
                    className="input-base resize-none"
                    value={editing.plot.notes}
                    onChange={e =>
                      setEditing({ ...editing, plot: { ...editing.plot, notes: e.target.value } })
                    }
                    placeholder="排灌条件、土壤肥力、特殊说明等..."
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-soil-100 bg-soil-50/50 flex justify-end gap-3 rounded-b-2xl sticky bottom-0">
              <button onClick={close} className="btn-secondary px-5">取消</button>
              <button onClick={save} className="btn-primary">
                <Save size={16} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
