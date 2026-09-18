import { useEffect, useState } from "react";

export default function TimeTracker() {
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Session Time</p>
      <p className="mt-1 font-mono text-lg font-bold text-green-700">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
    </div>
  );
}
