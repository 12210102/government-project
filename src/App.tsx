import { useState } from 'react';
import { FlaskConical, Menu, X, Home, Plus, FileText } from 'lucide-react';
import { Dashboard } from '@/screens/Dashboard';
import { NewInvestigation } from '@/screens/NewInvestigation';
import { InvestigationDetail } from '@/screens/InvestigationDetail';

type View = { page: 'dashboard' } | { page: 'new' } | { page: 'detail'; id: string };

export default function App() {
  const [view, setView] = useState<View>({ page: 'dashboard' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const goDashboard = () => {
    setView({ page: 'dashboard' });
    setSidebarOpen(false);
  };

  const goNew = () => {
    setView({ page: 'new' });
    setSidebarOpen(false);
  };

  const goDetail = (id: string) => {
    setView({ page: 'detail', id });
    setSidebarOpen(false);
  };

  const navItems = [
    { label: 'Dashboard', icon: <Home className="h-5 w-5" />, action: goDashboard, active: view.page === 'dashboard' },
    { label: 'New Investigation', icon: <Plus className="h-5 w-5" />, action: goNew, active: view.page === 'new' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b border-slate-800 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <FlaskConical className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">PharmaRCA</p>
                <p className="text-xs text-slate-400 leading-tight">AI-Powered RCA Module</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  item.active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}

            {view.page === 'detail' && (
              <button
                onClick={goDashboard}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm font-medium">All Investigations</span>
              </button>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-800 p-4">
            <p className="text-xs text-slate-500">API Manufacturing</p>
            <p className="mt-1 text-xs text-slate-600">Quality Assurance System</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">PharmaRCA</span>
          </div>
          <div className="w-6" />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view.page === 'dashboard' && <Dashboard onNew={goNew} onOpen={goDetail} />}
          {view.page === 'new' && <NewInvestigation onBack={goDashboard} onSaved={goDetail} />}
          {view.page === 'detail' && <InvestigationDetail id={view.id} onBack={goDashboard} />}
        </div>
      </div>
    </div>
  );
}
