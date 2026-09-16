import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "../components/Navigation/Sidebar";
import HeapDump from "./HeapDump_MemoryAnalysis";

export default function GenisysApp() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <main className="min-h-screen lg:pl-64">
          <Routes>
            {/* The default dashboard can be added when the dashboard module exists. */}
            {/* <Route path="/" element={<Dashboard />} /> */}

            <Route path="/heap" element={<HeapDump />} />

            {/* Add additional GENiSYS tools as their modules are implemented. */}
            {/* <Route path="/decode" element={<DecodingEncoding />} /> */}
            {/* <Route path="/files" element={<FileAnalysis />} /> */}
            {/* <Route path="/linux" element={<LinuxDocs />} /> */}
            {/* <Route path="/navigation" element={<Navigation />} /> */}
            {/* <Route path="/networking" element={<Networking />} /> */}
            {/* <Route path="/notes" element={<NotesSOP />} /> */}
            {/* <Route path="/osint" element={<OSINT />} /> */}
            {/* <Route path="/web" element={<WebAutomation />} /> */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}