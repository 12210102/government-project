import { useState } from 'react';
import {
  LayoutDashboard,
  ScanFace,
  UserPlus,
  FileText,
  Users,
  Building2,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { Dashboard } from '@/screens/Dashboard';
import { FaceRecognition } from '@/screens/FaceRecognition';
import { RegisterCitizen } from '@/screens/RegisterCitizen';
import { IssueFine } from '@/screens/IssueFine';
import { Violations } from '@/screens/Violations';
import { Citizens } from '@/screens/Citizens';
import type { Citizen, ViolationSource } from '@/types';
import type { FaceDetectionResult } from '@/lib/faceApi';
import { Alerts } from '@/screens/Alerts';

export type Page = 'dashboard' | 'recognize' | 'register' | 'issue-fine' | 'violations' | 'citizens' | 'alerts';

export interface NavigationData {
  citizen?: Citizen;
  suspectFaceData?: FaceDetectionResult;
  source?: ViolationSource;
  cctvCameraName?: string;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    description: 'Overview & statistics',
  },
  {
    id: 'recognize',
    label: 'Face Recognition',
    icon: <ScanFace className="h-5 w-5" />,
    description: 'Identify by face or CCTV',
  },
  {
    id: 'register',
    label: 'Register Citizen',
    icon: <UserPlus className="h-5 w-5" />,
    description: 'Add a new person',
  },
  {
    id: 'issue-fine',
    label: 'Issue Fine',
    icon: <FileText className="h-5 w-5" />,
    description: 'Record a violation',
  },
  {
    id: 'alerts',
    label: 'Alerts & Escalation',
    icon: <Bell className="h-5 w-5" />,
    description: 'Overdue fines & actions',
  },
  {
    id: 'violations',
    label: 'Violation Records',
    icon: <FileText className="h-5 w-5" />,
    description: 'View all fines issued',
  },
  {
    id: 'citizens',
    label: 'Citizen Registry',
    icon: <Users className="h-5 w-5" />,
    description: 'Browse registered persons',
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [navData, setNavData] = useState<NavigationData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (page: Page, data?: unknown) => {
    setCurrentPage(page);
    if (data && typeof data === 'object') {
      setNavData(data as NavigationData);
    } else {
      setNavData(null);
    }
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'recognize':
        return <FaceRecognition onNavigate={navigate} />;
      case 'register':
        return <RegisterCitizen onNavigate={navigate} />;
      case 'issue-fine':
        return <IssueFine data={navData} onNavigate={navigate} />;
      case 'alerts':
        return <Alerts />;
      case 'violations':
        return <Violations />;
      case 'citizens':
        return <Citizens onNavigate={navigate} />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  const activeItem = NAV_ITEMS.find((item) => item.id === currentPage);

  return (
    <div className="flex h-screen bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Municipal Corp</p>
                <p className="text-xs text-slate-400 leading-tight">Enforcement Portal</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  currentPage === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className={`text-xs truncate ${currentPage === item.id ? 'text-blue-200' : 'text-slate-500'}`}>
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <p className="text-xs text-slate-500">Sanitation Enforcement System</p>
            <p className="mt-1 text-xs text-slate-600">v1.0 · Municipal Corporation</p>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">Municipal Enforcement</span>
          </div>
          <div className="w-6" />
        </header>

        <div className="hidden border-b border-slate-200 bg-white px-6 py-3 lg:block">
          <p className="text-sm text-slate-500">{activeItem?.label}</p>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
}
