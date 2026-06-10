import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import PlotDashboard from '@/pages/PlotDashboard';
import CropArchive from '@/pages/CropArchive';
import FarmCalendar from '@/pages/FarmCalendar';
import InputRecords from '@/pages/InputRecords';
import Revenue from '@/pages/Revenue';
import { useAgriStore } from '@/store/agriStore';

export default function App() {
  const loadFirstPreset = useAgriStore(s => s.loadFirstPreset);

  useEffect(() => {
    loadFirstPreset();
  }, [loadFirstPreset]);

  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<PlotDashboard />} />
          <Route path="/crops" element={<CropArchive />} />
          <Route path="/calendar" element={<FarmCalendar />} />
          <Route path="/inputs" element={<InputRecords />} />
          <Route path="/revenue" element={<Revenue />} />
          <Route path="*" element={<PlotDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
