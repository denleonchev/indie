"use client";

import { useRef, useState } from "react";

export default function ExportDialog({
  hasPendingExport,
  children,
}: {
  hasPendingExport: boolean;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function show() {
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button type="button" onClick={show} className="ml-auto rounded border border-gray-300 px-2 py-0.5">
        Export my transfers
      </button>
      {hasPendingExport && !open && <p className="basis-full text-gray-500">Preparing your export…</p>}
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        aria-labelledby="export-dialog-title"
        className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-lg p-0 backdrop:bg-black/40"
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="export-dialog-title" className="text-lg font-semibold">
                Export my transfers
              </h2>
              <p className="text-sm text-gray-500">Your incoming and outgoing transfers for the chosen period</p>
            </div>
            <button type="button" onClick={close} aria-label="Close" className="px-1 text-gray-500">
              ✕
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
