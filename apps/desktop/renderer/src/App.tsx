import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { GenerarPDF } from './pages/GenerarPDF';
import { ImportarPDF } from './pages/ImportarPDF';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/generar-pdf" replace />} />
          <Route path="/importar-pdf" element={<ImportarPDF />} />
          <Route path="/generar-pdf" element={<GenerarPDF />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
