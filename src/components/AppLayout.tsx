import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  CalendarDays,
  ClipboardList,
  TrendingUp,
  Download,
  Upload,
  Menu,
  X,
  FolderKanban,
  ChevronDown,
} from 'lucide-react';
import { useAgriStore, PRESET_SCENARIOS } from '@/store/agriStore';
import ScenarioModal from './ScenarioModal';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: '地块看板' },
  { path: '/crops', icon: Sprout, label: '作物档案' },
  { path: '/calendar', icon: CalendarDays, label: '农事日历' },
  { path: '/inputs', icon: ClipboardList, label: '投入品记录' },
  { path: '/revenue', icon: TrendingUp, label: '收益测算' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const {
    currentScenarioId,
    scenarios,
    switchScenario,
    exportScenario,
    importScenario,
  } = useAgriStore();

  const currentScenario = scenarios.find(s => s.id === currentScenarioId)
    ?? PRESET_SCENARIOS.find(p => p.scenario.id === currentScenarioId)?.scenario;

  const handleExport = () => {
    const data = exportScenario();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentScenario?.name || '农业演示数据'}.json`.replace(/[^\w\u4e00-\u9fa5.-]/g, '_');
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (importScenario(result)) {
        alert('导入成功！');
      } else {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-soil-900/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-field-800 to-field-900
          text-white shadow-xl transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-full flex flex-col">
          {/* Logo 区 */}
          <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-harvest-400 to-harvest-500
                flex items-center justify-center text-2xl shadow-lg shadow-harvest-500/30">
                🌱
              </div>
              <div>
                <h1 className="font-song text-lg font-bold tracking-wide">智慧农业</h1>
                <p className="text-xs text-field-300 mt-0.5">演示管理系统</p>
              </div>
            </div>
          </div>

          {/* 案例选择 */}
          <div className="px-4 py-4 border-b border-white/10">
            <button
              onClick={() => setScenarioOpen(true)}
              className="w-full"
            >
              <div className="rounded-xl bg-white/8 border border-white/15 p-3
                hover:bg-white/12 hover:border-white/25 transition-all group">
                <div className="flex items-center gap-2 text-xs text-field-300 mb-1">
                  <FolderKanban size={14} />
                  当前演示案例
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate pr-2">
                    {currentScenario?.name || '未选择案例'}
                  </span>
                  <ChevronDown size={16} className="text-field-400 group-hover:text-white transition-colors" />
                </div>
                {currentScenario?.description && (
                  <p className="text-xs text-field-400 mt-1 line-clamp-2 text-left">
                    {currentScenario.description}
                  </p>
                )}
              </div>
            </button>

            {/* 快速加载预设 */}
            <div className="mt-3 relative">
              <button
                onClick={() => setPresetMenuOpen(!presetMenuOpen)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-field-700/50 text-field-200
                  hover:bg-field-700 transition-colors flex items-center justify-between"
              >
                <span>📚 快速加载预设案例</span>
                <ChevronDown size={14} className={`transition-transform ${presetMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {presetMenuOpen && (
                <div className="mt-2 space-y-1.5 animate-fade-in">
                  {PRESET_SCENARIOS.map(p => (
                    <button
                      key={p.scenario.id}
                      onClick={() => {
                        switchScenario(p.scenario.id);
                        setPresetMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-xs transition-all
                        ${currentScenarioId === p.scenario.id
                          ? 'bg-harvest-500 text-white shadow-md shadow-harvest-500/30'
                          : 'bg-white/5 text-field-200 hover:bg-white/10 border border-white/10'}`}
                    >
                      <div className="font-medium">{p.scenario.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-thin">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                }
              >
                <item.icon size={20} strokeWidth={1.8} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* 导入导出 */}
          <div className="px-4 py-4 border-t border-white/10 space-y-2">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl
                bg-white/8 border border-white/15 text-field-100 text-sm
                hover:bg-white/12 hover:border-white/25 hover:text-white transition-all"
            >
              <Download size={18} />
              <span>导出演示数据</span>
            </button>
            <label className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl
              bg-white/8 border border-white/15 text-field-100 text-sm cursor-pointer
              hover:bg-white/12 hover:border-white/25 hover:text-white transition-all">
              <Upload size={18} />
              <span>导入演示数据</span>
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>

          {/* 关闭按钮（移动端） */}
          <button
            className="lg:hidden absolute top-4 right-4 p-2 text-field-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-soil-200/70">
          <div className="px-4 md:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-soil-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={22} />
              </button>
              <div className="min-w-0">
                <h2 className="font-song text-lg md:text-xl font-semibold text-field-800 truncate">
                  {currentScenario?.name || '智慧农业演示系统'}
                </h2>
                {currentScenario?.description && (
                  <p className="text-xs text-soil-500 truncate hidden md:block">
                    {currentScenario.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                bg-field-50 text-field-700 text-xs font-medium border border-field-200">
                <span className="w-2 h-2 rounded-full bg-field-500 animate-pulse" />
                数据本地保存
              </span>
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-auto scrollbar-thin">
          <div className="px-4 md:px-8 py-6 md:py-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 案例管理弹窗 */}
      {scenarioOpen && (
        <ScenarioModal
          onClose={() => setScenarioOpen(false)}
        />
      )}
    </div>
  );
}
