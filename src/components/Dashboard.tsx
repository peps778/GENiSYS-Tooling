import React, { useEffect, useState } from 'react';

const modules = [
  {
    code: '01',
    title: 'Reconnaissance',
    description:
      'Discover hosts, services, endpoints, and useful target information.',
    tools: ['nmap', 'dig', 'curl', 'katana'],
  },
  {
    code: '02',
    title: 'Analysis',
    description:
      'Inspect files, binaries, requests, data, and challenge artifacts.',
    tools: ['file', 'strings', 'xxd', 'jq'],
  },
  {
    code: '03',
    title: 'Web Security',
    description:
      'Analyze HTTP traffic, endpoints, parameters, APIs, and web targets.',
    tools: ['httpx', 'ffuf', 'curl', 'jq'],
  },
];

const bootLines = [
  'GENiSYS security workspace',
  'loading modules...',
  'reconnaissance ........ READY',
  'file analysis .......... READY',
  'web security ........... READY',
  'linux reference ........ READY',
];

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisibleLines((current) => {
        if (current >= bootLines.length) {
          return 0;
        }

        return current + 1;
      });
    }, 700);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden border border-emerald-900/10 bg-white text-slate-950">
      {/* Ambient environment */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-emerald-500/[0.07] blur-[110px] animate-[pulse_8s_ease-in-out_infinite]" />

        <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-green-400/[0.06] blur-[120px] animate-[pulse_10s_ease-in-out_infinite]" />

        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.025] blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />

        {/* Technical grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(20,83,45,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(20,83,45,.35) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Continuous scan */}
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent animate-[dashboardScan_7s_linear_infinite]" />

        <style>{`
          @keyframes dashboardScan {
            0% {
              transform: translateY(-10%);
              opacity: 0;
            }

            10% {
              opacity: 1;
            }

            90% {
              opacity: 1;
            }

            100% {
              transform: translateY(110vh);
              opacity: 0;
            }
          }

          @keyframes dashboardBlink {
            0%,
            45% {
              opacity: 1;
            }

            50%,
            100% {
              opacity: 0.15;
            }
          }

          @keyframes dashboardReveal {
            from {
              opacity: 0;
              transform: translateY(12px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>

      {/* Main surface */}
      <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col p-5 sm:p-6 lg:p-7">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-emerald-900/10 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-50">
              <span className="absolute h-3 w-3 rounded-full bg-emerald-500/10 animate-ping" />

              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.25em] text-green-950">
                GENiSYS
              </p>

              <p className="truncate text-[9px] text-slate-400">
                Security Toolkit
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-5 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400 sm:flex">
            <span>LOCAL</span>
            <span>SYS-01</span>
            <span className="text-emerald-600">ONLINE</span>
          </div>
        </header>

        {/* Main area */}
        <main className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-5 lg:py-6">
          <div className="grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)] lg:items-center">
            {/* Hero */}
            <section className="min-w-0 animate-[dashboardReveal_.8s_ease-out_both]">
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[10px] text-emerald-600/70">
                  00 /
                </span>

                <span className="h-px w-8 bg-emerald-500/30" />

                <span className="truncate text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Hack4Gov Toolkit
                </span>
              </div>

              <h1 className="max-w-4xl text-[clamp(2.25rem,5vw,5.5rem)] font-bold leading-[0.9] tracking-[-0.05em] text-green-950">
                Security
                <span className="block text-green-900/85">starts with</span>
                <span className="block text-emerald-600">visibility.</span>
              </h1>

              <p className="mt-5 max-w-xl text-xs leading-6 text-slate-500 sm:text-sm">
                A focused security workspace for reconnaissance, analysis, Linux
                tooling, web security, decoding, and controlled CTF workflows.
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px w-12 bg-emerald-500/40" />

                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-600/70">
                  System initialized
                </span>
              </div>
            </section>

            {/* Terminal */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-green-900/10 bg-black shadow-xl shadow-green-950/10 animate-[dashboardReveal_1s_.1s_ease-out_both]">
              <div className="flex h-10 items-center justify-between border-b border-white/8 px-4">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
                </div>

                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/25">
                  system.log
                </span>
              </div>

              <div className="min-h-[190px] p-4 font-mono text-[10px] leading-6 sm:text-[11px]">
                {bootLines.map((line, index) => {
                  const visible = index < visibleLines;

                  return (
                    <div
                      key={line}
                      className={[
                        'transition-all duration-300',
                        visible
                          ? 'translate-x-0 opacity-100'
                          : 'translate-x-2 opacity-0',
                        index === 0
                          ? 'text-white/75'
                          : line.includes('READY')
                            ? 'text-emerald-300/80'
                            : 'text-white/30',
                      ].join(' ')}
                    >
                      {line}
                    </div>
                  );
                })}

                <div className="mt-1 flex items-center gap-2 text-emerald-300/80">
                  <span>$</span>

                  <span className="h-3 w-px bg-emerald-400 animate-[dashboardBlink_1s_step-end_infinite]" />
                </div>
              </div>
            </section>
          </div>

          {/* Module strip */}
          <section className="mt-6 min-h-0 shrink-0">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] text-emerald-600/60">
                  01 /
                </span>

                <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Operational Modules
                </span>
              </div>

              <span className="font-mono text-[8px] text-slate-400">
                {String(modules.length).padStart(2, '0')} ACTIVE
              </span>
            </div>

            <div className="grid min-w-0 gap-2.5 md:grid-cols-3">
              {modules.map((module, index) => {
                const active = activeModule === index;

                return (
                  <button
                    key={module.code}
                    type="button"
                    onMouseEnter={() => setActiveModule(index)}
                    onFocus={() => setActiveModule(index)}
                    onClick={() => setActiveModule(index)}
                    className={[
                      'relative min-w-0 overflow-hidden rounded-xl border p-4 text-left',
                      'transition-all duration-300',
                      active
                        ? 'border-emerald-500/30 bg-emerald-50 shadow-sm shadow-emerald-900/5'
                        : 'border-emerald-900/10 bg-white/80 hover:border-emerald-300 hover:bg-emerald-50/50',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'absolute left-0 top-0 h-full w-px transition-all duration-300',
                        active
                          ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.7)]'
                          : 'bg-transparent',
                      ].join(' ')}
                    />

                    <div className="flex items-center justify-between">
                      <span
                        className={[
                          'font-mono text-[9px]',
                          active ? 'text-emerald-600' : 'text-slate-400',
                        ].join(' ')}
                      >
                        {module.code}
                      </span>

                      <span
                        className={[
                          'text-xs transition-all duration-300',
                          active ? 'text-emerald-600' : 'text-slate-300',
                        ].join(' ')}
                      >
                        +
                      </span>
                    </div>

                    <h2 className="mt-3 truncate text-xs font-semibold text-green-950">
                      {module.title}
                    </h2>

                    <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-500">
                      {module.description}
                    </p>

                    <div className="mt-3 flex min-w-0 gap-1.5 overflow-hidden">
                      {module.tools.map((tool) => (
                        <span
                          key={tool}
                          className={[
                            'shrink-0 rounded border px-1.5 py-0.5 font-mono text-[8px]',
                            active
                              ? 'border-emerald-500/10 bg-emerald-500/[0.05] text-emerald-700/70'
                              : 'border-slate-200 bg-slate-50 text-slate-400',
                          ].join(' ')}
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-between border-t border-emerald-900/10 pt-3">
          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-400">
            GENiSYS Tooling
          </span>

          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-emerald-600/60">
            Authorized Use Only
          </span>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
