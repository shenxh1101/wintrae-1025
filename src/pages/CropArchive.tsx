import { useMemo, useState } from 'react';
import {
  Sprout,
  Plus,
  X,
  Save,
  CalendarClock,
  Tag,
  Droplets,
  Leaf,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { useAgriStore, CROP_CATEGORIES } from '@/store/agriStore';
import type { CropVariety, FarmTaskTemplate, TaskType } from '@/types';

const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: string; color: string; bg: string }> = {
  sowing: { label: '播种/育苗', icon: '🌱', color: 'text-harvest-700', bg: 'bg-harvest-50 border-harvest-200' },
  fertilize: { label: '施肥', icon: '🧪', color: 'text-field-700', bg: 'bg-field-50 border-field-200' },
  irrigate: { label: '灌溉', icon: '💧', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  pesticide: { label: '打药', icon: '🧴', color: 'text-tomato-700', bg: 'bg-tomato-50 border-tomato-200' },
  weed: { label: '除草', icon: '🌿', color: 'text-soil-700', bg: 'bg-soil-50 border-soil-200' },
  harvest: { label: '收获', icon: '🌾', color: 'text-harvest-800', bg: 'bg-harvest-100 border-harvest-300' },
};

const DEFAULT_TASKS: FarmTaskTemplate[] = [
  { type: 'sowing', name: '整地播种', dayOffset: 0, description: '精细整地，适期播种' },
  { type: 'fertilize', name: '施基肥', dayOffset: 0, description: '结合整地施入基肥' },
  { type: 'irrigate', name: '苗期浇水', dayOffset: 7, description: '保证出苗水' },
  { type: 'fertilize', name: '追施苗肥', dayOffset: 20, description: '促进苗期生长' },
  { type: 'pesticide', name: '苗期病虫害', dayOffset: 30, description: '防治苗期病虫害' },
  { type: 'fertilize', name: '追肥', dayOffset: 60, description: '生长关键期追肥' },
  { type: 'irrigate', name: '关键期浇水', dayOffset: 70, description: '需水临界期浇水' },
  { type: 'harvest', name: '收获', dayOffset: 100, description: '适期收获' },
];

export default function CropArchive() {
  const {
    currentScenarioId,
    plots,
    getAllCrops,
    getCropById,
    assignCrop,
    addCustomCrop,
    customCrops,
    deleteCustomCrop,
  } = useAgriStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const allCrops = useMemo(() => getAllCrops(), [getAllCrops]);
  const scenarioPlots = useMemo(
    () => plots.filter(p => p.scenarioId === currentScenarioId),
    [plots, currentScenarioId],
  );

  const filteredCrops = useMemo(() => {
    if (activeCategory === 'all') return allCrops;
    if (activeCategory === 'custom') return customCrops;
    return allCrops.filter(c => c.categoryId === activeCategory);
  }, [activeCategory, allCrops, customCrops]);

  const selectedCrop = selectedCropId ? getCropById(selectedCropId) : filteredCrops[0];

  const plotsUsingCrop = useMemo(() => {
    if (!selectedCrop) return [];
    return scenarioPlots.filter(p => p.cropId === selectedCrop.id);
  }, [scenarioPlots, selectedCrop]);

  const tabs = [
    { id: 'all', name: '全部', icon: '🌾' },
    ...CROP_CATEGORIES.map(c => ({ id: c.id, name: c.name, icon: c.icon })),
    { id: 'custom', name: '自定义', icon: '✨' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="page-header">📚 作物档案</h1>
          <p className="page-subtitle mb-0">
            浏览作物品种库，配置生长参数，为各地块安排种植计划
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-warning self-start md:self-auto"
        >
          <Plus size={18} />
          添加自定义品种
        </button>
      </div>

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveCategory(tab.id);
              setSelectedCropId(null);
            }}
            className={`chip transition-all ${
              activeCategory === tab.id
                ? 'bg-field-500 text-white shadow-md shadow-field-500/20'
                : 'bg-white text-soil-700 border border-soil-200 hover:border-field-300 hover:bg-field-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
            {tab.id !== 'all' && tab.id !== 'custom' && (
              <span className={`ml-1 ${activeCategory === tab.id ? 'text-white/80' : 'text-soil-400'}`}>
                {allCrops.filter(c => c.categoryId === tab.id).length}
              </span>
            )}
            {tab.id === 'custom' && customCrops.length > 0 && (
              <span className={`ml-1 ${activeCategory === tab.id ? 'text-white/80' : 'text-soil-400'}`}>
                {customCrops.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 品种列表 */}
        <div className="lg:col-span-2 space-y-3">
          <div className="card p-3">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="font-song text-sm font-bold text-field-800">
                品种列表 <span className="text-soil-400 font-normal">({filteredCrops.length})</span>
              </h3>
            </div>
            <div className="space-y-2 max-h-[560px] overflow-y-auto scrollbar-thin pr-1">
              {filteredCrops.map(crop => {
                const cat = CROP_CATEGORIES.find(c => c.id === crop.categoryId);
                const isActive = selectedCrop?.id === crop.id;
                const usedCount = scenarioPlots.filter(p => p.cropId === crop.id).length;
                const isCustom = customCrops.some(c => c.id === crop.id);
                return (
                  <button
                    key={crop.id}
                    onClick={() => setSelectedCropId(crop.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all border-2 group
                      ${isActive
                        ? 'border-field-500 bg-field-50/60 shadow-sm'
                        : 'border-transparent hover:border-field-200 hover:bg-soil-50/60'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: `${cat?.color || '#2D6A4F'}18` }}
                      >
                        {cat?.icon || '🌾'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm text-soil-800 truncate">
                            {crop.name}
                          </span>
                          {isCustom && (
                            <span className="badge bg-harvest-100 text-harvest-700 text-[10px]">
                              自定义
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-soil-500 mt-0.5 truncate">
                          {cat?.name} · {crop.growthDays}天 · {crop.yieldPerMu}kg/亩
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              usedCount > 0 ? 'bg-field-100 text-field-700' : 'bg-soil-100 text-soil-500'
                            }`}
                          >
                            {usedCount} 块地
                          </span>
                          <span className="text-soil-400">
                            单价 ¥{crop.unitPrice}/kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredCrops.length === 0 && (
                <div className="py-12 text-center text-soil-400 text-sm">
                  暂无品种，点击上方添加
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 详情面板 */}
        <div className="lg:col-span-3 space-y-6">
          {selectedCrop ? (
            <>
              {/* 基本信息卡片 */}
              <div className="card relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -mr-16 -mt-16"
                  style={{ background: CROP_CATEGORIES.find(c => c.id === selectedCrop.categoryId)?.color || '#2D6A4F' }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${CROP_CATEGORIES.find(c => c.id === selectedCrop.categoryId)?.color || '#2D6A4F'}cc, ${CROP_CATEGORIES.find(c => c.id === selectedCrop.categoryId)?.color || '#2D6A4F'}88)`,
                        }}
                      >
                        {CROP_CATEGORIES.find(c => c.id === selectedCrop.categoryId)?.icon || '🌾'}
                      </div>
                      <div>
                        <h2 className="font-song text-2xl font-bold text-field-800">
                          {selectedCrop.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="chip bg-soil-50 text-soil-600 border border-soil-200 text-xs">
                            {CROP_CATEGORIES.find(c => c.id === selectedCrop.categoryId)?.name}
                          </span>
                          {customCrops.some(c => c.id === selectedCrop.id) && (
                            <button
                              onClick={() => {
                                if (confirm('确定删除这个自定义品种？')) {
                                  deleteCustomCrop(selectedCrop.id);
                                  setSelectedCropId(null);
                                }
                              }}
                              className="chip bg-tomato-50 text-tomato-600 border border-tomato-200 text-xs hover:bg-tomato-100 cursor-pointer"
                            >
                              删除
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-soil-600 mt-2 max-w-xl leading-relaxed">
                          {selectedCrop.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-field-50/60 border border-field-100">
                      <div className="text-xs text-field-600 mb-1 flex items-center gap-1">
                        <Sprout size={13} /> 预估亩产
                      </div>
                      <div className="text-2xl font-bold font-song text-field-800">
                        {selectedCrop.yieldPerMu}
                        <span className="text-sm font-normal text-field-600 ml-1">kg</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-harvest-50/60 border border-harvest-100">
                      <div className="text-xs text-harvest-700 mb-1 flex items-center gap-1">
                        <CalendarClock size={13} /> 生长周期
                      </div>
                      <div className="text-2xl font-bold font-song text-harvest-800">
                        {selectedCrop.growthDays}
                        <span className="text-sm font-normal text-harvest-700 ml-1">天</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100">
                      <div className="text-xs text-sky-700 mb-1 flex items-center gap-1">
                        <Tag size={13} /> 市场单价
                      </div>
                      <div className="text-2xl font-bold font-song text-sky-800">
                        ¥{selectedCrop.unitPrice}
                        <span className="text-sm font-normal text-sky-700 ml-1">/kg</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-field-50/80 border border-field-100">
                      <div className="text-xs text-field-600 mb-1 flex items-center gap-1">
                        <Leaf size={13} /> 亩均产值
                      </div>
                      <div className="text-2xl font-bold font-song text-field-800">
                        ¥{(selectedCrop.yieldPerMu * selectedCrop.unitPrice).toFixed(0)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-soil-50/60 border border-soil-100">
                      <div className="text-xs text-soil-500 mb-1">适宜播种期</div>
                      <div className="font-medium text-soil-800">{selectedCrop.sowingWindow}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-soil-50/60 border border-soil-100">
                      <div className="text-xs text-soil-500 mb-1">适宜采收期</div>
                      <div className="font-medium text-soil-800">{selectedCrop.harvestWindow}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 地块绑定 */}
              <div className="card">
                <h3 className="font-song text-lg font-bold text-field-800 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-field-500" />
                  地块种植分配
                </h3>
                {scenarioPlots.length === 0 ? (
                  <div className="py-8 text-center text-soil-400 text-sm">
                    请先在「地块看板」添加地块
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {scenarioPlots.map(plot => {
                      const assigned = plot.cropId === selectedCrop.id;
                      const plotCrop = plot.cropId ? getCropById(plot.cropId) : null;
                      return (
                        <div
                          key={plot.id}
                          className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer
                            ${assigned
                              ? 'border-field-500 bg-field-50/60'
                              : 'border-soil-200 hover:border-field-300 bg-white'}`}
                          onClick={() => assignCrop(plot.id, assigned ? '' : selectedCrop.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm text-soil-800">{plot.name}</span>
                            {assigned ? (
                              <CheckCircle size={18} className="text-field-600" />
                            ) : (
                              <Circle size={18} className="text-soil-300" />
                            )}
                          </div>
                          <div className="text-xs text-soil-500">
                            {plot.areaMu}亩 · {plot.status}
                          </div>
                          {!assigned && plotCrop && (
                            <div className="text-[11px] text-harvest-600 mt-1">
                              当前种植：{plotCrop.name.slice(0, 8)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {plotsUsingCrop.length > 0 && (
                  <div className="mt-4 p-3.5 rounded-xl bg-field-50/60 border border-field-200 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-semibold text-field-800">{plotsUsingCrop.length}</span>
                      <span className="text-field-700"> 块地 · 共 </span>
                      <span className="font-semibold text-field-800">
                        {plotsUsingCrop.reduce((s, p) => s + p.areaMu, 0).toFixed(0)}
                      </span>
                      <span className="text-field-700"> 亩</span>
                    </div>
                    <div className="text-sm text-harvest-700 font-semibold">
                      预估总产量 {
                        (plotsUsingCrop.reduce((s, p) => s + p.areaMu, 0) * selectedCrop.yieldPerMu).toFixed(0)
                      } kg
                    </div>
                  </div>
                )}
              </div>

              {/* 农事计划模板 */}
              <div className="card">
                <h3 className="font-song text-lg font-bold text-field-800 mb-4 flex items-center gap-2">
                  <CalendarClock size={18} className="text-field-500" />
                  标准农事计划（{selectedCrop.tasks.length}项任务）
                </h3>
                <div className="relative pb-2">
                  {/* 时间轴 */}
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-harvest-300 via-field-300 to-field-400" />
                  <div className="space-y-3">
                    {selectedCrop.tasks
                      .sort((a, b) => a.dayOffset - b.dayOffset)
                      .map((task, idx) => {
                        const cfg = TASK_TYPE_CONFIG[task.type];
                        const progress = (task.dayOffset / selectedCrop.growthDays) * 100;
                        return (
                          <div key={idx} className="relative pl-14">
                            <div
                              className={`absolute left-3 top-3.5 w-4 h-4 rounded-full border-2
                                ${cfg.bg.split(' ')[0]} border-white shadow-md
                                flex items-center justify-center text-[10px]`}
                              style={{ transform: 'translate(-50%, 0)' }}
                            >
                              {idx + 1}
                            </div>
                            <div className={`p-3.5 rounded-xl border ${cfg.bg} transition-all hover:shadow-sm`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-base">{cfg.icon}</span>
                                    <span className="font-semibold text-sm text-soil-800">{task.name}</span>
                                    <span className={`badge bg-white/70 ${cfg.color} border border-white`}>
                                      {cfg.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-soil-600 mt-1.5 leading-relaxed">
                                    {task.description}
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="text-lg font-bold font-song text-soil-800">
                                    D{task.dayOffset}
                                  </div>
                                  <div className="text-[11px] text-soil-500">
                                    {progress.toFixed(0)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card py-16 text-center text-soil-400">
              <Sprout size={48} className="mx-auto mb-3 opacity-50" />
              <p>请从左侧选择作物品种查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 创建新品种弹窗 */}
      {showCreate && (
        <CreateCropModal
          onClose={() => setShowCreate(false)}
          onSave={(crop) => {
            addCustomCrop(crop);
            setShowCreate(false);
            setActiveCategory('custom');
          }}
        />
      )}
    </div>
  );
}

function MapPin(props: any) {
  return <Droplets {...props} />;
}

interface CreateProps {
  onClose: () => void;
  onSave: (crop: Omit<CropVariety, 'id'>) => void;
}

function CreateCropModal({ onClose, onSave }: CreateProps) {
  const [form, setForm] = useState<Omit<CropVariety, 'id'>>({
    categoryId: CROP_CATEGORIES[0].id,
    name: '',
    yieldPerMu: 500,
    growthDays: 100,
    unitPrice: 3,
    sowingWindow: '',
    harvestWindow: '',
    description: '',
    tasks: [...DEFAULT_TASKS],
  });

  const updateTask = (idx: number, field: keyof FarmTaskTemplate, value: any) => {
    const newTasks = [...form.tasks];
    newTasks[idx] = { ...newTasks[idx], [field]: value };
    setForm({ ...form, tasks: newTasks });
  };
  const addTask = () => setForm({ ...form, tasks: [...form.tasks, { ...DEFAULT_TASKS[3] }] });
  const removeTask = (idx: number) => {
    const newTasks = form.tasks.filter((_, i) => i !== idx);
    setForm({ ...form, tasks: newTasks });
  };

  const submit = () => {
    if (!form.name.trim()) {
      alert('请输入品种名称');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content p-0 max-w-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-soil-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-song text-lg font-bold text-field-800">
            🌱 添加自定义品种
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-soil-100 text-soil-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">所属分类</label>
              <select
                className="input-base"
                value={form.categoryId}
                onChange={e => setForm({ ...form, categoryId: e.target.value })}
              >
                {CROP_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">品种名称 *</label>
              <input
                type="text"
                className="input-base"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="如：郑单958"
              />
            </div>
            <div>
              <label className="label-base">亩产(kg)</label>
              <input
                type="number"
                className="input-base"
                value={form.yieldPerMu}
                onChange={e => setForm({ ...form, yieldPerMu: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="label-base">生长周期(天)</label>
              <input
                type="number"
                className="input-base"
                value={form.growthDays}
                onChange={e => setForm({ ...form, growthDays: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="label-base">单价(元/kg)</label>
              <input
                type="number"
                step="0.1"
                className="input-base"
                value={form.unitPrice}
                onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div />
            <div>
              <label className="label-base">适宜播种期</label>
              <input
                type="text"
                className="input-base"
                value={form.sowingWindow}
                onChange={e => setForm({ ...form, sowingWindow: e.target.value })}
                placeholder="如：4月上旬"
              />
            </div>
            <div>
              <label className="label-base">适宜采收期</label>
              <input
                type="text"
                className="input-base"
                value={form.harvestWindow}
                onChange={e => setForm({ ...form, harvestWindow: e.target.value })}
                placeholder="如：8月中旬"
              />
            </div>
            <div className="col-span-2">
              <label className="label-base">品种描述</label>
              <textarea
                rows={2}
                className="input-base resize-none"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label-base mb-0">农事任务模板</label>
              <button onClick={addTask} className="text-xs text-field-600 hover:text-field-800 font-medium">
                + 添加任务
              </button>
            </div>
            <div className="space-y-2">
              {form.tasks.map((task, idx) => {
                const cfg = TASK_TYPE_CONFIG[task.type];
                return (
                  <div key={idx} className={`p-3 rounded-xl border ${cfg.bg}`}>
                    <div className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-2">
                        <select
                          className="input-base !py-1.5 text-xs"
                          value={task.type}
                          onChange={e => updateTask(idx, 'type', e.target.value as TaskType)}
                        >
                          {Object.entries(TASK_TYPE_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.icon} {v.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          className="input-base !py-1.5 text-xs"
                          value={task.name}
                          onChange={e => updateTask(idx, 'name', e.target.value)}
                          placeholder="任务名称"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-soil-500 shrink-0">D</span>
                          <input
                            type="number"
                            className="input-base !py-1.5 text-xs"
                            value={task.dayOffset}
                            onChange={e => updateTask(idx, 'dayOffset', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          className="input-base !py-1.5 text-xs"
                          value={task.description}
                          onChange={e => updateTask(idx, 'description', e.target.value)}
                          placeholder="说明"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeTask(idx)}
                          className="p-1.5 rounded-lg text-soil-400 hover:text-tomato-500 hover:bg-tomato-50"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-soil-100 bg-soil-50/50 flex justify-end gap-3 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="btn-secondary px-5">取消</button>
          <button onClick={submit} className="btn-primary">
            <Save size={16} />
            保存品种
          </button>
        </div>
      </div>
    </div>
  );
}
