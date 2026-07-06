import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { Categorias } from './pages/Categorias';
import { Dashboard } from './pages/Dashboard';
import { GenerarPDF } from './pages/GenerarPDF';
import { ImportarPDF } from './pages/ImportarPDF';
import { Productos } from './pages/Productos';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/importar-pdf" element={<ImportarPDF />} />
          <Route path="/generar-pdf" element={<GenerarPDF />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
