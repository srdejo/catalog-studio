import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Package,
  Tag,
  Upload,
  Download,
  FileOutput,
  Settings as SettingsIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  to?: string; // si falta, el enlace está inerte (pantalla de una etapa futura)
  icon: React.ReactNode;
}

const generalItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutGrid size={18} /> },
  { label: 'Productos', icon: <Package size={18} /> },
  { label: 'Categorías', icon: <Tag size={18} /> },
];

const dataItems: NavItem[] = [
  { label: 'Importar PDF', to: '/importar-pdf', icon: <Upload size={18} /> },
  { label: 'Exportar Excel', icon: <Download size={18} /> },
];

const outputItems: NavItem[] = [{ label: 'Generar PDF', to: '/generar-pdf', icon: <FileOutput size={18} /> }];

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <>
      <div className="px-2.5 pb-1.5 pt-4 text-[10.5px] font-semibold uppercase tracking-wide text-text-3">
        {title}
      </div>
      {items.map((item) =>
        item.to ? (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium ${
                isActive ? 'bg-accent-weak font-semibold text-accent-strong' : 'text-text-2 hover:bg-surface-2'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ) : (
          <span
            key={item.label}
            title="Disponible en una próxima etapa"
            className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-text-3 opacity-60"
          >
            {item.icon}
            {item.label}
          </span>
        ),
      )}
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-border bg-surface p-3.5">
      <div className="mb-3 flex items-center justify-center rounded-xl bg-ink px-4 py-3">
        <span className="font-display text-sm font-extrabold tracking-tight text-white">
          Catalog Studio
        </span>
      </div>

      <NavGroup title="General" items={generalItems} />
      <NavGroup title="Datos" items={dataItems} />
      <NavGroup title="Salida" items={outputItems} />

      <div className="mt-auto flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-text-3">
        <SettingsIcon size={18} />
        <span className="text-[13.5px] font-medium opacity-60">Configuración</span>
      </div>
    </aside>
  );
}
