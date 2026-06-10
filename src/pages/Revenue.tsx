import { useMemo, useRef, useState } from 'react';
import {
  TrendingUp,
  Download,
  Plus,
  Trash2,
  Copy,
  BarChart4,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  FileImage,
  FileJson,
  Save,
  Settings2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useAgriStore, PRESET_SCENARIOS } from '@/store/agriStore';

const PIE_COLORS = ['#2D6A4F', '#D4A72C', '#457B9D', '#E76F51', '#8B5CF6'];
const SCHEME_COLORS = ['#2D6A4F', '#D4A72C', '#457B9D', '#E76F51'];

export default function Revenue() {
  const {
    currentScenarioId,
    scenarios,
    plots,
    inputs,
    getAllCrops,
    getCropById,
    computeRevenue,
    createScenario,
    exportScenario,
    duplicateScenario,
    ensureScenarioLoaded,
  } = useAgriStore();

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showYieldModal, setShowYieldModal] = useState(false);
  const [yieldAdj, setYieldAdj] = useState<Record<string, number>>({});
  const [priceAdj, setPriceAdj] = useState<Record<string, number>>({});

  const chartRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  const allCrops = useMemo(() => getAllCrops(), [getAllCrops]);
  const revenue = useMemo(() => computeRevenue(currentScenarioId), [computeRevenue, currentScenarioId]);
  const curScenario = useMemo(
    () => scenarios.find(s => s.id === currentScenarioId)
      ?? PRESET_SCENARIOS.find(p => p.scenario.id === currentScenarioId)?.scenario,
    [scenarios, currentScenarioId],
  );
  const curPlots = useMemo(
    () => plots.filter(p => p.scenarioId === currentScenarioId),
    [plots, currentScenarioId],
  );

  // 作物构成
  const cropBreakdown = useMemo(() => {
    const map = new Map<string, { crop: string; area: number; yield: number; revenue: number; cost: number }>();
    curPlots.forEach(p => {
      if (!p.cropId) return;
      const crop = getCropById(p.cropId);
      if (!crop) return;
      const cur = map.get(p.cropId) || { crop: crop.name, area: 0, yield: 0, revenue: 0, cost: 0 };
      const yAdj = yieldAdj[p.cropId] ?? 1;
      const pAdj = priceAdj[p.cropId] ?? 1;
      const estYield = crop.yieldPerMu * p.areaMu * yAdj;
      const rev = estYield * crop.unitPrice * pAdj;
      const plotCost = inputs
        .filter(i => i.plotId === p.id && i.scenarioId === currentScenarioId)
        .reduce((s, i) => s + i.quantity * i.unitPrice + i.laborCost, 0);
      cur.area += p.areaMu;
      cur.yield += estYield;
      cur.revenue += rev;
      cur.cost += plotCost;
      map.set(p.cropId, cur);
    });
    return Array.from(map.values()).map(v => ({
      ...v,
      profit: v.revenue - v.cost,
      roi: v.cost > 0 ? ((v.revenue - v.cost) / v.cost) * 100 : 0,
    }));
  }, [curPlots, getCropById, yieldAdj, priceAdj, inputs, currentScenarioId]);

  // 调整后的收益
  const adjustedRevenue = useMemo(() => {
    let yieldTotal = 0, revTotal = 0;
    curPlots.forEach(p => {
      if (!p.cropId) return;
      const crop = getCropById(p.cropId);
      if (!crop) return;
      const yAdj = yieldAdj[p.cropId] ?? 1;
      const pAdj = priceAdj[p.cropId] ?? 1;
      const y = crop.yieldPerMu * p.areaMu * yAdj;
      yieldTotal += y;
      revTotal += y * crop.unitPrice * pAdj;
    });
    return {
      ...revenue,
      estimatedYield: yieldTotal,
      totalRevenue: revTotal,
      netProfit: revTotal - revenue.totalCost,
      profitPerMu: revenue.totalArea > 0 ? (revTotal - revenue.totalCost) / revenue.totalArea : 0,
      roi: revenue.totalCost > 0 ? ((revTotal - revenue.totalCost) / revenue.totalCost) * 100 : 0,
    };
  }, [revenue, curPlots, getCropById, yieldAdj, priceAdj]);

  // 方案对比数据
  const compareData = useMemo(() => {
    const ids = [currentScenarioId, ...compareIds].filter(Boolean);
    return ids.map(id => {
      const r = computeRevenue(id);
      const s = scenarios.find(x => x.id === id)
        ?? PRESET_SCENARIOS.find(p => p.scenario.id === id)?.scenario;
      return {
        id,
        name: s?.name || '未知方案',
        ...r,
        profitPerMu: r.totalArea > 0 ? r.netProfit / r.totalArea : 0,
        yieldPerMu: r.totalArea > 0 ? r.estimatedYield / r.totalArea : 0,
      };
    });
  }, [currentScenarioId, compareIds, computeRevenue, scenarios]);

  // 雷达图数据
  const radarData = useMemo(() => {
    if (compareData.length === 0) return [];
    const maxes = {
      roi: 0, profitPerMu: 0, yieldPerMu: 0,
      totalRevenue: 0, totalArea: 0,
    };
    compareData.forEach(d => {
      maxes.roi = Math.max(maxes.roi, d.roi);
      maxes.profitPerMu = Math.max(maxes.profitPerMu, d.profitPerMu);
      maxes.yieldPerMu = Math.max(maxes.yieldPerMu, d.yieldPerMu);
      maxes.totalRevenue = Math.max(maxes.totalRevenue, d.totalRevenue);
      maxes.totalArea = Math.max(maxes.totalArea, d.totalArea);
    });
    return ['投资回报率', '亩均利润', '亩均产量', '总产值', '种植规模'].map((k, idx) => {
      const keys = ['roi', 'profitPerMu', 'yieldPerMu', 'totalRevenue', 'totalArea'] as const;
      const key = keys[idx];
      const row: any = { metric: k };
      compareData.forEach((d, di) => {
        row[d.name] = maxes[key] > 0 ? (d[key] / maxes[key]) * 100 : 0;
      });
      return row;
    });
  }, [compareData]);

  // 导出PNG
  const exportPNG = async (ref: React.RefObject<HTMLDivElement>, name: string) => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${curScenario?.name || '智慧农业'}_${name}.png`;
      a.click();
    } catch (e) {
      alert('导出失败，请重试');
    }
  };

  // 另存为新方案
  const saveAsNewScenario = () => {
    const name = prompt('新方案名称：', `${curScenario?.name || ''}（副本）`);
    if (!name?.trim()) return;
    const result = duplicateScenario(currentScenarioId, name.trim());
    if (!result) {
      alert('复制方案失败，请重试');
    }
  };

  const toggleCompare = (id: string) => {
    if (id === currentScenarioId) return;
    if (compareIds.includes(id)) {
      setCompareIds(prev => prev.filter(x => x !== id));
    } else {
      // 添加前确保数据已加载
      const loaded = ensureScenarioLoaded(id);
      if (!loaded) {
        alert('该方案数据不可用');
        return;
      }
      // 检查方案是否有数据（面积>0）
      const r = computeRevenue(id);
      if (r.totalArea <= 0) {
        alert('该方案暂无有效种植数据，无法参与对比');
        return;
      }
      if (compareIds.length < 3) {
        setCompareIds(prev => [...prev, id]);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="page-header">📊 收益测算</h1>
          <p className="page-subtitle mb-0">
            产量预估、成本分析与种植方案横向对比，辅助生产决策
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-auto">
          <button onClick={() => setShowYieldModal(true)} className="btn-secondary">
            <Settings2 size={16} />
            参数模拟
          </button>
          <button onClick={saveAsNewScenario} className="btn-secondary">
            <Copy size={16} />
            另存为方案
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="种植总面积"
          value={`${adjustedRevenue.totalArea.toFixed(0)}`}
          unit="亩"
          gradient="from-soil-400 to-soil-600"
          icon="🌾"
        />
        <KpiCard
          label="预估总产量"
          value={formatBig(adjustedRevenue.estimatedYield)}
          unit="kg"
          gradient="from-field-400 to-field-600"
          icon="📦"
          delta={
            adjustedRevenue.estimatedYield !== revenue.estimatedYield
              ? ((adjustedRevenue.estimatedYield - revenue.estimatedYield) / revenue.estimatedYield * 100).toFixed(1)
              : null
          }
        />
        <KpiCard
          label="总产值"
          value={`¥${formatBig(adjustedRevenue.totalRevenue)}`}
          gradient="from-harvest-400 to-harvest-600"
          icon="💰"
        />
        <KpiCard
          label="总投入成本"
          value={`¥${formatBig(adjustedRevenue.totalCost)}`}
          unit=""
          gradient="from-sky-400 to-sky-600"
          icon="💸"
          sub={`物资¥${formatBig(adjustedRevenue.materialCost)} · 人工¥${formatBig(adjustedRevenue.laborCost)}`}
        />
        <KpiCard
          label="净利润"
          value={`¥${formatBig(adjustedRevenue.netProfit)}`}
          gradient={adjustedRevenue.netProfit >= 0
            ? 'from-field-500 via-field-600 to-harvest-500'
            : 'from-tomato-500 to-tomato-700'}
          icon={adjustedRevenue.netProfit >= 0 ? '📈' : '📉'}
          sub={`ROI ${adjustedRevenue.roi.toFixed(1)}% · 亩均¥${adjustedRevenue.profitPerMu.toFixed(0)}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6" ref={chartRef}>
        {/* 产值成本对比 */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-song text-lg font-bold text-field-800 flex items-center gap-2">
              <BarChart4 size={20} className="text-field-500" />
              各作物效益分析
            </h3>
            <button
              onClick={() => exportPNG(chartRef, '作物效益分析')}
              className="text-xs flex items-center gap-1 text-soil-500 hover:text-field-700 transition-colors"
            >
              <FileImage size={14} /> 导出PNG
            </button>
          </div>
          <div className="h-72">
            {cropBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cropBreakdown} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2d5c0" vertical={false} />
                  <XAxis dataKey="crop" tick={{ fontSize: 12, fill: '#5b3c2d' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#5b3c2d' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                  />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#5b3c2d' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v.toFixed(0)}%`}
                  />
                  <RTooltip
                    formatter={(v: number, n) => {
                      if (n === 'roi') return [`${v.toFixed(1)}%`, '投资回报率'];
                      return [`¥${v.toFixed(0)}`, n === 'revenue' ? '产值' : n === 'cost' ? '成本' : '利润'];
                    }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2d5c0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="revenue" name="产值" fill="#D4A72C" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="left" dataKey="cost" name="成本" fill="#457B9D" radius={[6, 6, 0, 0]} />
                  <Area yAxisId="left" type="monotone" dataKey="profit" name="利润" fill="#2D6A4F" fillOpacity={0.15} stroke="#2D6A4F" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="roi" name="ROI" stroke="#E76F51" strokeWidth={2.5} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-soil-400 text-sm">
                暂无数据，请先分配作物并录入投入记录
              </div>
            )}
          </div>
        </div>

        {/* 成本构成饼图 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-song text-lg font-bold text-field-800 flex items-center gap-2">
              🥧 成本构成
            </h3>
          </div>
          <div className="h-72">
            {adjustedRevenue.totalCost > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: '施肥物资', value: adjustedRevenue.perCategory.fertilizer.material },
                      { name: '灌溉投入', value: adjustedRevenue.perCategory.irrigation.total },
                      { name: '打药物资', value: adjustedRevenue.perCategory.pesticide.material },
                      { name: '人工成本', value: adjustedRevenue.laborCost },
                    ].filter(d => d.value > 0)}
                    dataKey="value"
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                    innerRadius={40}
                    paddingAngle={2}
                  >
                    {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <RTooltip
                    formatter={(v: number) => `¥${v.toFixed(0)}`}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2d5c0' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 0 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-soil-400 text-sm">
                暂无成本数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 收益明细表 */}
      <div className="card mb-6">
        <h3 className="font-song text-lg font-bold text-field-800 mb-4">📋 各地块收益明细</h3>
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                <th className="table-header pl-6">地块名称</th>
                <th className="table-header">面积</th>
                <th className="table-header">种植作物</th>
                <th className="table-header text-right">预估产量</th>
                <th className="table-header text-right">预估产值</th>
                <th className="table-header text-right">投入成本</th>
                <th className="table-header text-right">净利润</th>
                <th className="table-header text-right pr-6">亩均利润</th>
              </tr>
            </thead>
            <tbody>
              {adjustedRevenue.perPlot.map(row => {
                const plot = curPlots.find(p => p.id === row.plotId);
                const crop = plot?.cropId ? getCropById(plot.cropId) : null;
                return (
                  <tr key={row.plotId} className="hover:bg-soil-50/50 border-b border-soil-50 last:border-0">
                    <td className="table-cell pl-6 font-semibold text-soil-800">{row.name}</td>
                    <td className="table-cell">{row.area.toFixed(1)}亩</td>
                    <td className="table-cell">
                      {crop ? (
                        <span className="chip bg-field-50 text-field-700 border border-field-100 text-xs">
                          {crop.name}
                        </span>
                      ) : <span className="text-soil-400">未种植</span>}
                    </td>
                    <td className="table-cell text-right">{formatBig(row.yield)}kg</td>
                    <td className="table-cell text-right font-semibold text-harvest-700">¥{formatBig(row.revenue)}</td>
                    <td className="table-cell text-right text-sky-700">¥{formatBig(row.cost)}</td>
                    <td className={`table-cell text-right font-bold ${row.profit >= 0 ? 'text-field-700' : 'text-tomato-600'}`}>
                      {row.profit >= 0 ? '+' : ''}¥{formatBig(row.profit)}
                    </td>
                    <td className={`table-cell text-right pr-6 ${row.area > 0 && row.profit / row.area >= 0 ? 'text-field-700' : 'text-tomato-600'}`}>
                      ¥{row.area > 0 ? (row.profit / row.area).toFixed(0) : 0}
                    </td>
                  </tr>
                );
              })}
              {adjustedRevenue.perPlot.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-soil-400">
                    暂无地块数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 方案对比 */}
      <div className="card mb-6" ref={compareRef}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h3 className="font-song text-lg font-bold text-field-800 flex items-center gap-2">
              ⚖️ 多方案横向对比
            </h3>
            <p className="text-xs text-soil-500 mt-1">选择不同种植方案（最多对比3个），直观比较经济效益差异</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <select
              className="input-base !w-auto !py-2 text-sm"
              value=""
              onChange={e => e.target.value && toggleCompare(e.target.value)}
            >
              <option value="">+ 添加对比方案</option>
              {[
                ...PRESET_SCENARIOS.map(p => p.scenario),
                ...scenarios,
              ]
                .filter(s => s.id !== currentScenarioId && !compareIds.includes(s.id))
                .map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
            {compareIds.length > 0 && (
              <button
                onClick={() => exportPNG(compareRef, '方案对比')}
                className="btn-secondary !px-3 !py-2 text-sm"
              >
                <FileImage size={14} /> 导出对比图
              </button>
            )}
          </div>
        </div>

        {compareData.length > 1 ? (
          <>
            <div className="flex flex-wrap gap-2 mb-5">
              {compareData.map((d, i) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border
                    ${i === 0 ? 'border-field-500 bg-field-50 text-field-800' : ''}`}
                  style={{ borderColor: i > 0 ? SCHEME_COLORS[i % SCHEME_COLORS.length] : undefined }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: SCHEME_COLORS[i % SCHEME_COLORS.length] }}
                  />
                  <span className="font-medium">{d.name}</span>
                  {i === 0 && <CheckCircle size={14} className="text-field-600" />}
                  {i > 0 && (
                    <button
                      onClick={() => toggleCompare(d.id)}
                      className="ml-1 p-0.5 rounded hover:bg-soil-100 text-soil-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 对比图 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="p-4 rounded-xl bg-soil-50/50 border border-soil-100">
                <h5 className="text-sm font-semibold text-soil-700 mb-3">核心指标对比</h5>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: '总利润(万元)', ...Object.fromEntries(compareData.map((d, i) => [d.name, d.netProfit / 10000])) },
                      { name: '亩均利润(百元)', ...Object.fromEntries(compareData.map((d, i) => [d.name, d.profitPerMu / 100])) },
                      { name: 'ROI(×10%)', ...Object.fromEntries(compareData.map((d, i) => [d.name, d.roi / 10])) },
                      { name: '亩均产(百kg)', ...Object.fromEntries(compareData.map((d, i) => [d.name, d.yieldPerMu / 100])) },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2d5c0" vertical={false} />
                      <XAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <RTooltip contentStyle={{ borderRadius: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {compareData.map((d, i) => (
                        <Bar key={d.id} dataKey={d.name} fill={SCHEME_COLORS[i % SCHEME_COLORS.length]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-soil-50/50 border border-soil-100">
                <h5 className="text-sm font-semibold text-soil-700 mb-3">综合能力雷达</h5>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#bcdccb" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#5b3c2d' }} />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <RTooltip formatter={(v: number) => `${v.toFixed(0)}分`} contentStyle={{ borderRadius: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {compareData.map((d, i) => (
                        <Radar
                          key={d.id}
                          name={d.name}
                          dataKey={d.name}
                          stroke={SCHEME_COLORS[i % SCHEME_COLORS.length]}
                          fill={SCHEME_COLORS[i % SCHEME_COLORS.length]}
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 对比表格 */}
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr>
                    <th className="table-header pl-6">对比指标</th>
                    {compareData.map((d, i) => (
                      <th key={d.id} className="table-header text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: SCHEME_COLORS[i % SCHEME_COLORS.length] }}
                          />
                          {d.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '种植规模（亩）', key: 'totalArea', fmt: (v: number) => v.toFixed(1), higher: true },
                    { label: '预估产量（kg）', key: 'estimatedYield', fmt: (v: number) => formatBig(v), higher: true },
                    { label: '总产值（元）', key: 'totalRevenue', fmt: (v: number) => '¥' + formatBig(v), higher: true },
                    { label: '物资成本（元）', key: 'materialCost', fmt: (v: number) => '¥' + formatBig(v), higher: false },
                    { label: '人工成本（元）', key: 'laborCost', fmt: (v: number) => '¥' + formatBig(v), higher: false },
                    { label: '总成本（元）', key: 'totalCost', fmt: (v: number) => '¥' + formatBig(v), higher: false },
                    { label: '净利润（元）', key: 'netProfit', fmt: (v: number) => '¥' + formatBig(v), higher: true },
                    { label: '亩均利润（元/亩）', key: 'profitPerMu', fmt: (v: number) => '¥' + v.toFixed(0), higher: true },
                    { label: '投资回报率（%）', key: 'roi', fmt: (v: number) => v.toFixed(1) + '%', higher: true },
                  ].map(row => {
                    const values = compareData.map(d => (d as any)[row.key] as number);
                    const best = row.higher ? Math.max(...values) : Math.min(...values.filter(v => v > 0));
                    return (
                      <tr key={row.key} className="border-b border-soil-50 last:border-0">
                        <td className="table-cell pl-6 font-medium text-soil-700">{row.label}</td>
                        {compareData.map((d, i) => {
                          const v = (d as any)[row.key] as number;
                          const isBest = values.length > 1 && (v === best && v > 0);
                          return (
                            <td key={d.id} className="table-cell text-right pr-6">
                              <div className={`inline-flex items-center gap-1 ${isBest ? 'font-bold' : ''}`}>
                                {isBest && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: SCHEME_COLORS[i % SCHEME_COLORS.length] }}
                                  />
                                )}
                                <span
                                  className={
                                    isBest
                                      ? (row.higher && v > 0 ? 'text-field-700' : 'text-sky-700')
                                      : 'text-soil-700'
                                  }
                                >
                                  {row.fmt(v)}
                                </span>
                                {values.length > 1 && i > 0 && v !== values[0] && (
                                  <span className={`inline-flex items-center text-[10px] ${
                                    (v > values[0]) === row.higher ? 'text-field-600' : 'text-tomato-500'
                                  }`}>
                                    {(v > values[0]) === row.higher ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {values[0] !== 0 ? `${Math.abs(((v - values[0]) / values[0]) * 100).toFixed(0)}%` : ''}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="py-14 text-center text-sm text-soil-500">
            <TrendingUp size={36} className="mx-auto mb-3 opacity-40 text-field-500" />
            <p className="mb-2">还没有选择对比方案</p>
            <p className="text-soil-400 text-xs mb-4">
              可使用「另存为方案」复制当前方案，修改参数后对比；或选择其他预设案例直接对比
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {PRESET_SCENARIOS
                .filter(p => p.scenario.id !== currentScenarioId)
                .map(p => (
                  <button
                    key={p.scenario.id}
                    onClick={() => toggleCompare(p.scenario.id)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-field-200 text-field-700 text-xs
                      hover:bg-field-50 hover:border-field-300 transition-all"
                  >
                    <Plus size={12} className="inline mr-1" />
                    添加「{p.scenario.name}」
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 导出区 */}
      <div className="card">
        <h3 className="font-song text-lg font-bold text-field-800 mb-4 flex items-center gap-2">
          💾 导出展示数据
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => exportPNG(chartRef, '作物效益分析')}
            className="group p-5 rounded-xl border-2 border-dashed border-field-300 hover:border-field-500 hover:bg-field-50/40 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-field-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileImage size={22} className="text-field-600" />
            </div>
            <h4 className="font-semibold text-soil-800 mb-1">导出作物效益分析图</h4>
            <p className="text-xs text-soil-500">PNG 高清图片，用于展板和汇报PPT</p>
          </button>
          <button
            onClick={() => compareData.length > 1 && exportPNG(compareRef, '方案对比')}
            disabled={compareData.length <= 1}
            className="group p-5 rounded-xl border-2 border-dashed border-harvest-300 hover:border-harvest-500 hover:bg-harvest-50/40 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-xl bg-harvest-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BarChart4 size={22} className="text-harvest-600" />
            </div>
            <h4 className="font-semibold text-soil-800 mb-1">导出方案对比图</h4>
            <p className="text-xs text-soil-500">PNG 高清图片，直观展示不同方案差异</p>
          </button>
          <button
            onClick={() => {
              const data = exportScenario();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${curScenario?.name || '农业演示'}_数据包.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="group p-5 rounded-xl border-2 border-dashed border-sky-300 hover:border-sky-500 hover:bg-sky-50/40 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileJson size={22} className="text-sky-600" />
            </div>
            <h4 className="font-semibold text-soil-800 mb-1">导出完整数据文件</h4>
            <p className="text-xs text-soil-500">JSON 格式，可导入迁移到任何浏览器</p>
          </button>
        </div>
      </div>

      {/* 参数模拟弹窗 */}
      {showYieldModal && (
        <div className="modal-overlay" onClick={() => setShowYieldModal(false)}>
          <div
            className="modal-content p-0 max-w-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-soil-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-song text-lg font-bold text-field-800">
                🎚️ 产量与价格模拟
              </h3>
              <button onClick={() => setShowYieldModal(false)} className="p-2 rounded-lg hover:bg-soil-100 text-soil-500">
                <TrendingUp size={18} className="rotate-45" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <p className="text-sm text-soil-600 bg-field-50/60 p-3 rounded-lg border border-field-100">
                💡 拖动滑块调整产量系数和价格系数，模拟不同市场行情和生产条件下的收益变化
              </p>
              {cropBreakdown.map(c => {
                const cid = curPlots.find(p => {
                  const crop = getCropById(p.cropId || '');
                  return crop?.name === c.crop;
                })?.cropId || '';
                const yVal = yieldAdj[cid] ?? 1;
                const pVal = priceAdj[cid] ?? 1;
                return (
                  <div key={c.crop} className="p-4 rounded-xl bg-soil-50/60 border border-soil-200 space-y-3">
                    <div className="font-semibold text-field-800">{c.crop}</div>
                    <div>
                      <div className="flex justify-between text-xs text-soil-600 mb-1.5">
                        <span>产量系数</span>
                        <span className="font-semibold text-field-700">{(yVal * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.3"
                        step="0.05"
                        value={yVal}
                        onChange={e => setYieldAdj({ ...yieldAdj, [cid]: parseFloat(e.target.value) })}
                        className="w-full accent-field-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-soil-600 mb-1.5">
                        <span>价格系数</span>
                        <span className="font-semibold text-harvest-700">{(pVal * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.5"
                        step="0.05"
                        value={pVal}
                        onChange={e => setPriceAdj({ ...priceAdj, [cid]: parseFloat(e.target.value) })}
                        className="w-full accent-harvest-500"
                      />
                    </div>
                  </div>
                );
              })}
              {cropBreakdown.length === 0 && (
                <div className="py-10 text-center text-soil-400 text-sm">
                  请先为地块分配作物
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-soil-100 bg-soil-50/50 flex items-center justify-between rounded-b-2xl">
              <div className="text-sm">
                <span className="text-soil-500">调整后净利润：</span>
                <span className={`font-bold font-song text-lg ${adjustedRevenue.netProfit >= 0 ? 'text-field-700' : 'text-tomato-600'}`}>
                  ¥{formatBig(adjustedRevenue.netProfit)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setYieldAdj({}); setPriceAdj({}); }}
                  className="btn-secondary px-4"
                >
                  重置
                </button>
                <button onClick={() => setShowYieldModal(false)} className="btn-primary">
                  <Save size={14} /> 应用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label, value, unit, gradient, icon, sub, delta,
}: {
  label: string; value: string; unit?: string; gradient: string; icon: string; sub?: string; delta?: string | null;
}) {
  return (
    <div className={`stat-card bg-gradient-to-br ${gradient} text-white`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center text-lg">
          {icon}
        </div>
        {delta !== null && delta !== undefined && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5
            ${parseFloat(delta) >= 0 ? 'bg-white/20' : 'bg-black/20'}`}>
            {parseFloat(delta) >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {delta}%
          </span>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-bold font-song leading-tight flex items-baseline gap-1">
        {value}
        {unit && <span className="text-sm font-normal opacity-85">{unit}</span>}
      </div>
      <div className="text-xs opacity-85 mt-1.5">{sub || label}</div>
    </div>
  );
}

function formatBig(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 10000) return (n / 10000).toFixed(2) + '万';
  if (abs >= 1000) return n.toFixed(0);
  return n.toFixed(0);
}
