import { useState } from 'react';
import { X, Plus, Trash2, Check, FolderOpen, Copy } from 'lucide-react';
import { useAgriStore, PRESET_SCENARIOS } from '@/store/agriStore';

interface Props {
  onClose: () => void;
}

export default function ScenarioModal({ onClose }: Props) {
  const {
    currentScenarioId,
    scenarios,
    createScenario,
    deleteScenario,
    switchScenario,
    duplicateScenario,
    ensureScenarioLoaded,
  } = useAgriStore();
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // 合并预设和本地保存的案例，预设优先显示
  const allScenarios = [
    ...PRESET_SCENARIOS.map(p => ({ ...p.scenario, isPreset: true, isLoaded: scenarios.some(s => s.id === p.scenario.id) })),
    ...scenarios.filter(s => !PRESET_SCENARIOS.some(p => p.scenario.id === s.id)).map(s => ({ ...s, isPreset: false, isLoaded: true })),
  ];

  const handleCreate = () => {
    if (!newName.trim()) return;
    createScenario(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handleSwitch = (id: string, isPreset: boolean) => {
    if (isPreset) {
      ensureScenarioLoaded(id);
    }
    switchScenario(id);
    onClose();
  };

  const handleDuplicate = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const newNameVal = prompt('为复制的案例命名：', `${name} - 副本`);
    if (!newNameVal?.trim()) return;
    const result = duplicateScenario(id, newNameVal.trim());
    if (result) {
      onClose();
    } else {
      alert('复制失败');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-soil-100 flex items-center justify-between">
          <div>
            <h3 className="font-song text-xl font-bold text-field-800 flex items-center gap-2">
              <FolderOpen size={22} className="text-harvest-500" />
              演示案例管理
            </h3>
            <p className="text-sm text-soil-500 mt-1">切换、创建、复制或删除演示案例，快速更换展示内容</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-soil-100 text-soil-500 hover:text-soil-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {/* 创建新案例 */}
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full p-4 rounded-xl border-2 border-dashed border-field-300
                text-field-600 hover:border-field-500 hover:bg-field-50/50
                flex items-center justify-center gap-2 transition-all group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-medium">创建新的演示案例</span>
            </button>
          ) : (
            <div className="p-5 rounded-xl bg-field-50/60 border border-field-200 animate-fade-in">
              <div className="font-semibold text-field-800 mb-3">创建新案例</div>
              <div className="space-y-3">
                <div>
                  <label className="label-base">案例名称</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="input-base"
                    placeholder="如：小麦玉米周年种植方案"
                  />
                </div>
                <div>
                  <label className="label-base">案例描述</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="input-base resize-none"
                    rows={2}
                    placeholder="简要描述本案例的特色、适用场景..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    创建并进入
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 案例列表 */}
          <div className="divider" />

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-soil-500 uppercase tracking-wider px-1">
              全部案例 ({allScenarios.length})
            </h4>
            {allScenarios.map(s => {
              const isActive = s.id === currentScenarioId;
              return (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer group
                    ${isActive
                      ? 'border-field-500 bg-field-50/70 shadow-sm'
                      : 'border-soil-200 hover:border-field-300 hover:bg-soil-50/60'}`}
                  onClick={() => handleSwitch(s.id, s.isPreset)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-soil-800">{s.name}</span>
                        {s.isPreset && (
                          <span className="badge bg-harvest-100 text-harvest-700">
                            官方预设
                          </span>
                        )}
                        {isActive && (
                          <span className="badge bg-field-500 text-white">
                            <Check size={12} />
                            当前
                          </span>
                        )}
                        {s.isLoaded && !isActive && s.isPreset && (
                          <span className="badge bg-sky-50 text-sky-600 border border-sky-200">
                            已加载
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-sm text-soil-500 mt-1 line-clamp-2">{s.description}</p>
                      )}
                      <p className="text-xs text-soil-400 mt-1.5">
                        创建于 {new Date(s.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDuplicate(e, s.id, s.name)}
                        className="p-2 rounded-lg text-soil-400 hover:text-field-500 hover:bg-field-50 transition-all"
                        title="复制此案例"
                      >
                        <Copy size={18} />
                      </button>
                      {!s.isPreset && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`确定要删除案例「${s.name}」吗？`)) {
                              deleteScenario(s.id);
                            }
                          }}
                          className="p-2 rounded-lg text-soil-400 hover:text-tomato-500 hover:bg-tomato-50 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-soil-100 bg-soil-50/50 rounded-b-2xl">
          <p className="text-xs text-soil-500 text-center">
            💡 预设案例加载后会保存在本地，刷新不丢失。不同案例的数据相互独立。
          </p>
        </div>
      </div>
    </div>
  );
}
