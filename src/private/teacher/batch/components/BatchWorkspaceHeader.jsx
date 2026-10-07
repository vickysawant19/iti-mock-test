/* eslint-disable react/prop-types */
import { NavLink, useLocation } from "react-router-dom";

const tabClass = ({ isActive }) =>
  `inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none ${
    isActive
      ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300"
      : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
  }`;

const BatchWorkspaceHeader = ({ title, description, toolbar }) => {
  const { pathname } = useLocation();
  const selectedBatchSettings = pathname.match(/^\/batches\/([^/]+)\/settings\/?$/);
  const settingsPath = selectedBatchSettings
    ? `/batches/${selectedBatchSettings[1]}/settings`
    : "/batches/settings";

  return (
    <div className="mx-auto w-full max-w-7xl px-2 pt-3 sm:px-4 lg:px-8">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Batch management
            </p>
            <h1 className="mt-1 text-xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-5 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>

          <div className="sm:self-start">
            <nav aria-label="Batch workspace" className="grid w-full grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950 sm:w-auto">
              <NavLink to="/batches/create" end className={tabClass}>
                Create batch
              </NavLink>
              <NavLink to={settingsPath} end className={tabClass}>
                Batch settings
              </NavLink>
            </nav>
          </div>
        </div>

        {toolbar && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
            {toolbar}
          </div>
        )}
      </header>
    </div>
  );
};

export default BatchWorkspaceHeader;
