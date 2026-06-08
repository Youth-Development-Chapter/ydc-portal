'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, CameraOff, QrCode, RefreshCw, AlertTriangle } from 'lucide-react'
import jsQR from 'jsqr'

interface BarcodeDetector {
  detect(image: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageData): Promise<Array<{ rawValue: string }>>
}

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
  const detectorRef = useRef<BarcodeDetector | null>(null)
  const lastScannedRef = useRef<string | null>(null)
  const lastScannedAtRef = useRef<number>(0)

  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Instantiate BarcodeDetector if natively supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => BarcodeDetector }).BarcodeDetector
        detectorRef.current = new BarcodeDetectorClass({ formats: ['qr_code', 'code_128', 'code_39'] })
      } catch {
        detectorRef.current = null
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

  // Create a ref for scanFrame to avoid "used before declaration" typescript/linter error
  const scanFrameRef = useRef<() => void>(() => {})

  const scanFrame = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const detector = detectorRef.current

    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrameRef.current)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      rafRef.current = requestAnimationFrame(scanFrameRef.current)
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    let valueDetected = false

    if (detector) {
      try {
        const barcodes = await detector.detect(canvas)
        if (barcodes && barcodes.length > 0) {
          const value = barcodes[0].rawValue
          if (value) {
            const now = Date.now()
            if (value !== lastScannedRef.current || now - lastScannedAtRef.current > 3000) {
              lastScannedRef.current = value
              lastScannedAtRef.current = now
              onScan(value)
            }
            valueDetected = true
          }
        }
      } catch {
        // Silently ignore detection errors
      }
    }

    // Fallback to jsQR if native detector is not supported or didn't find anything
    if (!valueDetected) {
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code && code.data) {
          const value = code.data
          const now = Date.now()
          if (value !== lastScannedRef.current || now - lastScannedAtRef.current > 3000) {
            lastScannedRef.current = value
            lastScannedAtRef.current = now
            onScan(value)
          }
        }
      } catch {
        // Silently ignore jsQR errors
      }
    }

    rafRef.current = requestAnimationFrame(scanFrameRef.current)
  }, [onScan])

  // Update ref current so callbacks reference the latest memoized function
  useEffect(() => {
    scanFrameRef.current = scanFrame
  }, [scanFrame])

  const diagnoseCameraError = useCallback(async (err: unknown) => {
    stopCamera()
    setStatus('error')
    const error = err as { name?: string; message?: string }
    let diagnosticTip = ''

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')
        if (videoDevices.length === 0) {
          diagnosticTip = ' (No camera devices detected. Is your camera plugged in or enabled?)'
        } else {
          const hasLabels = videoDevices.some(d => d.label !== '')
          if (hasLabels) {
            diagnosticTip = ' (The browser has permission, but the camera is in use by another app like Zoom/OBS/Discord, or disabled by a hardware switch or laptop hotkey).'
          } else {
            diagnosticTip = ' (The browser site permission may be blocked. Please check your address bar permission icon or try resetting site permissions).'
          }
        }
      }
    } catch {
      // ignore
    }

    const details = ` (${error?.name || 'UnknownError'}: ${error?.message || 'No details'})${diagnosticTip}`
    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      setErrorMsg(`Camera access was denied. Please allow camera access in your browser settings and try again.${details}`)
    } else if (error?.name === 'NotFoundError') {
      setErrorMsg(`No camera found on this device.${details}`)
    } else if (error?.name === 'NotReadableError') {
      setErrorMsg(`Camera is already in use by another application.${details}`)
    } else {
      setErrorMsg(`Camera error: ${error?.message || 'Unknown error'}${details}`)
    }
  }, [stopCamera])

  const startCamera = useCallback(async () => {
    setStatus('starting')
    setErrorMsg(null)
    lastScannedRef.current = null

    if (typeof window === 'undefined') return

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      stopCamera()
      setStatus('error')
      setErrorMsg('Camera access is unavailable. Your browser requires a secure context (HTTPS or localhost) to use the camera.')
      return
    }

    let stream: MediaStream
    try {
      // Try with high-quality and back-facing camera preferences first
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      })
    } catch (firstErr) {
      console.warn('Initial camera constraints failed, retrying with basic settings...', firstErr)
      try {
        // Fallback to basic unconstrained video
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      } catch (err: unknown) {
        await diagnoseCameraError(err)
        return
      }
    }

    try {
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (playErr) {
          console.warn('Programmatic video.play() failed, relying on autoplay attribute:', playErr)
        }
      }

      setIsRunning(true)
      setStatus('running')

      // Start scanning loop
      rafRef.current = requestAnimationFrame(scanFrameRef.current)

    } catch (err: unknown) {
      await diagnoseCameraError(err)
    }
  }, [diagnoseCameraError, stopCamera])

  // Auto start if requested (deferred to avoid synchronous state updates in effect)
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => {
        startCamera()
      }, 0)
      return () => {
        clearTimeout(timer)
        stopCamera()
      }
    }
    return () => { stopCamera() }
  }, [autoStart, startCamera, stopCamera])

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
                  Tap &quot;Start Camera&quot; to scan a QR code or ticket barcode.
                </p>
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
            disabled={status === 'starting'}
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
