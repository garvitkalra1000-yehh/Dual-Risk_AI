import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";

import Overview from "./pages/Overview";
import Students from "./pages/Students";
import Interventions from "./pages/Interventions";
import Analytics from "./pages/Analytics";
import ModelInsights from "./pages/ModelInsights";
import StudentProfile from "./pages/StudentProfile";

const navigation = [
  {
    name: "Overview",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Students",
    path: "/students",
    icon: Users,
  },
  {
    name: "Interventions",
    path: "/interventions",
    icon: ClipboardList,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Model Insights",
    path: "/model-insights",
    icon: BrainCircuit,
  },
];

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <div className="flex min-h-screen">

          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">

            {/* Logo */}
            <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <ShieldCheck size={21} />
              </div>

              <div>
                <p className="text-sm font-bold tracking-wide">
                  DUALRISK AI
                </p>

                <p className="text-xs text-slate-400">
                  Student Success
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Platform
              </p>

              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        isActive
                          ? "bg-slate-950 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                      ].join(" ")
                    }
                  >
                    <Icon size={18} />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* System status */}
            <div className="border-t border-slate-100 p-4">
              <div className="rounded-xl bg-emerald-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <span className="text-xs font-semibold text-emerald-700">
                    AI System Online
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-emerald-600">
                  Models and API operational
                </p>
              </div>
            </div>
          </aside>

          {/* Main area */}
          <div className="flex min-w-0 flex-1 flex-col lg:pl-64">

            {/* Mobile header */}
            <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/95 px-5 backdrop-blur lg:hidden">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <ShieldCheck size={17} />
                </div>

                <span className="text-sm font-bold">
                  DUALRISK AI
                </span>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/students" element={<Students />} />
                
                <Route
                  path="/students/:studentId"
                  element={<StudentProfile />}
                />
                
                <Route
                  path="/interventions"
                  element={<Interventions />}
                />
                <Route
                  path="/analytics"
                  element={<Analytics />}
                />
                <Route
                  path="/model-insights"
                  element={<ModelInsights />}
                />

                <Route
                  path="*"
                  element={<NotFound />}
                />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <AlertTriangle
          className="mx-auto text-slate-400"
          size={36}
        />

        <h1 className="mt-4 text-2xl font-bold">
          Page not found
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          The page you're looking for doesn't exist.
        </p>
      </div>
    </div>
  );
}

export default App;