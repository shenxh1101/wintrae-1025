import type {
  CropCategory,
  CropVariety,
  Plot,
  InputRecord,
  WeatherSample,
  ScheduledTask,
  Scenario,
} from '@/types';

export const CROP_CATEGORIES: CropCategory[] = [
  { id: 'grain', name: '粮食作物', icon: '🌾', color: '#D4A72C' },
  { id: 'vegetable', name: '蔬菜作物', icon: '🥬', color: '#2D6A4F' },
  { id: 'fruit', name: '瓜果作物', icon: '🍅', color: '#E76F51' },
  { id: 'economic', name: '经济作物', icon: '🌿', color: '#457B9D' },
];

const riceTasks = [
  { type: 'sowing' as const, name: '播种育秧', dayOffset: 0, description: '选用优质稻种，做好种子消毒，秧田整理播种' },
  { type: 'fertilize' as const, name: '施基肥', dayOffset: 1, description: '亩施有机肥1500kg，复合肥30kg作基肥' },
  { type: 'sowing' as const, name: '插秧移栽', dayOffset: 30, description: '秧龄30天左右，宽窄行栽植，每穴2-3苗' },
  { type: 'fertilize' as const, name: '返青肥', dayOffset: 37, description: '移栽后7天追施尿素8kg/亩，促进分蘖' },
  { type: 'irrigate' as const, name: '浅水灌溉', dayOffset: 40, description: '分蘖期保持浅水层3-5cm，促进分蘖' },
  { type: 'weed' as const, name: '化学除草', dayOffset: 45, description: '返青后施用除草剂，注意水层管理' },
  { type: 'fertilize' as const, name: '分蘖肥', dayOffset: 50, description: '追施尿素10kg/亩，氯化钾5kg/亩' },
  { type: 'pesticide' as const, name: '防治螟虫', dayOffset: 70, description: '使用低毒杀虫剂防治二化螟、三化螟' },
  { type: 'irrigate' as const, name: '晒田控苗', dayOffset: 80, description: '够苗晒田，控制无效分蘖，促进根系生长' },
  { type: 'fertilize' as const, name: '穗肥', dayOffset: 95, description: '幼穗分化期施尿素5kg，氯化钾8kg' },
  { type: 'irrigate' as const, name: '深水保胎', dayOffset: 105, description: '孕穗抽穗期保持深水层，防高温热害' },
  { type: 'pesticide' as const, name: '防治稻飞虱', dayOffset: 110, description: '注意监测虫情，及时喷施吡虫啉等药剂' },
  { type: 'irrigate' as const, name: '湿润灌浆', dayOffset: 120, description: '灌浆期干湿交替，养根保叶' },
  { type: 'harvest' as const, name: '收割', dayOffset: 140, description: '95%谷粒变黄时及时收割，晾晒入库' },
];

const wheatTasks = [
  { type: 'sowing' as const, name: '整地播种', dayOffset: 0, description: '深耕细耙，亩施底肥二铵20kg、尿素10kg' },
  { type: 'irrigate' as const, name: '浇出苗水', dayOffset: 7, description: '播种后浇出苗水，确保全苗' },
  { type: 'fertilize' as const, name: '冬前追肥', dayOffset: 50, description: '亩追施尿素8kg，促进壮苗越冬' },
  { type: 'pesticide' as const, name: '冬前除草', dayOffset: 60, description: '杂草2-4叶期喷施除草剂，防治麦田杂草' },
  { type: 'irrigate' as const, name: '冬灌', dayOffset: 90, description: '土壤夜冻昼消时冬灌，保苗防冻' },
  { type: 'fertilize' as const, name: '返青肥', dayOffset: 140, description: '返青期追施尿素10kg，促进早春分蘖' },
  { type: 'irrigate' as const, name: '返青水', dayOffset: 145, description: '结合追肥浇返青水' },
  { type: 'pesticide' as const, name: '防治纹枯病', dayOffset: 160, description: '喷施三唑酮防治纹枯病' },
  { type: 'fertilize' as const, name: '拔节肥', dayOffset: 170, description: '群体不足时追施拔节肥尿素5kg' },
  { type: 'pesticide' as const, name: '一喷三防', dayOffset: 195, description: '一喷三防：杀虫剂+杀菌剂+叶面肥' },
  { type: 'irrigate' as const, name: '灌浆水', dayOffset: 205, description: '灌浆初期浇水，提高粒重' },
  { type: 'harvest' as const, name: '收获', dayOffset: 235, description: '蜡熟末期及时收获，颗粒归仓' },
];

const cornTasks = [
  { type: 'sowing' as const, name: '贴茬播种', dayOffset: 0, description: '小麦收获后贴茬直播，抢时早播' },
  { type: 'fertilize' as const, name: '种肥同播', dayOffset: 0, description: '亩施玉米专用肥30kg作种肥' },
  { type: 'pesticide' as const, name: '封闭除草', dayOffset: 3, description: '播后苗前喷施乙草胺进行土壤封闭' },
  { type: 'weed' as const, name: '苗后除草', dayOffset: 20, description: '玉米3-5叶期喷施苗后除草剂' },
  { type: 'fertilize' as const, name: '追施苗肥', dayOffset: 25, description: '4-5叶期追施尿素10kg/亩' },
  { type: 'irrigate' as const, name: '拔节水', dayOffset: 50, description: '拔节期浇水，促进茎秆生长' },
  { type: 'fertilize' as const, name: '大喇叭口肥', dayOffset: 60, description: '大喇叭口期重施攻穗肥尿素20kg' },
  { type: 'pesticide' as const, name: '防治玉米螟', dayOffset: 65, description: '大喇叭口期丢心防治玉米螟' },
  { type: 'irrigate' as const, name: '抽雄水', dayOffset: 75, description: '抽雄期浇水，防止卡脖旱' },
  { type: 'pesticide' as const, name: '防治蚜虫', dayOffset: 80, description: '注意防治蚜虫、红蜘蛛' },
  { type: 'irrigate' as const, name: '灌浆水', dayOffset: 95, description: '灌浆期浇水，增粒重' },
  { type: 'pesticide' as const, name: '防叶面病害', dayOffset: 100, description: '喷施杀菌剂防治大、小斑病' },
  { type: 'harvest' as const, name: '收获', dayOffset: 115, description: '籽粒乳线消失时适时晚收，增加粒重' },
];

const tomatoTasks = [
  { type: 'sowing' as const, name: '育苗播种', dayOffset: 0, description: '穴盘育苗，温汤浸种，催芽播种' },
  { type: 'fertilize' as const, name: '整地施基肥', dayOffset: 25, description: '亩施腐熟有机肥5000kg，复合肥50kg' },
  { type: 'sowing' as const, name: '移栽定植', dayOffset: 35, description: '4-5片真叶时定植，行距60cm株距40cm' },
  { type: 'irrigate' as const, name: '浇定植水', dayOffset: 35, description: '定植后浇足定植水' },
  { type: 'irrigate' as const, name: '缓苗水', dayOffset: 42, description: '定植后7天浇缓苗水' },
  { type: 'sowing' as const, name: '搭架绑蔓', dayOffset: 55, description: '及时插架绑蔓，采用人字架或吊蔓' },
  { type: 'weed' as const, name: '整枝打杈', dayOffset: 60, description: '单杆整枝，及时摘除侧枝' },
  { type: 'fertilize' as const, name: '追施催果肥', dayOffset: 65, description: '第一穗果膨大时追施复合肥20kg' },
  { type: 'irrigate' as const, name: '果实膨大期浇水', dayOffset: 70, description: '果实膨大期保持土壤湿润' },
  { type: 'pesticide' as const, name: '防治疫病', dayOffset: 75, description: '喷施杀菌剂防治早疫病、晚疫病' },
  { type: 'sowing' as const, name: '保花保果', dayOffset: 75, description: '使用生长调节剂处理，防止落花落果' },
  { type: 'pesticide' as const, name: '防治白粉虱', dayOffset: 85, description: '黄板诱杀+药剂防治白粉虱' },
  { type: 'fertilize' as const, name: '盛果期追肥', dayOffset: 90, description: '每隔10天追肥一次，钾肥为主' },
  { type: 'harvest' as const, name: '采收', dayOffset: 105, description: '根据销售用途确定采收期，分批采收' },
];

const cabbageTasks = [
  { type: 'sowing' as const, name: '育苗', dayOffset: 0, description: '选用抗病品种，做好苗床消毒' },
  { type: 'fertilize' as const, name: '整地施肥', dayOffset: 20, description: '亩施腐熟有机肥3000kg，过磷酸钙50kg' },
  { type: 'sowing' as const, name: '移栽定植', dayOffset: 30, description: '6-7片真叶时定植，株行距40×50cm' },
  { type: 'irrigate' as const, name: '定植水', dayOffset: 30, description: '定植后及时浇水，促进缓苗' },
  { type: 'fertilize' as const, name: '莲座肥', dayOffset: 45, description: '莲座期追施尿素15kg/亩' },
  { type: 'pesticide' as const, name: '防治菜青虫', dayOffset: 50, description: 'BT乳剂或低毒杀虫剂防治菜青虫' },
  { type: 'irrigate' as const, name: '莲座期浇水', dayOffset: 50, description: '莲座后期适当控水蹲苗' },
  { type: 'fertilize' as const, name: '包心肥', dayOffset: 65, description: '进入包心期重施包心肥，复合肥25kg' },
  { type: 'irrigate' as const, name: '包心期浇水', dayOffset: 70, description: '包心期保持土壤湿润，均匀供水' },
  { type: 'pesticide' as const, name: '防治软腐病', dayOffset: 75, description: '农用链霉素防治软腐病' },
  { type: 'pesticide' as const, name: '防治蚜虫', dayOffset: 80, description: '吡虫啉防治蚜虫，兼防病毒病' },
  { type: 'harvest' as const, name: '采收', dayOffset: 95, description: '叶球紧实后分批采收上市' },
];

const cucumberTasks = [
  { type: 'sowing' as const, name: '嫁接育苗', dayOffset: 0, description: '南瓜砧木嫁接育苗，增强抗逆性' },
  { type: 'fertilize' as const, name: '棚室整地', dayOffset: 25, description: '亩施优质有机肥8000kg，复合肥80kg' },
  { type: 'sowing' as const, name: '定植', dayOffset: 35, description: '大行距80cm，小行距50cm，株距30cm' },
  { type: 'irrigate' as const, name: '缓苗水', dayOffset: 36, description: '定植后浇足底水' },
  { type: 'sowing' as const, name: '吊蔓整枝', dayOffset: 45, description: '瓜秧甩蔓时及时吊蔓，单杆整枝' },
  { type: 'fertilize' as const, name: '坐瓜肥', dayOffset: 55, description: '根瓜坐住后追施膨瓜肥' },
  { type: 'irrigate' as const, name: '小水勤浇', dayOffset: 55, description: '结果期小水勤浇，保持土壤湿润' },
  { type: 'pesticide' as const, name: '防治霜霉病', dayOffset: 60, description: '注意通风排湿，预防霜霉病' },
  { type: 'pesticide' as const, name: '防治灰霉病', dayOffset: 65, description: '及时摘除病花病叶，喷施杀菌剂' },
  { type: 'fertilize' as const, name: '盛瓜期追肥', dayOffset: 70, description: '隔水带肥，高钾复合肥为主' },
  { type: 'pesticide' as const, name: '防治蓟马', dayOffset: 75, description: '蓝板诱杀+药剂防治蓟马、蚜虫' },
  { type: 'sowing' as const, name: '落蔓管理', dayOffset: 85, description: '瓜秧爬满架时及时落蔓' },
  { type: 'harvest' as const, name: '采收', dayOffset: 58, description: '根瓜早摘，腰瓜勤摘，每天采收' },
];

export const CROP_VARIETIES: CropVariety[] = [
  {
    id: 'rice-hybrid',
    categoryId: 'grain',
    name: '超级杂交稻 Y两优900',
    yieldPerMu: 750,
    growthDays: 140,
    unitPrice: 3.2,
    sowingWindow: '4月上旬-5月上旬',
    harvestWindow: '8月下旬-9月中旬',
    description: '国审超级稻品种，产量潜力大，米质优良，抗逆性强，适合长江流域种植。',
    tasks: riceTasks,
  },
  {
    id: 'rice-quality',
    categoryId: 'grain',
    name: '优质香稻 美香占2号',
    yieldPerMu: 520,
    growthDays: 130,
    unitPrice: 4.8,
    sowingWindow: '3月下旬-4月中旬',
    harvestWindow: '7月下旬-8月上旬',
    description: '广东丝苗米品种，米粒细长油亮，香味浓郁，品质特优，售价高。',
    tasks: riceTasks.map(t => ({ ...t, dayOffset: Math.round(t.dayOffset * 0.93) })),
  },
  {
    id: 'wheat-henong',
    categoryId: 'grain',
    name: '优质强筋小麦 藁优5766',
    yieldPerMu: 550,
    growthDays: 235,
    unitPrice: 2.8,
    sowingWindow: '10月5日-10月20日',
    harvestWindow: '6月5日-6月15日',
    description: '强筋小麦品种，蛋白质含量高，适合制作面包、面条，加工品质优良。',
    tasks: wheatTasks,
  },
  {
    id: 'corn-denghai',
    categoryId: 'grain',
    name: '登海605 夏玉米',
    yieldPerMu: 680,
    growthDays: 115,
    unitPrice: 2.6,
    sowingWindow: '6月5日-6月15日',
    harvestWindow: '9月25日-10月10日',
    description: '紧凑型玉米品种，耐密植，抗倒伏，高产稳产，适合黄淮海夏播。',
    tasks: cornTasks,
  },
  {
    id: 'tomato-dafen',
    categoryId: 'fruit',
    name: '粉果番茄 齐达利',
    yieldPerMu: 10000,
    growthDays: 130,
    unitPrice: 3.8,
    sowingWindow: '1月下旬-2月上旬',
    harvestWindow: '5月下旬-7月下旬',
    description: '高抗TY病毒番茄品种，粉红果，单果重220g左右，耐贮运，商品率高。',
    tasks: tomatoTasks,
  },
  {
    id: 'cucumber-jinchun',
    categoryId: 'fruit',
    name: '黄瓜 津春5号',
    yieldPerMu: 12000,
    growthDays: 120,
    unitPrice: 2.8,
    sowingWindow: '2月中旬',
    harvestWindow: '4月下旬-7月中旬',
    description: '密刺型黄瓜品种，瓜条顺直，把短，口感脆嫩，适合保护地栽培。',
    tasks: cucumberTasks,
  },
  {
    id: 'cabbage-jingfeng',
    categoryId: 'vegetable',
    name: '甘蓝 京丰一号',
    yieldPerMu: 5000,
    growthDays: 95,
    unitPrice: 1.6,
    sowingWindow: '2月上旬-2月中旬',
    harvestWindow: '5月中旬-6月上旬',
    description: '经典春甘蓝品种，球型扁圆，结球紧实，整齐度好，产量稳定。',
    tasks: cabbageTasks,
  },
  {
    id: 'vegetable-leaf',
    categoryId: 'vegetable',
    name: '有机菠菜 大叶菠',
    yieldPerMu: 2500,
    growthDays: 50,
    unitPrice: 4.5,
    sowingWindow: '8月下旬-9月上旬',
    harvestWindow: '10月下旬-11月中旬',
    description: '耐寒叶菜品种，生长快，叶片肥厚，风味浓郁，适合秋播。',
    tasks: [
      { type: 'fertilize' as const, name: '施基肥', dayOffset: 0, description: '亩施腐熟有机肥2000kg，复合肥20kg' },
      { type: 'sowing' as const, name: '条播', dayOffset: 0, description: '开沟条播，行距20cm，覆土2cm' },
      { type: 'irrigate' as const, name: '出苗水', dayOffset: 2, description: '保持土壤湿润，促进出苗' },
      { type: 'weed' as const, name: '间苗除草', dayOffset: 10, description: '2-3片真叶时间苗，株距5cm' },
      { type: 'fertilize' as const, name: '叶面追肥', dayOffset: 25, description: '喷施叶面肥，促进叶片生长' },
      { type: 'irrigate' as const, name: '浇水', dayOffset: 30, description: '根据墒情浇水，保持湿润' },
      { type: 'pesticide' as const, name: '防治霜霉病', dayOffset: 35, description: '喷施低毒杀菌剂防治霜霉病' },
      { type: 'harvest' as const, name: '分批采收', dayOffset: 50, description: '株高20cm以上分批采收上市' },
    ],
  },
];

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};
const subDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return formatDate(d);
};

function generateWeather(days: number): WeatherSample[] {
  const samples: WeatherSample[] = [];
  const conditions: WeatherSample['condition'][] = ['晴', '多云', '阴', '小雨', '中雨'];
  let baseRain = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - days + i);
    const month = d.getMonth();
    const isSummer = month >= 5 && month <= 8;
    const tempBaseHigh = isSummer ? 30 : 20;
    const tempBaseLow = isSummer ? 22 : 12;
    const high = Math.round(tempBaseHigh + (Math.random() - 0.5) * 8);
    const low = Math.round(tempBaseLow + (Math.random() - 0.5) * 6);
    const rainIdx = Math.random() < 0.35 ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2);
    const cond = conditions[rainIdx];
    const rainfall = cond.includes('雨') ? Math.round(Math.random() * 30 * 10) / 10 : 0;
    baseRain += rainfall;
    let warning: string | null = null;
    if (rainfall > 20) warning = '大雨预警：注意田间排水';
    else if (high > 35) warning = '高温预警：注意防暑浇水';
    samples.push({
      date: formatDate(d),
      tempHigh: high,
      tempLow: low,
      condition: cond,
      rainfall,
      warning,
    });
  }
  return samples;
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export interface PresetScenario {
  scenario: Scenario;
  plots: Plot[];
  tasks: ScheduledTask[];
  inputs: InputRecord[];
  weather: WeatherSample[];
  activeCropIds: string[];
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  (() => {
    const scenario: Scenario = {
      id: 'demo-rice',
      name: '🌾 水稻种植示范',
      description: '南方优质稻种植合作社，5块稻田共280亩，含完整农事计划和投入品记录',
      createdAt: Date.now() - 86400000 * 180,
    };
    const sowingDate = subDays(today, 60);
    const sd = new Date(sowingDate);
    const plots: Plot[] = [
      { id: 'p1', scenarioId: scenario.id, name: '东大田', areaMu: 68, location: '村东区域', soilType: '粘壤土', cropId: 'rice-hybrid', status: '生长中', notes: '土壤肥沃，排灌条件良好' },
      { id: 'p2', scenarioId: scenario.id, name: '西畈田', areaMu: 55, location: '村西畈', soilType: '壤土', cropId: 'rice-hybrid', status: '生长中', notes: '面积规整，适合机械化' },
      { id: 'p3', scenarioId: scenario.id, name: '南塘边', areaMu: 42, location: '南塘水库边', soilType: '壤土', cropId: 'rice-quality', status: '生长中', notes: '灌溉条件好，种植优质香稻' },
      { id: 'p4', scenarioId: scenario.id, name: '北冲田', areaMu: 60, location: '村北冲田', soilType: '沙壤土', cropId: 'rice-hybrid', status: '生长中', notes: '阳光充足' },
      { id: 'p5', scenarioId: scenario.id, name: '中心畈', areaMu: 55, location: '村中心畈', soilType: '粘壤土', cropId: 'rice-quality', status: '待采收', notes: '先期播种的香稻，即将进入采收期' },
    ];
    const tasks: ScheduledTask[] = [];
    plots.forEach(plot => {
      const crop = CROP_VARIETIES.find(c => c.id === plot.cropId)!;
      const offset = plot.id === 'p5' ? 30 : 0;
      crop.tasks.forEach((t, idx) => {
        const taskDate = new Date(sd);
        taskDate.setDate(taskDate.getDate() + t.dayOffset + offset);
        tasks.push({
          id: generateId('task'),
          plotId: plot.id,
          cropId: crop.id,
          type: t.type,
          name: t.name,
          date: formatDate(taskDate),
          completed: taskDate < today,
          description: t.description,
        });
      });
    });
    const inputs: InputRecord[] = [
      { id: 'i1', scenarioId: scenario.id, plotId: 'p1', category: 'fertilizer', name: '复合肥(15-15-15)', date: subDays(today, 59), quantity: 2040, unit: 'kg', unitPrice: 3.2, laborCost: 1200, notes: '基肥撒施' },
      { id: 'i2', scenarioId: scenario.id, plotId: 'p1', category: 'fertilizer', name: '腐熟有机肥', date: subDays(today, 59), quantity: 102000, unit: 'kg', unitPrice: 0.3, laborCost: 2400, notes: '撒施后翻耕' },
      { id: 'i3', scenarioId: scenario.id, plotId: 'p2', category: 'fertilizer', name: '复合肥(15-15-15)', date: subDays(today, 58), quantity: 1650, unit: 'kg', unitPrice: 3.2, laborCost: 900, notes: '基肥' },
      { id: 'i4', scenarioId: scenario.id, plotId: 'p3', category: 'fertilizer', name: '复合肥(15-15-15)', date: subDays(today, 57), quantity: 1260, unit: 'kg', unitPrice: 3.2, laborCost: 700, notes: '' },
      { id: 'i5', scenarioId: scenario.id, plotId: 'p1', category: 'fertilizer', name: '尿素', date: subDays(today, 30), quantity: 544, unit: 'kg', unitPrice: 2.5, laborCost: 800, notes: '返青肥撒施' },
      { id: 'i6', scenarioId: scenario.id, plotId: 'p2', category: 'fertilizer', name: '尿素', date: subDays(today, 28), quantity: 440, unit: 'kg', unitPrice: 2.5, laborCost: 700, notes: '' },
      { id: 'i7', scenarioId: scenario.id, plotId: 'p1', category: 'irrigation', name: '机电提水灌溉', date: subDays(today, 25), quantity: 68, unit: '亩', unitPrice: 15, laborCost: 0, notes: '分蘖期浅水' },
      { id: 'i8', scenarioId: scenario.id, plotId: 'p1', category: 'pesticide', name: '苄嘧磺隆除草剂', date: subDays(today, 22), quantity: 34, unit: '包', unitPrice: 8, laborCost: 500, notes: '拌土撒施' },
      { id: 'i9', scenarioId: scenario.id, plotId: 'p1', category: 'fertilizer', name: '尿素+钾肥', date: subDays(today, 18), quantity: 1020, unit: 'kg', unitPrice: 2.8, laborCost: 900, notes: '分蘖肥' },
      { id: 'i10', scenarioId: scenario.id, plotId: 'p1', category: 'pesticide', name: '康宽杀虫剂', date: subDays(today, 5), quantity: 68, unit: '袋', unitPrice: 5, laborCost: 600, notes: '防治二化螟' },
      { id: 'i11', scenarioId: scenario.id, plotId: 'p2', category: 'irrigation', name: '机电提水灌溉', date: subDays(today, 20), quantity: 55, unit: '亩', unitPrice: 15, laborCost: 0, notes: '' },
      { id: 'i12', scenarioId: scenario.id, plotId: 'p3', category: 'fertilizer', name: '尿素', date: subDays(today, 25), quantity: 336, unit: 'kg', unitPrice: 2.5, laborCost: 500, notes: '' },
    ];
    return {
      scenario,
      plots,
      tasks,
      inputs,
      weather: generateWeather(60),
      activeCropIds: ['rice-hybrid', 'rice-quality'],
    };
  })(),
  (() => {
    const scenario: Scenario = {
      id: 'demo-rotation',
      name: '🌽 小麦玉米轮作',
      description: '北方旱作轮作模式，4块地共220亩，小麦收获后复播夏玉米',
      createdAt: Date.now() - 86400000 * 90,
    };
    const sowingDate = subDays(today, 10);
    const sd = new Date(sowingDate);
    const plots: Plot[] = [
      { id: 'r1', scenarioId: scenario.id, name: '一号地块', areaMu: 60, location: '村东1号', soilType: '壤土', cropId: 'corn-denghai', status: '种植中', notes: '小麦已收，玉米已播' },
      { id: 'r2', scenarioId: scenario.id, name: '二号地块', areaMu: 55, location: '村东2号', soilType: '沙壤土', cropId: 'corn-denghai', status: '种植中', notes: '贴茬直播完成' },
      { id: 'r3', scenarioId: scenario.id, name: '三号地块', areaMu: 50, location: '村西3号', soilType: '壤土', cropId: 'wheat-henong', status: '空闲', notes: '小麦已收获，准备种玉米' },
      { id: 'r4', scenarioId: scenario.id, name: '四号地块', areaMu: 55, location: '村西4号', soilType: '粘壤土', cropId: 'corn-denghai', status: '种植中', notes: '' },
    ];
    const tasks: ScheduledTask[] = [];
    plots.filter(p => p.cropId && p.cropId !== 'wheat-henong').forEach(plot => {
      const crop = CROP_VARIETIES.find(c => c.id === plot.cropId)!;
      crop.tasks.forEach(t => {
        const taskDate = new Date(sd);
        taskDate.setDate(taskDate.getDate() + t.dayOffset);
        tasks.push({
          id: generateId('task'),
          plotId: plot.id,
          cropId: crop.id,
          type: t.type,
          name: t.name,
          date: formatDate(taskDate),
          completed: taskDate < today,
          description: t.description,
        });
      });
    });
    const inputs: InputRecord[] = [
      { id: 'ri1', scenarioId: scenario.id, plotId: 'r1', category: 'fertilizer', name: '玉米专用缓释肥', date: subDays(today, 10), quantity: 1800, unit: 'kg', unitPrice: 3.5, laborCost: 1500, notes: '种肥同播' },
      { id: 'ri2', scenarioId: scenario.id, plotId: 'r2', category: 'fertilizer', name: '玉米专用缓释肥', date: subDays(today, 9), quantity: 1650, unit: 'kg', unitPrice: 3.5, laborCost: 1400, notes: '' },
      { id: 'ri3', scenarioId: scenario.id, plotId: 'r1', category: 'pesticide', name: '乙草胺封闭除草剂', date: subDays(today, 8), quantity: 120, unit: '瓶', unitPrice: 18, laborCost: 800, notes: '播后苗前封闭' },
      { id: 'ri4', scenarioId: scenario.id, plotId: 'r2', category: 'pesticide', name: '乙草胺封闭除草剂', date: subDays(today, 7), quantity: 110, unit: '瓶', unitPrice: 18, laborCost: 750, notes: '' },
      { id: 'ri5', scenarioId: scenario.id, plotId: 'r4', category: 'fertilizer', name: '玉米专用缓释肥', date: subDays(today, 8), quantity: 1650, unit: 'kg', unitPrice: 3.5, laborCost: 1300, notes: '' },
    ];
    return {
      scenario,
      plots,
      tasks,
      inputs,
      weather: generateWeather(30),
      activeCropIds: ['corn-denghai', 'wheat-henong'],
    };
  })(),
  (() => {
    const scenario: Scenario = {
      id: 'demo-organic',
      name: '🥬 有机蔬菜种植',
      description: '设施蔬菜基地，6个大棚+露地共50亩，高投入高产出，经济效益好',
      createdAt: Date.now() - 86400000 * 60,
    };
    const sowingDate = subDays(today, 45);
    const sd = new Date(sowingDate);
    const plots: Plot[] = [
      { id: 'o1', scenarioId: scenario.id, name: '1号温室棚', areaMu: 8, location: 'A区', soilType: '壤土', cropId: 'tomato-dafen', status: '生长中', notes: '番茄定植45天，进入开花坐果期' },
      { id: 'o2', scenarioId: scenario.id, name: '2号温室棚', areaMu: 8, location: 'A区', soilType: '壤土', cropId: 'cucumber-jinchun', status: '生长中', notes: '黄瓜嫁接苗，已采收' },
      { id: 'o3', scenarioId: scenario.id, name: '3号温室棚', areaMu: 8, location: 'B区', soilType: '壤土', cropId: 'cabbage-jingfeng', status: '待采收', notes: '春甘蓝包心中' },
      { id: 'o4', scenarioId: scenario.id, name: '4号大棚', areaMu: 6, location: 'B区', soilType: '沙壤土', cropId: 'tomato-dafen', status: '种植中', notes: '后墙保温大棚' },
      { id: 'o5', scenarioId: scenario.id, name: '露地1号', areaMu: 10, location: '露地区', soilType: '壤土', cropId: 'vegetable-leaf', status: '已采收', notes: '秋菠菜已收完，下茬待播' },
      { id: 'o6', scenarioId: scenario.id, name: '露地2号', areaMu: 10, location: '露地区', soilType: '粘壤土', cropId: 'cabbage-jingfeng', status: '生长中', notes: '露地甘蓝' },
    ];
    const tasks: ScheduledTask[] = [];
    plots.forEach(plot => {
      if (!plot.cropId) return;
      const crop = CROP_VARIETIES.find(c => c.id === plot.cropId)!;
      const offset = plot.id === 'o5' ? -15 : plot.id === 'o3' ? 5 : 0;
      crop.tasks.forEach(t => {
        const taskDate = new Date(sd);
        taskDate.setDate(taskDate.getDate() + t.dayOffset + offset);
        tasks.push({
          id: generateId('task'),
          plotId: plot.id,
          cropId: crop.id,
          type: t.type,
          name: t.name,
          date: formatDate(taskDate),
          completed: taskDate < today,
          description: t.description,
        });
      });
    });
    const inputs: InputRecord[] = [
      { id: 'oi1', scenarioId: scenario.id, plotId: 'o1', category: 'fertilizer', name: '发酵鸡粪有机肥', date: subDays(today, 50), quantity: 40000, unit: 'kg', unitPrice: 0.4, laborCost: 2000, notes: '基肥撒施' },
      { id: 'oi2', scenarioId: scenario.id, plotId: 'o1', category: 'fertilizer', name: '三元复合肥', date: subDays(today, 50), quantity: 400, unit: 'kg', unitPrice: 3.8, laborCost: 500, notes: '' },
      { id: 'oi3', scenarioId: scenario.id, plotId: 'o1', category: 'pesticide', name: '生物杀虫剂BT', date: subDays(today, 15), quantity: 80, unit: '瓶', unitPrice: 25, laborCost: 400, notes: '有机认证' },
      { id: 'oi4', scenarioId: scenario.id, plotId: 'o1', category: 'fertilizer', name: '冲施肥(高钾)', date: subDays(today, 8), quantity: 80, unit: 'kg', unitPrice: 16, laborCost: 200, notes: '随水冲施' },
      { id: 'oi5', scenarioId: scenario.id, plotId: 'o2', category: 'fertilizer', name: '发酵羊粪有机肥', date: subDays(today, 52), quantity: 64000, unit: 'kg', unitPrice: 0.5, laborCost: 2200, notes: '' },
      { id: 'oi6', scenarioId: scenario.id, plotId: 'o2', category: 'pesticide', name: '苦参碱杀菌剂', date: subDays(today, 20), quantity: 60, unit: '瓶', unitPrice: 30, laborCost: 300, notes: '' },
      { id: 'oi7', scenarioId: scenario.id, plotId: 'o2', category: 'irrigation', name: '滴灌系统', date: subDays(today, 40), quantity: 30, unit: '次', unitPrice: 12, laborCost: 0, notes: '水肥一体化' },
      { id: 'oi8', scenarioId: scenario.id, plotId: 'o3', category: 'fertilizer', name: '生物有机肥', date: subDays(today, 55), quantity: 24000, unit: 'kg', unitPrice: 0.6, laborCost: 1200, notes: '' },
      { id: 'oi9', scenarioId: scenario.id, plotId: 'o3', category: 'pesticide', name: '农用链霉素', date: subDays(today, 12), quantity: 40, unit: '袋', unitPrice: 12, laborCost: 200, notes: '防软腐病' },
      { id: 'oi10', scenarioId: scenario.id, plotId: 'o5', category: 'fertilizer', name: '商品有机肥', date: subDays(today, 70), quantity: 20000, unit: 'kg', unitPrice: 0.5, laborCost: 1000, notes: '' },
    ];
    return {
      scenario,
      plots,
      tasks,
      inputs,
      weather: generateWeather(50),
      activeCropIds: ['tomato-dafen', 'cucumber-jinchun', 'cabbage-jingfeng', 'vegetable-leaf'],
    };
  })(),
];

export { generateId, formatDate, addDays, subDays, generateWeather };
