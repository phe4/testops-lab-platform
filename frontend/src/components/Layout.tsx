import { Link, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/requests", label: "Test Requests" },
  { to: "/jobs", label: "Test Jobs" },
  { to: "/requests/new", label: "Create Request" },
];

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    if (path === "/requests") {
      return (
        location.pathname === "/requests" ||
        (/^\/requests\/[^/]+$/.test(location.pathname) &&
          location.pathname !== "/requests/new") ||
        /^\/reports\/[^/]+$/.test(location.pathname)
      );
    }

    if (path === "/jobs") {
      return (
        location.pathname === "/jobs" || /^\/jobs\/[^/]+$/.test(location.pathname)
      );
    }

    if (path === "/requests/new") {
      return location.pathname === "/requests/new";
    }

    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-5 py-6 md:block">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            TestOps
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">
            Lab Platform
          </h1>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                [
                  "block rounded-md px-3 py-2 text-sm font-medium",
                  isActive(item.to)
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Hardware validation ops</p>
              <h2 className="text-lg font-semibold text-slate-950">
                Diagnostic test infrastructure
              </h2>
            </div>
            <div className="flex gap-2 md:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    [
                      "rounded-md border px-3 py-2 text-sm",
                      isActive(item.to)
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-700",
                    ].join(" ")
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
