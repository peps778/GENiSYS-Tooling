import { BrowserRouter, Routes, Route } from "react-router-dom";
import DecodingEncodingPage from "../components/DecodingEncoding/DecodingEncodingPage"
import Sidebar from "../components/Navigation/Sidebar";
import HeapDump from "./HeapDump_MemoryAnalysis";
import Dashboard from "./Dashboard";
import { FileAnalysisPage } from "../components/FileAnalysis";
import LinuxDocs from "../components/LinuxDocs/index";

export default function GenisysApp() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <main className="min-h-screen lg:pl-64">
          <Routes>
            {/* no content pa si dashboard */}
            <Route path="/" element={<Dashboard />} /> 

            <Route path="/heap" element={<HeapDump />}/>

            <Route path="/decode" element={<DecodingEncodingPage />} /> 
            <Route path="/files" element={<FileAnalysisPage />} />
            <Route path="/linux" element={<LinuxDocs />} />
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