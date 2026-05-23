"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Camera, Scan, AlertCircle, KeyboardIcon, RefreshCw } from "lucide-react";

interface QRScannerModalProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function QRScannerModal({ onScan, onClose }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"denied" | "notfound" | "other" | null>(null);
  const [scanning, setScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    let detector: any = null;

    const startCamera = async () => {
      try {
        // Request rear camera preferentially (mobile UX)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Use native BarcodeDetector if available (Chrome 83+, Samsung, Edge)
        if ("BarcodeDetector" in window) {
          detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          scanLoop(detector);
        } else {
          // Fallback: try html5-qrcode dynamically if available
          try {
            const { Html5Qrcode } = await import("html5-qrcode");
            const qr = new Html5Qrcode("qr-scanner-container");
            await qr.start(
              { facingMode: "environment" },
              { fps: 10, qrbox: { width: 220, height: 220 } },
              (decodedText: string) => {
                handleSuccessfulScan(decodedText);
                qr.stop().catch(() => {});
              },
              () => {}
            );
            // Store cleanup
            (window as any).__qrInstance = qr;
          } catch {
            setError("Your browser doesn't support QR scanning. Please enter the User ID manually below.");
            setErrorType("other");
            setShowManual(true);
          }
        }
      } catch (err: any) {
        if (err.name === "NotAllowedError") {
          setError(
            "Camera access was denied by the browser. To fix this: open the site lock icon in your URL bar → Site settings → Camera → Allow. If on a local network (not HTTPS), use the device that serves the portal or connect via HTTPS."
          );
          setErrorType("denied");
          setShowManual(true);
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
          setErrorType("notfound");
          setShowManual(true);
        } else {
          setError("Failed to start camera: " + (err.message || "unknown error"));
          setErrorType("other");
          setShowManual(true);
        }
      }
    };

    const scanLoop = async (det: any) => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !scanning) return;
      try {
        const barcodes = await det.detect(videoRef.current);
        if (barcodes.length > 0) {
          handleSuccessfulScan(barcodes[0].rawValue);
          return; // Stop looping after a successful scan
        }
      } catch {}
      animFrameRef.current = requestAnimationFrame(() => scanLoop(det));
    };

    const handleSuccessfulScan = (code: string) => {
      if (lastScanned === code) return; // Debounce same code
      setLastScanned(code);
      setScanning(false);
      stopCamera();
      onScan(code);
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    // Stop html5-qrcode if running
    const qr = (window as any).__qrInstance;
    if (qr) {
      qr.stop().catch(() => {});
      delete (window as any).__qrInstance;
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    stopCamera();
    onScan(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 flex justify-between items-center border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0A9EDE]/10 flex items-center justify-center">
              <Scan size={16} className="text-[#0A9EDE]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900">Scan QR Ticket</h3>
              <p className="text-[10px] text-zinc-400">Point camera at attendee's QR pass</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="p-5 space-y-4">
          {error ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex gap-3">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>

              {errorType === "denied" && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition text-sm font-semibold text-zinc-700 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Retry after granting permission
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Video preview with scanning overlay */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-950 aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />

                {/* Scanning frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 relative">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-[#0A9EDE] rounded-tl-lg border-t-[3px] border-l-[3px]"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-[#0A9EDE] rounded-tr-lg border-t-[3px] border-r-[3px]"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-[#0A9EDE] rounded-bl-lg border-b-[3px] border-l-[3px]"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-[#0A9EDE] rounded-br-lg border-b-[3px] border-r-[3px]"></div>
                    {/* Animated scan line */}
                    <div className="absolute inset-x-2 h-0.5 bg-[#0A9EDE]/70 animate-scan-line top-1/2"></div>
                  </div>
                </div>

                {/* Scanning label */}
                <div className="absolute bottom-3 inset-x-0 flex justify-center">
                  <span className="text-[10px] font-bold text-white/80 bg-black/40 px-3 py-1 rounded-full tracking-wide uppercase flex items-center gap-1.5">
                    <Camera size={11} />
                    Scanning...
                  </span>
                </div>
              </div>

              <p className="text-xs text-center text-zinc-400 leading-relaxed">
                Hold the QR code steady inside the frame. The ticket will be verified automatically.
              </p>
            </>
          )}

          {/* Manual fallback — shown when camera is unavailable */}
          {showManual && (
            <div className="border-t border-zinc-100 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-zinc-500">
                <KeyboardIcon size={13} />
                <p className="text-xs font-semibold">Enter User ID Manually</p>
              </div>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste user UUID here…"
                  className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A9EDE]/40 focus:border-[#0A9EDE]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0A9EDE] text-white text-sm font-bold hover:bg-[#0A9EDE]/90 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Check In
                </button>
              </form>
              <p className="text-[10px] text-zinc-400">
                Ask the attendee to show their Profile QR and manually copy the ID shown below it.
              </p>
            </div>
          )}

          {/* Fallback html5-qrcode container */}
          <div id="qr-scanner-container" className="hidden"></div>
        </div>
      </div>

      {/* Scan line keyframe animation via inline style */}
      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(-60px); opacity: 0.8; }
          50%  { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0.8; }
        }
        .animate-scan-line {
          animation: scanLine 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
