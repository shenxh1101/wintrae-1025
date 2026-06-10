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

interface AgriState {
  currentScenarioId: string;
  scenarios: Scenario[];
  plots: Plot[];
  tasks: ScheduledTask[];
  inputs: InputRecord[];
  weather: WeatherSample[];
  customCrops: CropVariety[];

  loadPreset: (presetId: string) => void;
  loadFirstPreset: () => void;

  createScenario: (name: string, description: string) => Scenario;
  deleteScenario: (id: string) => void;
  switchScenario: (id: string) => void;
  exportScenario: () => string;
  importScenario: (json: string) => boolean;
  clearCurrentData: () => void;

  addPlot: (plot: Omit<Plot, 'id' | 'scenarioId'>) => void;
  updatePlot: (id: string, updates: Partial<Plot>) => void;
  deletePlot: (id: string) => void;
  assignCrop: (plotId: string, cropId: string) => void;
  generateTasksForPlot: (plotId: string, sowingDate?: string) => void;

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

      loadPreset: (presetId: string) => {
        const preset = PRESET_SCENARIOS.find(p => p.scenario.id === presetId);
        if (!preset) return;
        set({
          currentScenarioId: preset.scenario.id,
          scenarios: [preset.scenario],
          plots: [...preset.plots],
          tasks: [...preset.tasks],
          inputs: [...preset.inputs],
          weather: [...preset.weather],
        });
      },

      loadFirstPreset: () => {
        const state = get();
        if (state.scenarios.length > 0 && state.currentScenarioId) return;
        const preset = PRESET_SCENARIOS[0];
        set({
          currentScenarioId: preset.scenario.id,
          scenarios: [preset.scenario],
          plots: [...preset.plots],
          tasks: [...preset.tasks],
          inputs: [...preset.inputs],
          weather: [...preset.weather],
        });
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
          plots: [],
          tasks: [],
          inputs: [],
          weather: generateWeather(30),
        }));
        return newScenario;
      },

      deleteScenario: (id) => {
        set(state => {
          const scenarios = state.scenarios.filter(s => s.id !== id);
          return {
            scenarios,
            currentScenarioId: state.currentScenarioId === id
              ? scenarios[0]?.id ?? ''
              : state.currentScenarioId,
            plots: state.currentScenarioId === id ? [] : state.plots,
            tasks: state.currentScenarioId === id ? [] : state.tasks,
            inputs: state.currentScenarioId === id ? [] : state.inputs,
          };
        });
      },

      switchScenario: (id) => {
        const preset = PRESET_SCENARIOS.find(p => p.scenario.id === id);
        if (preset && !get().scenarios.find(s => s.id === id)) {
          get().loadPreset(id);
          return;
        }
        set({ currentScenarioId: id });
      },

      exportScenario: () => {
        const state = get();
        const data = {
          scenario: state.scenarios.find(s => s.id === state.currentScenarioId),
          plots: state.plots,
          tasks: state.tasks,
          inputs: state.inputs,
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
          set(state => ({
            scenarios: [...state.scenarios, data.scenario],
            currentScenarioId: data.scenario.id,
            plots: data.plots ?? [],
            tasks: data.tasks ?? [],
            inputs: data.inputs ?? [],
            weather: data.weather ?? state.weather,
            customCrops: data.customCrops ?? state.customCrops,
          }));
          return true;
        } catch {
          return false;
        }
      },

      clearCurrentData: () => {
        set({ plots: [], tasks: [], inputs: [] });
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
        get().generateTasksForPlot(plotId);
      },

      generateTasksForPlot: (plotId, sowingDate) => {
        const state = get();
        const plot = state.plots.find(p => p.id === plotId);
        if (!plot?.cropId) return;
        const crop = state.getAllCrops().find(c => c.id === plot.cropId);
        if (!crop) return;
        const baseDate = sowingDate
          ? new Date(sowingDate)
          : new Date();
        const existingTasks = state.tasks.filter(t => t.plotId === plotId);
        const newTasks: ScheduledTask[] = crop.tasks
          .filter(t => {
            const taskDate = new Date(baseDate);
            taskDate.setDate(taskDate.getDate() + t.dayOffset);
            const dateStr = formatDate(taskDate);
            return !existingTasks.some(et => et.name === t.name && et.date === dateStr);
          })
          .map(t => {
            const taskDate = new Date(baseDate);
            taskDate.setDate(taskDate.getDate() + t.dayOffset);
            const today = new Date();
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
        set(state => ({
          tasks: [...existingTasks, ...newTasks],
        }));
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
