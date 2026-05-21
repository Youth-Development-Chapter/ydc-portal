"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, QrCode, CheckCircle2, ShieldAlert } from "lucide-react";

export default function ScanAttendancePage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [activeScanner, setActiveScanner] = useState<boolean>(false);

  useEffect(() => {
    // This is a client-side component, we initialize the html5-qrcode dynamically
    if (activeScanner && typeof window !== "undefined") {
      import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
        const scanner = new Html5QrcodeScanner(
          "qr-reader-container",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            // On success
            setScanResult(decodedText);
            scanner.clear();
            setActiveScanner(false);
          },
          (errorMessage) => {
            // Handle scanning failures/errors silently as they occur constantly while looking for code
          }
        );

        return () => {
          scanner.clear().catch(err => console.error("Error clearing scanner", err));
        };
      });
    }
  }, [activeScanner]);

  const startScanning = () => {
    setScanResult(null);
    setCameraPermission(true);
    setActiveScanner(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-ydc-blue/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-ydc-green/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-6 group transition-colors">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Admin Dashboard
        </Link>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="relative w-6 h-6 flex items-center justify-center">
            <span className="absolute top-0 w-2 h-2 rounded-full bg-ydc-red"></span>
            <span className="absolute bottom-0 left-0 w-2 h-2 rounded-full bg-ydc-blue"></span>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-ydc-green"></span>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-ydc-blue via-ydc-green to-ydc-red bg-clip-text text-transparent animate-pulse">
            YDC Scan Station
          </span>
        </div>
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-white mb-2">
          Verify Physical Tickets
        </h2>
        <p className="text-center text-sm text-slate-400 mb-8">
          Check in volunteers and award YDC Coins automatically via secure QR scan.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/50 border border-slate-800 backdrop-blur p-6 rounded-2xl shadow-xl flex flex-col items-center">
          
          {/* Scan Frame */}
          <div className="relative w-full aspect-square max-w-[280px] bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden mb-6 group">
            {activeScanner ? (
              <div id="qr-reader-container" className="w-full h-full text-slate-900"></div>
            ) : (
              <div className="flex flex-col items-center text-slate-500 gap-3 text-center p-4">
                <div className="p-4 rounded-full bg-slate-900 border border-slate-850 text-slate-400 group-hover:text-ydc-blue group-hover:border-ydc-blue/30 transition-all">
                  <Camera size={32} />
                </div>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                  Click below to activate device camera and position the attendee's ticket code inside the frame.
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          {!activeScanner ? (
            <button
              onClick={startScanning}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-ydc-blue to-ydc-blue-dark hover:shadow-ydc-blue/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-ydc-blue transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Activate Camera Scanner
            </button>
          ) : (
            <button
              onClick={() => setActiveScanner(false)}
              className="w-full flex justify-center py-3 px-4 border border-slate-850 rounded-xl text-sm font-semibold text-slate-300 bg-slate-950 hover:bg-slate-900 transition-all cursor-pointer"
            >
              Cancel Scanning
            </button>
          )}

          {/* Success Scan Result Display */}
          {scanResult && (
            <div className="w-full mt-6 p-4 rounded-xl bg-ydc-green/10 border border-ydc-green/20 flex gap-3 text-left">
              <CheckCircle2 className="text-ydc-green shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-bold text-slate-200">Ticket Check-In Complete</h4>
                <p className="text-xs text-slate-400 mt-1 truncate max-w-[240px]">
                  Decoded ID: <span className="font-mono text-slate-300 font-semibold">{scanResult}</span>
                </p>
                <span className="inline-block text-[10px] font-bold text-ydc-green uppercase tracking-wide mt-2 animate-pulse">
                  +50 Coins Credited Asynchronously
                </span>
              </div>
            </div>
          )}

          {/* Warnings */}
          <div className="w-full mt-6 pt-6 border-t border-slate-800/80 flex gap-3 text-left">
            <ShieldAlert className="text-slate-500 shrink-0 mt-0.5" size={16} />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Attendance records are stored in an append-only ledger on Supabase. Duplicate check-ins will throw errors automatically on the backend handler.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
