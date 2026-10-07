import { BrowserRouter, Routes, Route } from 'react-router-dom';

import DecodingEncodingPage from '../components/DecodingEncoding/DecodingEncodingPage';
import { ReverseEngineeringPage } from '../components/ReverseEngineering';

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
          <Route path="/reverse-engineering" element={<ReverseEngineeringPage />} />
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

export default function GenisysApp() {
  return (
    <BrowserRouter>
      <SidebarCollapseProvider>
        <ProtectedShell />
      </SidebarCollapseProvider>
    </BrowserRouter>
  );
}
