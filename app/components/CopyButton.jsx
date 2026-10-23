"use client";
import { useRef, useState } from "react";

// Copies `text`; when the Clipboard API is blocked, selects the fallback textarea so the user can press Ctrl/Cmd+C.
export default function CopyButton({ text, label = "คัดลอก prompt ติดตั้ง", className = "" }) {
  const [state, setState] = useState("idle");
  const fallback = useRef(null);
  const timer = useRef(0);

  async function copy() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      dispatchEvent(new CustomEvent("mrn:copy"));
      timer.current = setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("failed");
      requestAnimationFrame(() => fallback.current?.select());
    }
  }

  return (
    <div className={`copy ${className}`} data-state={state}>
      <button type="button" className="copy-btn" onClick={copy}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {state === "copied" ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" /></>}
        </svg>
        {state === "copied" ? "คัดลอกแล้ว" : label}
      </button>
      <p className="copy-status" role="status" aria-live="polite">
        {state === "copied" && "วางใน Claude Code แล้วกด Enter ได้เลย"}
        {state === "failed" && "เบราว์เซอร์ไม่ให้คัดลอกอัตโนมัติ เลือกข้อความไว้ให้แล้ว กด Ctrl+C (Mac: ⌘C)"}
      </p>
      {state === "failed" && <textarea ref={fallback} className="copy-fallback" readOnly value={text} rows={6} aria-label="prompt ติดตั้ง" />}
    </div>
  );
}
