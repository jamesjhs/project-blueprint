import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { APP_VERSION } from './version';

function Home(): JSX.Element {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-3xl font-semibold text-slate-900"><<PROJECT_TITLE>></h1>
      <p className="text-slate-600"><<PROJECT_DESCRIPTION>></p>
      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        Start building from <code>client/src/App.tsx</code> and <code>server/src/routes</code>.
      </div>
    </section>
  );
}

function About(): JSX.Element {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900">About</h2>
      <p className="text-slate-600">
        This template includes version awareness, API health checks, and optional feature modules.
      </p>
    </section>
  );
}

export default function App(): JSX.Element {
  const [serverVersion, setServerVersion] = useState(APP_VERSION);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkVersion(): Promise<void> {
      try {
        const response = await fetch('/api/version');
        if (!response.ok) return;

        const payload = (await response.json()) as { version?: string };
        if (!active || !payload.version) return;

        setServerVersion(payload.version);
        setUpdateAvailable(payload.version !== APP_VERSION);
      } catch {
        // ignore connectivity checks during startup
      }
    }

    void checkVersion();
    const interval = window.setInterval(() => void checkVersion(), 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const nav = useMemo(
    () => [
      { to: '/', label: 'Home' },
      { to: '/about', label: 'About' },
    ],
    [],
  );

  const handleRefresh = async (): Promise<void> => {
    const registration = await navigator.serviceWorker?.getRegistration();
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
        {updateAvailable ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
            <span>Version {serverVersion} is available. Refresh to load the latest assets.</span>
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
              onClick={() => void handleRefresh()}
              type="button"
            >
              Refresh now
            </button>
          </div>
        ) : null}

        <header className="flex flex-col gap-4 rounded-3xl bg-slate-900 px-8 py-8 text-white shadow-lg md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-200">Blueprint starter</p>
            <h1 className="text-4xl font-semibold"><<PROJECT_TITLE>></h1>
            <p className="mt-3 max-w-2xl text-slate-300"><<PROJECT_DESCRIPTION>></p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
            <div>Client v{APP_VERSION}</div>
            <div>Server v{serverVersion}</div>
          </div>
        </header>

        <nav className="flex gap-3">
          {nav.map((item) => (
            <Link
              key={item.to}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<About />} path="/about" />
        </Routes>
      </div>
    </div>
  );
}
