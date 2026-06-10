export type PlotStatus = '空闲' | '备耕' | '种植中' | '生长中' | '待采收' | '已采收';

export type SoilType = '沙壤土' | '粘壤土' | '壤土' | '砂土' | '粘土';

export type TaskType = 'sowing' | 'fertilize' | 'irrigate' | 'pesticide' | 'weed' | 'harvest';

export type InputCategory = 'fertilizer' | 'irrigation' | 'pesticide';

export type WeatherCondition = '晴' | '多云' | '阴' | '小雨' | '中雨' | '大雨';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface Plot {
  id: string;
  scenarioId: string;
  name: string;
  areaMu: number;
  location: string;
  soilType: SoilType;
  cropId: string | null;
  status: PlotStatus;
  notes: string;
}

export interface CropCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface FarmTaskTemplate {
  type: TaskType;
  name: string;
  dayOffset: number;
  description: string;
}

export interface CropVariety {
  id: string;
  categoryId: string;
  name: string;
  yieldPerMu: number;
  growthDays: number;
  unitPrice: number;
  sowingWindow: string;
  harvestWindow: string;
  description: string;
  tasks: FarmTaskTemplate[];
}

export interface ScheduledTask {
  id: string;
  plotId: string;
  cropId: string;
  type: TaskType;
  name: string;
  date: string;
  completed: boolean;
  description: string;
}

export interface InputRecord {
  id: string;
  scenarioId: string;
  plotId: string;
  category: InputCategory;
  name: string;
  date: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  laborCost: number;
  notes: string;
}

export interface WeatherSample {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: WeatherCondition;
  rainfall: number;
  warning: string | null;
}

export interface RevenueResult {
  totalArea: number;
  estimatedYield: number;
  totalRevenue: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  netProfit: number;
  profitPerMu: number;
  roi: number;
}
