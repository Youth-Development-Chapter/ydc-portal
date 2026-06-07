'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, CameraOff, QrCode, X, RefreshCw, AlertTriangle } from 'lucide-react'

interface QrScannerWidgetProps {
  /** Called when a QR code or barcode value is detected */
  onScan: (value: string) => void
  /** Optional label shown on top */
  label?: string
  /** If true, the scanner is active and will start automatically */
  autoStart?: boolean
}

export default function QrScannerWidget({ onScan, label, autoStart = false }: QrScannerWidgetProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const detectorRef = useRef<any>(null)
  const lastScannedRef = useRef<string | null>(null)
  const lastScannedAtRef = useRef<number>(0)

  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [hasDetectorSupport, setHasDetectorSupport] = useState<boolean | null>(null)

  // Check BarcodeDetector support on mount
  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window
    setHasDetectorSupport(supported)
    if (supported) {
      try {
        detectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39'] })
      } catch {
        setHasDetectorSupport(false)
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsRunning(false)
    setStatus('idle')
  }, [])

  const scanFrame = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const detector = detectorRef.current

    if (!video || !canvas || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) { rafRef.current = requestAnimationFrame(scanFrame); return }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      const barcodes = await detector.detect(canvas)
      if (barcodes && barcodes.length > 0) {
        const value = barcodes[0].rawValue
        const now = Date.now()
        // Debounce: ignore same code within 3 seconds
        if (value && (value !== lastScannedRef.current || now - lastScannedAtRef.current > 3000)) {
          lastScannedRef.current = value
          lastScannedAtRef.current = now
          onScan(value)
        }
      }
    } catch {
      // Silently ignore detection errors (frame not ready, etc.)
    }

    rafRef.current = requestAnimationFrame(scanFrame)
  }, [onScan])

  const startCamera = useCallback(async () => {
    setStatus('starting')
    setErrorMsg(null)
    lastScannedRef.current = null

    if (!hasDetectorSupport) {
      setStatus('error')
      setErrorMsg('Your browser does not support the BarcodeDetector API. Please use Chrome 88+ or Edge 88+.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsRunning(true)
      setStatus('running')

      // Start scanning loop
      rafRef.current = requestAnimationFrame(scanFrame)

    } catch (err: any) {
      stopCamera()
      setStatus('error')
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMsg('Camera access was denied. Please allow camera access in your browser settings and try again.')
      } else if (err?.name === 'NotFoundError') {
        setErrorMsg('No camera found on this device.')
      } else if (err?.name === 'NotReadableError') {
        setErrorMsg('Camera is already in use by another application.')
      } else {
        setErrorMsg(`Camera error: ${err?.message || 'Unknown error'}`)
      }
    }
  }, [hasDetectorSupport, scanFrame, stopCamera])

  // Auto start if requested
  useEffect(() => {
    if (autoStart && hasDetectorSupport !== null) {
      startCamera()
    }
    return () => { stopCamera() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, hasDetectorSupport])

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
      )}

      {/* Camera viewport */}
      <div className="relative bg-zinc-950 rounded-2xl overflow-hidden aspect-video max-h-72 w-full border border-zinc-800 shadow-lg">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isRunning ? 'opacity-100' : 'opacity-0'}`}
          playsInline
          muted
          autoPlay
        />
        {/* Hidden canvas for frame analysis */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Idle/Error overlay */}
        {!isRunning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            {status === 'error' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-red-950/50 border border-red-800 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <p className="text-xs text-center text-red-300 max-w-[240px]">{errorMsg}</p>
                <button
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/50 text-red-200 border border-red-800 text-xs font-semibold hover:bg-red-900 transition-colors"
                >
                  <RefreshCw size={13} />
                  Retry
                </button>
              </>
            ) : status === 'starting' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <Camera size={24} className="text-zinc-400 animate-pulse" />
                </div>
                <p className="text-xs text-zinc-400">Starting camera…</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <QrCode size={24} className="text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-400 text-center max-w-[220px]">
                  Tap "Start Camera" to scan a QR code or ticket barcode.
                </p>
                {hasDetectorSupport === false && (
                  <p className="text-[10px] text-red-400 text-center max-w-[220px]">
                    ⚠ BarcodeDetector not supported in this browser. Use Chrome 88+ or Edge 88+.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Running overlay: scanning indicator */}
        {isRunning && (
          <>
            {/* Scan line animation */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#0A9EDE] to-transparent animate-[scanline_2s_linear_infinite]" style={{ top: '0%', animation: 'scanline 2s linear infinite' }} />
            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#0A9EDE] rounded-tl-sm" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#0A9EDE] rounded-tr-sm" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#0A9EDE] rounded-bl-sm" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#0A9EDE] rounded-br-sm" />
          </>
        )}
      </div>

      {/* Control button */}
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={startCamera}
            disabled={status === 'starting' || hasDetectorSupport === false}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A9EDE] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0A9EDE]/90 transition-colors"
          >
            <Camera size={16} />
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
          >
            <CameraOff size={16} />
            Stop Camera
          </button>
        )}
      </div>

      {/* Inject scanline keyframe */}
      <style>{`
        @keyframes scanline {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  )
}
