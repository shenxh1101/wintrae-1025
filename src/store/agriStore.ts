import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Scenario,
  Plot,
  CropVariety,
  ScheduledTask,
  InputRecord,
  WeatherSample,
  InputCategory,
  TaskType,
} from '@/types';
import {
  PRESET_SCENARIOS,
  CROP_VARIETIES,
  CROP_CATEGORIES,
  generateId,
  formatDate,
  generateWeather,
} from '@/data/presets';

type GenerateMode = 'append' | 'overwrite';

interface ScenarioSnapshot {
  plots: Plot[];
  tasks: ScheduledTask[];
  inputs: InputRecord[];
  weather: WeatherSample[];
  timestamp: number;
  scenarioId: string;
}

interface AgriState {
  currentScenarioId: string;
  scenarios: Scenario[];
  plots: Plot[];
  tasks: ScheduledTask[];
  inputs: InputRecord[];
  weather: WeatherSample[];
  customCrops: CropVariety[];
  snapshot: ScenarioSnapshot | null;

  loadPreset: (presetId: string) => boolean;
  loadFirstPreset: () => void;
  ensureScenarioLoaded: (scenarioId: string) => boolean;

  createScenario: (name: string, description: string) => Scenario;
  duplicateScenario: (sourceId: string, newName: string) => Scenario | null;
  deleteScenario: (id: string) => void;
  switchScenario: (id: string) => void;
  exportScenario: (scenarioId?: string) => string;
  importScenario: (json: string) => boolean;
  clearCurrentData: () => void;

  saveSnapshot: () => boolean;
  restoreSnapshot: () => boolean;
  clearSnapshot: () => void;
  hasSnapshot: boolean;

  addPlot: (plot: Omit<Plot, 'id' | 'scenarioId'>) => void;
  updatePlot: (id: string, updates: Partial<Plot>) => void;
  deletePlot: (id: string) => void;
  assignCrop: (plotId: string, cropId: string) => void;
  generateTasksForPlot: (plotId: string, sowingDate?: string, mode?: GenerateMode) => void;

  toggleTaskCompleted: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  addInput: (input: Omit<InputRecord, 'id' | 'scenarioId'>) => void;
  updateInput: (id: string, updates: Partial<InputRecord>) => void;
  deleteInput: (id: string) => void;

  addCustomCrop: (crop: Omit<CropVariety, 'id'>) => void;
  updateCustomCrop: (id: string, updates: Partial<CropVariety>) => void;
  deleteCustomCrop: (id: string) => void;

  getAllCrops: () => CropVariety[];
  getCropById: (id: string) => CropVariety | undefined;
  getCategoryName: (categoryId: string) => string;

  computeRevenue: (scenarioId?: string) => {
    totalArea: number;
    estimatedYield: number;
    totalRevenue: number;
    materialCost: number;
    laborCost: number;
    totalCost: number;
    netProfit: number;
    profitPerMu: number;
    roi: number;
    perPlot: { plotId: string; name: string; area: number; yield: number; revenue: number; cost: number; profit: number }[];
    perCategory: Record<InputCategory, { material: number; labor: number; total: number }>;
  };
}

const computeRevenueFn = (
  plots: Plot[],
  inputs: InputRecord[],
  allCrops: CropVariety[],
) => {
  let totalArea = 0;
  let estimatedYield = 0;
  let totalRevenue = 0;
  let materialCost = 0;
  let laborCost = 0;

  const perPlot: { plotId: string; name: string; area: number; yield: number; revenue: number; cost: number; profit: number }[] = [];
  const perCategory: Record<InputCategory, { material: number; labor: number; total: number }> = {
    fertilizer: { material: 0, labor: 0, total: 0 },
    irrigation: { material: 0, labor: 0, total: 0 },
    pesticide: { material: 0, labor: 0, total: 0 },
  };

  plots.forEach(plot => {
    totalArea += plot.areaMu;
    let plotYield = 0;
    let plotRevenue = 0;
    const crop = plot.cropId ? allCrops.find(c => c.id === plot.cropId) : undefined;
    if (crop) {
      const y = crop.yieldPerMu * plot.areaMu;
      plotYield = y;
      plotRevenue = y * crop.unitPrice;
      estimatedYield += y;
      totalRevenue += plotRevenue;
    }
    let plotCost = 0;
    const plotInputs = inputs.filter(i => i.plotId === plot.id);
    plotInputs.forEach(i => {
      const mat = i.quantity * i.unitPrice;
      const lab = i.laborCost;
      materialCost += mat;
      laborCost += lab;
      plotCost += mat + lab;
      perCategory[i.category].material += mat;
      perCategory[i.category].labor += lab;
      perCategory[i.category].total += mat + lab;
    });
    perPlot.push({
      plotId: plot.id,
      name: plot.name,
      area: plot.areaMu,
      yield: plotYield,
      revenue: plotRevenue,
      cost: plotCost,
      profit: plotRevenue - plotCost,
    });
  });

  const totalCost = materialCost + laborCost;
  const netProfit = totalRevenue - totalCost;
  const profitPerMu = totalArea > 0 ? netProfit / totalArea : 0;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  return {
    totalArea,
    estimatedYield,
    totalRevenue,
    materialCost,
    laborCost,
    totalCost,
    netProfit,
    profitPerMu,
    roi,
    perPlot,
    perCategory,
  };
};

export const useAgriStore = create<AgriState>()(
  persist(
    (set, get) => ({
      currentScenarioId: '',
      scenarios: [],
      plots: [],
      tasks: [],
      inputs: [],
      weather: [],
      customCrops: [],
      snapshot: null,
      hasSnapshot: false,

      // 加载预设数据：如果 store 中还没有这个预设，就把它的数据追加进去
      // 不会清空已有数据
      loadPreset: (presetId) => {
        const preset = PRESET_SCENARIOS.find(p => p.scenario.id === presetId);
        if (!preset) return false;
        const state = get();
        // 如果已经加载过这个预设，就只切换
        if (state.scenarios.find(s => s.id === preset.scenario.id)) {
          set({ currentScenarioId: preset.scenario.id });
          return true;
        }
        // 追加进去，保留其他案例的数据
        set({
          currentScenarioId: preset.scenario.id,
          scenarios: [...state.scenarios, preset.scenario],
          plots: [...state.plots, ...preset.plots],
          tasks: [...state.tasks, ...preset.tasks],
          inputs: [...state.inputs, ...preset.inputs],
          weather: [...preset.weather],
        });
        return true;
      },

      loadFirstPreset: () => {
        const state = get();
        if (state.scenarios.length > 0 && state.currentScenarioId) {
          return;
        }
        const preset = PRESET_SCENARIOS[0];
        if (!state.scenarios.find(s => s.id === preset.scenario.id)) {
          set({
            currentScenarioId: preset.scenario.id,
            scenarios: [...state.scenarios, preset.scenario],
            plots: [...state.plots, ...preset.plots],
            tasks: [...state.tasks, ...preset.tasks],
            inputs: [...state.inputs, ...preset.inputs],
            weather: [...preset.weather],
          });
        } else {
          set({ currentScenarioId: preset.scenario.id });
        }
      },

      // 确保某个方案的数据已经加载到 store 中（用于方案对比前调用）
      ensureScenarioLoaded: (scenarioId) => {
        const state = get();
        // 已经在 scenarios 里了，说明数据已加载
        if (state.scenarios.find(s => s.id === scenarioId)) {
          return true;
        }
        // 看看是不是预设，是就加载进来
        const preset = PRESET_SCENARIOS.find(p => p.scenario.id === scenarioId);
        if (preset) {
          set({
            scenarios: [...state.scenarios, preset.scenario],
            plots: [...state.plots, ...preset.plots],
            tasks: [...state.tasks, ...preset.tasks],
            inputs: [...state.inputs, ...preset.inputs],
            weather: state.weather.length > 0 ? state.weather : [...preset.weather],
          });
          return true;
        }
        return false;
      },

      createScenario: (name, description) => {
        const newScenario: Scenario = {
          id: generateId('scenario'),
          name,
          description,
          createdAt: Date.now(),
        };
        set(state => ({
          scenarios: [...state.scenarios, newScenario],
          currentScenarioId: newScenario.id,
        }));
        return newScenario;
      },

      // 复制一个方案：复制其地块、任务、投入品
      duplicateScenario: (sourceId, newName) => {
        const state = get();
        const source = state.scenarios.find(s => s.id === sourceId)
          ?? PRESET_SCENARIOS.find(p => p.scenario.id === sourceId)?.scenario;
        if (!source) return null;

        // 先确保源数据加载了
        state.ensureScenarioLoaded(sourceId);

        const latest = get();
        const srcPlots = latest.plots.filter(p => p.scenarioId === sourceId);
        const srcTasks = latest.tasks.filter(t => t.plotId && srcPlots.some(p => p.id === t.plotId));
        const srcInputs = latest.inputs.filter(i => i.scenarioId === sourceId);

        const newScenario: Scenario = {
          id: generateId('scenario'),
          name: newName,
          description: source.description ? `复制自「${source.name}」 ${source.description}` : `复制自「${source.name}」`,
          createdAt: Date.now(),
        };

        // 建立旧 plotId -> 新 plotId 的映射
        const idMap = new Map<string, string>();
        const newPlots: Plot[] = srcPlots.map(p => {
          const newId = generateId('plot');
          idMap.set(p.id, newId);
          return { ...p, id: newId, scenarioId: newScenario.id };
        });
        const newTasks: ScheduledTask[] = srcTasks.map(t => ({
          ...t,
          id: generateId('task'),
          plotId: idMap.get(t.plotId) || t.plotId,
        }));
        const newInputs: InputRecord[] = srcInputs.map(i => ({
          ...i,
          id: generateId('input'),
          plotId: idMap.get(i.plotId) || i.plotId,
          scenarioId: newScenario.id,
        }));

        set(s => ({
          scenarios: [...s.scenarios, newScenario],
          currentScenarioId: newScenario.id,
          plots: [...s.plots, ...newPlots],
          tasks: [...s.tasks, ...newTasks],
          inputs: [...s.inputs, ...newInputs],
        }));

        return newScenario;
      },

      deleteScenario: (id) => {
        set(state => {
          const scenarios = state.scenarios.filter(s => s.id !== id);
          const nextId = state.currentScenarioId === id
            ? scenarios[0]?.id ?? ''
            : state.currentScenarioId;
          const plotsToKeep = state.plots.filter(p => p.scenarioId !== id);
          const taskPlotIds = new Set(plotsToKeep.map(p => p.id));
          return {
            scenarios,
            currentScenarioId: nextId,
            plots: plotsToKeep,
            tasks: state.tasks.filter(t => taskPlotIds.has(t.plotId)),
            inputs: state.inputs.filter(i => i.scenarioId !== id),
          };
        });
      },

      switchScenario: (id) => {
        const state = get();
        // 如果已经是当前的，直接返回
        if (state.currentScenarioId === id) return;
        // 如果还没加载，就加载预设数据
        if (!state.scenarios.find(s => s.id === id)) {
          state.loadPreset(id);
          return;
        }
        set({ currentScenarioId: id });
      },

      exportScenario: (scenarioId) => {
        const state = get();
        const sid = scenarioId ?? state.currentScenarioId;
        const scenario = state.scenarios.find(s => s.id === sid);
        if (!scenario) return '';
        const scenarioPlots = state.plots.filter(p => p.scenarioId === sid);
        const plotIds = new Set(scenarioPlots.map(p => p.id));
        const scenarioTasks = state.tasks.filter(t => plotIds.has(t.plotId));
        const scenarioInputs = state.inputs.filter(i => i.scenarioId === sid);
        const data = {
          scenario,
          plots: scenarioPlots,
          tasks: scenarioTasks,
          inputs: scenarioInputs,
          weather: state.weather,
          customCrops: state.customCrops,
          exportedAt: Date.now(),
        };
        return JSON.stringify(data, null, 2);
      },

      importScenario: (json: string) => {
        try {
          const data = JSON.parse(json);
          if (!data.scenario || !data.plots) return false;
          set(state => {
            // 如果有同 ID 的就改个 ID，避免冲突
            const sid = data.scenario.id;
            const exists = state.scenarios.find(s => s.id === sid);
            const finalScenario = exists
              ? { ...data.scenario, id: generateId('scenario'), name: `${data.scenario.name} (导入)` }
              : data.scenario;
            const idMap = new Map<string, string>();
            const newPlots = (data.plots || []).map((p: Plot) => {
              const newId = generateId('plot');
              idMap.set(p.id, newId);
              return { ...p, id: newId, scenarioId: finalScenario.id };
            });
            const newTasks = (data.tasks || []).map((t: ScheduledTask) => ({
              ...t,
              id: generateId('task'),
              plotId: idMap.get(t.plotId) || t.plotId,
            }));
            const newInputs = (data.inputs || []).map((i: InputRecord) => ({
              ...i,
              id: generateId('input'),
              plotId: idMap.get(i.plotId) || i.plotId,
              scenarioId: finalScenario.id,
            }));
            return {
              scenarios: [...state.scenarios, finalScenario],
              currentScenarioId: finalScenario.id,
              plots: [...state.plots, ...newPlots],
              tasks: [...state.tasks, ...newTasks],
              inputs: [...state.inputs, ...newInputs],
              weather: data.weather?.length ? data.weather : state.weather,
              customCrops: data.customCrops?.length ? [...state.customCrops, ...data.customCrops] : state.customCrops,
            };
          });
          return true;
        } catch {
          return false;
        }
      },

      clearCurrentData: () => {
        const state = get();
        const sid = state.currentScenarioId;
        set({
          plots: state.plots.filter(p => p.scenarioId !== sid),
          tasks: state.tasks.filter(t => {
            const plot = state.plots.find(p => p.id === t.plotId);
            return plot ? plot.scenarioId !== sid : false;
          }),
          inputs: state.inputs.filter(i => i.scenarioId !== sid),
        });
      },

      // ========== 快照功能 ==========
      saveSnapshot: () => {
        const state = get();
        const sid = state.currentScenarioId;
        if (!sid) return false;
        const scenarioPlots = state.plots.filter(p => p.scenarioId === sid);
        const plotIds = new Set(scenarioPlots.map(p => p.id));
        const scenarioTasks = state.tasks.filter(t => plotIds.has(t.plotId));
        const scenarioInputs = state.inputs.filter(i => i.scenarioId === sid);
        set({
          snapshot: {
            plots: JSON.parse(JSON.stringify(scenarioPlots)),
            tasks: JSON.parse(JSON.stringify(scenarioTasks)),
            inputs: JSON.parse(JSON.stringify(scenarioInputs)),
            weather: JSON.parse(JSON.stringify(state.weather)),
            timestamp: Date.now(),
            scenarioId: sid,
          },
          hasSnapshot: true,
        });
        return true;
      },

      restoreSnapshot: () => {
        const state = get();
        const snap = state.snapshot;
        if (!snap) return false;
        const sid = snap.scenarioId;
        // 清除当前案例数据后，把快照数据写回去
        set(s => {
          const otherPlots = s.plots.filter(p => p.scenarioId !== sid);
          const otherInputs = s.inputs.filter(i => i.scenarioId !== sid);
          // 重新映射 plotId 避免 ID 冲突？其实直接按 snapshot 的 ID 覆盖就行
          // 先移除属于这个案例的所有 plots/tasks/inputs
          const plotIdsInSnap = new Set(snap.plots.map(p => p.id));
          const remainingTasks = s.tasks.filter(t => !plotIdsInSnap.has(t.plotId));
          return {
            plots: [...otherPlots, ...snap.plots],
            tasks: [...remainingTasks, ...snap.tasks],
            inputs: [...otherInputs, ...snap.inputs],
            weather: snap.weather,
            currentScenarioId: sid,
          };
        });
        return true;
      },

      clearSnapshot: () => {
        set({ snapshot: null, hasSnapshot: false });
      },

      addPlot: (plot) => {
        const sid = get().currentScenarioId;
        if (!sid) return;
        const newPlot: Plot = { ...plot, id: generateId('plot'), scenarioId: sid };
        set(state => ({ plots: [...state.plots, newPlot] }));
      },

      updatePlot: (id, updates) => {
        set(state => ({
          plots: state.plots.map(p => p.id === id ? { ...p, ...updates } : p),
        }));
      },

      deletePlot: (id) => {
        set(state => ({
          plots: state.plots.filter(p => p.id !== id),
          tasks: state.tasks.filter(t => t.plotId !== id),
          inputs: state.inputs.filter(i => i.plotId !== id),
        }));
      },

      assignCrop: (plotId, cropId) => {
        const plot = get().plots.find(p => p.id === plotId);
        if (!plot) return;
        set(state => ({
          plots: state.plots.map(p =>
            p.id === plotId
              ? { ...p, cropId, status: '种植中' as const }
              : p,
          ),
        }));
        get().generateTasksForPlot(plotId, undefined, 'append');
      },

      generateTasksForPlot: (plotId, sowingDate, mode = 'append') => {
        const state = get();
        const plot = state.plots.find(p => p.id === plotId);
        if (!plot?.cropId) return;
        const crop = state.getAllCrops().find(c => c.id === plot.cropId);
        if (!crop) return;
        const baseDate = sowingDate
          ? new Date(sowingDate)
          : new Date();
        const today = new Date();

        const newTasks: ScheduledTask[] = crop.tasks.map(t => {
          const taskDate = new Date(baseDate);
          taskDate.setDate(taskDate.getDate() + t.dayOffset);
          return {
            id: generateId('task'),
            plotId,
            cropId: crop.id,
            type: t.type as TaskType,
            name: t.name,
            date: formatDate(taskDate),
            completed: taskDate < today,
            description: t.description,
          };
        });

        if (mode === 'overwrite') {
          // 覆盖模式：先删掉这个地块的所有任务，再加入新的
          set(state => ({
            tasks: [...state.tasks.filter(t => t.plotId !== plotId), ...newTasks],
          }));
        } else {
          // 补充模式：按「任务名称 + 日期」去重，不重复加
          const existingTasks = state.tasks.filter(t => t.plotId === plotId);
          const filtered = newTasks.filter(nt =>
            !existingTasks.some(et => et.name === nt.name && et.date === nt.date)
          );
          set(state => ({
            tasks: [...state.tasks, ...filtered],
          }));
        }
      },

      toggleTaskCompleted: (taskId) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t,
          ),
        }));
      },

      deleteTask: (taskId) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== taskId),
        }));
      },

      addInput: (input) => {
        const sid = get().currentScenarioId;
        if (!sid) return;
        const newInput: InputRecord = { ...input, id: generateId('input'), scenarioId: sid };
        set(state => ({ inputs: [...state.inputs, newInput] }));
      },

      updateInput: (id, updates) => {
        set(state => ({
          inputs: state.inputs.map(i => i.id === id ? { ...i, ...updates } : i),
        }));
      },

      deleteInput: (id) => {
        set(state => ({ inputs: state.inputs.filter(i => i.id !== id) }));
      },

      addCustomCrop: (crop) => {
        const id = generateId('crop');
        set(state => ({
          customCrops: [...state.customCrops, { ...crop, id }],
        }));
      },

      updateCustomCrop: (id, updates) => {
        set(state => ({
          customCrops: state.customCrops.map(c =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }));
      },

      deleteCustomCrop: (id) => {
        set(state => ({
          customCrops: state.customCrops.filter(c => c.id !== id),
        }));
      },

      getAllCrops: () => [...CROP_VARIETIES, ...get().customCrops],

      getCropById: (id) => get().getAllCrops().find(c => c.id === id),

      getCategoryName: (categoryId) => {
        const cat = CROP_CATEGORIES.find(c => c.id === categoryId);
        return cat ? `${cat.icon} ${cat.name}` : categoryId;
      },

      computeRevenue: (scenarioId) => {
        const state = get();
        const sid = scenarioId ?? state.currentScenarioId;
        const plots = state.plots.filter(p => p.scenarioId === sid);
        const inputs = state.inputs.filter(i => i.scenarioId === sid);
        const allCrops = state.getAllCrops();
        return computeRevenueFn(plots, inputs, allCrops);
      },
    }),
    {
      name: 'smart-agri-demo-store',
      partialize: state => ({
        currentScenarioId: state.currentScenarioId,
        scenarios: state.scenarios,
        plots: state.plots,
        tasks: state.tasks,
        inputs: state.inputs,
        weather: state.weather,
        customCrops: state.customCrops,
        snapshot: state.snapshot,
        hasSnapshot: state.hasSnapshot,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => {
            if (!state.currentScenarioId || state.scenarios.length === 0) {
              state.loadFirstPreset();
            }
          }, 0);
        }
      },
    },
  ),
);

export { CROP_CATEGORIES, CROP_VARIETIES, PRESET_SCENARIOS };
export type { GenerateMode };
