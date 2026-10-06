import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import DecodingEncodingPage from '../components/DecodingEncoding/DecodingEncodingPage';
import Sidebar from '../components/Navigation/Sidebar';
import {
  SidebarCollapseProvider,
  useSidebarCollapseContext,
} from '../components/Navigation/SidebarCollapseContext';
import HeapDump from './HeapDump_MemoryAnalysis';
import Dashboard from './Dashboard';
import { FileAnalysisPage } from '../components/FileAnalysis';
import LinuxDocs from '../components/LinuxDocs/';
import Networking from '../components/Networking/';
import NotesSOP from './NotesSOP';
import OSINT from './OSINT';
import { WebSecurityCTFPage } from './WebAutomation_Exploit';
import Login from '../Authentication/Login/Login';
import Registration from '../Authentication/Registration/RegistrationPage';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Tracks Firebase auth state. A user only counts as "authenticated" for
 * routing purposes once their email is verified — an unverified account
 * is treated the same as signed-out here (Login.tsx handles showing them
 * the verification screen instead of silently redirecting them away).
 */
function useAuthStatus(): AuthStatus {
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user && user.emailVerified) {
        setStatus('authenticated');
        return;
      }

      if (user && !user.emailVerified) {
        setStatus('unauthenticated');
        return;
      }

      setStatus('unauthenticated');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}

/**
 * Wraps /login and /registration. While Firebase is still resolving the
 * session, the requested form (Login or Registration) renders as-is —
 * there is nothing to bounce away from yet. Once resolved, a signed-in
 * user is redirected to "/".
 */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const status = useAuthStatus();

  if (status === 'authenticated') return <Navigate to="/" replace />;

  return <>{children}</>;
}

/**
 * The authenticated app shell: sidebar + routed page content. Split out
 * from ProtectedLayout so it can sit inside SidebarCollapseProvider and
 * read the shared collapsed state via context — the main content's left
 * offset has to track the sidebar's current width, not just its expanded
 * width.
 */
function ProtectedShell() {
  const { collapsed } = useSidebarCollapseContext();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className={`min-h-screen ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/heap" element={<HeapDump />} />
          <Route path="/decode" element={<DecodingEncodingPage />} />
          <Route path="/files" element={<FileAnalysisPage />} />
          <Route path="/linux" element={<LinuxDocs />} />
          <Route path="/networking" element={<Networking />} />
          <Route path="/notes" element={<NotesSOP />} />
          <Route path="/osint" element={<OSINT />} />
          <Route path="/web" element={<WebSecurityCTFPage />} />
        </Routes>
      </main>
    </div>
  );
}

/**
 * Wraps the existing app shell. Login is rendered immediately — both
 * while Firebase is still resolving the session AND once it resolves to
 * signed-out — so a reload always shows Login first rather than a
 * generic loading state or a flash of protected content.
 */
function ProtectedLayout() {
  const status = useAuthStatus();

  /*
   * Firebase authentication is asynchronous. Rendering Login while the
   * initial authentication state is unresolved causes a visible login
   * flash for users who already have a valid persisted session.
   *
   * Keep the application neutral until Firebase resolves the session.
   */
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50" aria-busy="true">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-sm text-gray-500">Loading GENiSYS...</div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarCollapseProvider>
      <ProtectedShell />
    </SidebarCollapseProvider>
  );
}

export default function GenisysApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/registration"
          element={
            <PublicOnlyRoute>
              <Registration />
            </PublicOnlyRoute>
          }
        />
        {/* Everything else requires a verified, signed-in user. */}
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
