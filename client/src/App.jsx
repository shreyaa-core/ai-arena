import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "./components/ui/sonner.jsx";

function GameLaunchPlaceholder() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B132B] px-6 text-center text-[#F1F5F9]">
      <div className="max-w-xl rounded-2xl border border-teal-500/30 bg-[#141D38] p-8 shadow-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-teal-400">
          AI Arena Game Engine
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
          AI Arena
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Core JavaScript engine migrated. World engine & Phaser scenes initializing next.
        </p>
      </div>
    </main>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<GameLaunchPlaceholder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
