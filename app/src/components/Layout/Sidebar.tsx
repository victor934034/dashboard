import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Table,
  Kanban,
  ShoppingCart,
  Megaphone,
  Settings,
  History
} from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/estoque', label: 'Estoque', icon: Table },
  { path: '/crm', label: 'CRM', icon: Kanban },
  { path: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { path: '/campanhas', label: 'Campanhas', icon: Megaphone },
  { path: '/history', label: 'Histórico', icon: History },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">BR</span>
          </div>
          Dashboard
        </h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }: { isActive: boolean }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
          Configurações
        </button>
      </div>
    </aside>
  );
}
