import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, Database, Key, Globe, Coffee, Link2, Settings as SettingsIcon, Menu, X,
} from "lucide-react";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import CertificateList from "./pages/CertificateList";
import CertificateDetail from "./pages/CertificateDetail";
import AddCertificate from "./pages/AddCertificate";
import Settings from "./pages/Settings";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: "/certificates", label: "All Certificates", icon: <ShieldCheck className="w-5 h-5" /> },
  { path: "/certificates?type=DATABASE_SERVER", label: "Database Server", icon: <Database className="w-5 h-5" /> },
  { path: "/certificates?type=OKTA", label: "Okta", icon: <Key className="w-5 h-5" /> },
  { path: "/certificates?type=LOAD_BALANCER", label: "Load Balancer", icon: <Globe className="w-5 h-5" /> },
  { path: "/certificates?type=JAVA_APP", label: "Java Application", icon: <Coffee className="w-5 h-5" /> },
  { path: "/certificates?type=THIRD_PARTY", label: "Third Party", icon: <Link2 className="w-5 h-5" /> },
  { path: "/settings", label: "Settings", icon: <SettingsIcon className="w-5 h-5" /> },
];

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path.includes("?")) {
      return location.pathname + location.search === path;
    }
    return location.pathname.startsWith(path) && !location.search;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">SSL Monitor</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</p>
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavItem key={item.path} {...item} active={isActive(item.path)} onClick={() => setSidebarOpen(false)} />
          ))}
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">By Certificate Type</p>
          {NAV_ITEMS.slice(2, 7).map((item) => (
            <NavItem key={item.path} {...item} active={isActive(item.path)} onClick={() => setSidebarOpen(false)} />
          ))}
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">Configuration</p>
          {NAV_ITEMS.slice(7).map((item) => (
            <NavItem key={item.path} {...item} active={isActive(item.path)} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-sm font-medium text-gray-500">
            SSL Certificate Monitoring System
          </h2>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-gray-400">
              Organization-wide certificate health monitoring
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/certificates" element={<CertificateList />} />
            <Route path="/certificates/new" element={<AddCertificate />} />
            <Route path="/certificates/:id" element={<CertificateDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function NavItem({ path, label, icon, active, onClick }: {
  path: string; label: string; icon: React.ReactNode; active: boolean; onClick: () => void;
}) {
  const nav = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    nav(path);
    onClick();
  };

  return (
    <a
      href={path}
      onClick={handleClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
