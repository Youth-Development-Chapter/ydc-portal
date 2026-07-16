'use client'

import React, { useState, useEffect } from 'react'
import { 
  MessageSquare, RefreshCw, LogOut, ShieldAlert, CheckCircle, 
  XCircle, Loader2, Save, Users, HelpCircle, PhoneCall, Info,
  Terminal
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateSystemSetting, getWhatsAppStatus, restartWhatsAppBotAction, logoutWhatsAppBotAction, getWhatsAppLogs } from '@/app/admin/actions'
import { toast } from 'sonner'

interface SettingItem {
  key: string
  value: string
}

interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'qr' | 'connected'
  qr?: string
  error?: string
  phoneNumber?: string
  updatedAt?: string
}

export default function WhatsAppManager({
  initialSettings,
  initialStatus,
}: {
  initialSettings: SettingItem[]
  initialStatus: WhatsAppStatus
}) {
  const [status, setStatus] = useState<WhatsAppStatus>(initialStatus)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Terminal logs state
  const [logs, setLogs] = useState<any[]>([])
  const terminalRef = React.useRef<HTMLDivElement>(null)

  const fetchLogs = async () => {
    try {
      const res = await getWhatsAppLogs()
      if (res.success && res.logs) {
        setLogs(res.logs)
      }
    } catch (e) {
      // silent fail
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  // Local state for configuration
  const [agentEnabled, setAgentEnabled] = useState<boolean>(() => {
    const setting = initialSettings.find((s) => s.key === 'whatsapp_agent_enabled')
    return setting ? setting.value === 'true' : true
  })

  const [authorizedNumbers, setAuthorizedNumbers] = useState<string>(() => {
    const setting = initialSettings.find((s) => s.key === 'whatsapp_authorized_numbers')
    return setting ? setting.value : ''
  })

  const [authorizedRoles, setAuthorizedRoles] = useState<string[]>(() => {
    const setting = initialSettings.find((s) => s.key === 'whatsapp_authorized_roles')
    return setting ? setting.value.split(',').map(r => r.trim()).filter(Boolean) : ['superadmin']
  })

  // Periodically refresh the status when connecting or showing QR code
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status.status === 'connecting' || status.status === 'qr') {
      interval = setInterval(() => {
        refreshStatus(true)
      }, 4000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status.status])

  const refreshStatus = async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const res = await getWhatsAppStatus()
      if (res.success && res.status) {
        setStatus(res.status)
        if (!silent) toast.success('Connection status updated.')
      } else {
        if (!silent) toast.error(res.error || 'Failed to fetch status.')
      }
    } catch (err) {
      if (!silent) toast.error('Error fetching connection status.')
    } finally {
      if (!silent) setIsRefreshing(false)
    }
  }

  const handleRestartBot = async () => {
    if (isRestarting) return
    setIsRestarting(true)
    toast.info('Restarting WhatsApp connection agent...')
    try {
      const res = await restartWhatsAppBotAction()
      if (res.success) {
        toast.success('Restart signal sent successfully. Reconnecting...')
        // Fetch status immediately
        await refreshStatus(true)
      } else {
        toast.error(res.error || 'Failed to restart agent.')
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsRestarting(false)
    }
  }

  const handleLogoutBot = async () => {
    if (isLoggingOut) return
    if (!confirm('Are you sure you want to log out the WhatsApp bot and clear its credentials? You will need to scan a new QR code to reconnect.')) {
      return
    }
    setIsLoggingOut(true)
    toast.info('Logging out and clearing session data...')
    try {
      const res = await logoutWhatsAppBotAction()
      if (res.success) {
        toast.success('Bot logged out successfully. Generating new QR code...')
        // Fetch status immediately
        await refreshStatus(true)
      } else {
        toast.error(res.error || 'Failed to log out bot.')
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    try {
      const res1 = await updateSystemSetting('whatsapp_agent_enabled', String(agentEnabled))
      const res2 = await updateSystemSetting('whatsapp_authorized_numbers', authorizedNumbers)
      const res3 = await updateSystemSetting('whatsapp_authorized_roles', authorizedRoles.join(','))

      if (res1.error || res2.error || res3.error) {
        toast.error(res1.error || res2.error || res3.error || 'Failed to save settings.')
      } else {
        toast.success('WhatsApp agent configurations saved successfully.')
      }
    } catch (err) {
      toast.error('An error occurred while saving settings.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleRoleToggle = (role: string) => {
    if (authorizedRoles.includes(role)) {
      setAuthorizedRoles(authorizedRoles.filter((r) => r !== role))
    } else {
      setAuthorizedRoles([...authorizedRoles, role])
    }
  }

  // Generate status badge color and text
  const getStatusBadge = () => {
    switch (status.status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-bold shadow-sm">
            <CheckCircle size={14} className="animate-pulse" />
            Connected
          </span>
        )
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold shadow-sm animate-pulse">
            <Loader2 size={14} className="animate-spin" />
            Connecting
          </span>
        )
      case 'qr':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold shadow-sm animate-pulse">
            <RefreshCw size={14} className="animate-spin" />
            Scan QR Code
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-full text-xs font-bold shadow-sm">
            <XCircle size={14} />
            Disconnected
          </span>
        )
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* LEFT COLUMN: CONNECTION STATUS & QR */}
      <div className="md:col-span-1 space-y-6">
        <Card className="shadow-lg border border-zinc-200 overflow-hidden">
          <CardHeader className="bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <MessageSquare size={18} className="text-zinc-600" />
              Bot Connection
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refreshStatus(false)}
              disabled={isRefreshing}
              className="h-8 px-2"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <span className="text-sm font-semibold text-zinc-500">Status</span>
              {getStatusBadge()}
            </div>

            {status.phoneNumber && (
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <span className="text-sm font-semibold text-zinc-500">Linked Phone</span>
                <span className="text-sm font-bold text-zinc-800 font-mono">
                  {status.phoneNumber}
                </span>
              </div>
            )}

            {status.updatedAt && (
              <div className="text-[11px] text-zinc-400 text-right">
                Last updated: {new Date(status.updatedAt).toLocaleTimeString()}
              </div>
            )}

            {/* QR Code display */}
            {status.status === 'qr' && status.qr && (
              <div className="mt-4 flex flex-col items-center justify-center p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-xs text-zinc-500 font-semibold mb-3 text-center">
                  Open WhatsApp on your phone &gt; Settings &gt; Linked Devices &gt; Scan QR code.
                </p>
                <div className="relative p-3 bg-white rounded-xl border border-zinc-200 shadow-sm w-48 h-48 flex items-center justify-center">
                  <QRCode
                    value={status.qr}
                    size={160}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
              </div>
            )}

            {status.status === 'disconnected' && status.error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>{status.error}</span>
              </div>
            )}

            <div className="pt-4 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRestartBot}
                disabled={isRestarting || isRefreshing}
                className="w-full text-xs font-semibold"
              >
                {isRestarting ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-1" />
                    Restarting
                  </>
                ) : (
                  'Restart Agent'
                )}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleLogoutBot}
                disabled={isLoggingOut || isRefreshing}
                className="w-full text-xs font-semibold bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-1" />
                    Logging Out
                  </>
                ) : (
                  <>
                    <LogOut size={12} className="mr-1" />
                    Unlink Device
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* HELP & INSTRUCTIONS */}
        <Card className="shadow-lg border border-zinc-200">
          <CardContent className="pt-6 space-y-3.5 text-xs text-zinc-600">
            <h4 className="font-bold text-zinc-800 flex items-center gap-1.5">
              <HelpCircle size={16} className="text-[#0A9EDE]" />
              Agent Controls Guide
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 leading-relaxed font-semibold">
              <li>
                <strong className="text-zinc-800">Connection State:</strong> If the bot gets stuck in <span className="text-amber-600 font-bold">Connecting</span>, click <em>Restart Agent</em>.
              </li>
              <li>
                <strong className="text-zinc-800">Unlinking:</strong> Click <em>Unlink Device</em> to delete credentials on the server and trigger a brand new QR scan.
              </li>
              <li>
                <strong className="text-zinc-800">Live Sync:</strong> This page automatically updates every few seconds while waiting for authorization or a QR scan.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: SETTINGS FORM */}
      <div className="md:col-span-2">
        <form onSubmit={handleSaveSettings}>
          <Card className="shadow-lg border border-zinc-200 h-full">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 py-4">
              <CardTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Info size={18} className="text-zinc-600" />
                WhatsApp Agent Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Enable / Disable toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-150">
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-zinc-800">Enable Agent Responses</label>
                  <p className="text-xs text-zinc-500 font-medium">
                    When active, the AI agent will respond to messages received on the connected number.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAgentEnabled(!agentEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    agentEnabled ? 'bg-[#0BA242]' : 'bg-zinc-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      agentEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Authorized Roles */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-850 flex items-center gap-1.5">
                  <Users size={16} className="text-zinc-500" />
                  Authorized Roles
                </label>
                <p className="text-xs text-zinc-500 font-medium">
                  Select which user roles are authorized to query and run database commands via WhatsApp.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {['superadmin', 'admin', 'president', 'tier-3', 'volunteer'].map((role) => {
                    const isChecked = authorizedRoles.includes(role)
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleToggle(role)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all ${
                          isChecked
                            ? 'bg-[#0BA242]/5 border-[#0BA242] text-[#0BA242]'
                            : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-[#0BA242] border-[#0BA242] text-white' : 'border-zinc-350'
                        }`}>
                          {isChecked && '✓'}
                        </span>
                        <span className="capitalize">{role === 'tier-3' ? 'Tier 3' : role}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Authorized Numbers */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-850 flex items-center gap-1.5">
                  <PhoneCall size={16} className="text-zinc-500" />
                  Authorized Phone Numbers
                </label>
                <p className="text-xs text-zinc-500 font-medium font-sans">
                  Add specific phone numbers that can access the agent (even if they don't have matching admin roles). 
                  Separate multiple numbers with commas. Formatting: e.g. <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-[10px] text-zinc-800">+923001234567, +923119876543</code>.
                </p>
                <textarea
                  id="authorized_numbers"
                  name="authorized_numbers"
                  rows={4}
                  value={authorizedNumbers}
                  onChange={(e) => setAuthorizedNumbers(e.target.value)}
                  placeholder="+923001234567, +923120000000"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm placeholder-zinc-400 focus:border-[#0BA242] focus:ring-1 focus:ring-[#0BA242] focus:outline-none min-h-[100px] font-mono leading-relaxed"
                />
              </div>

              {/* Submit / Save action */}
              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingSettings}
                  className="bg-[#0BA242] hover:bg-[#098235] text-white font-bold text-xs h-10 px-6 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving Settings...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Configurations
                    </>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>
        </form>

        {/* TERMINAL BOT LOGS */}
        <Card className="shadow-lg border border-zinc-200 mt-6 overflow-hidden">
          <CardHeader className="bg-zinc-950 border-b border-zinc-800 flex flex-row items-center justify-between py-3 px-6">
            <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span className="ml-1 text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Terminal size={12} className="text-zinc-500" />
                whatsapp-agent-terminal.log
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLogs([])}
                className="h-6 px-2 border-zinc-850 bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-white text-[10px] font-mono rounded"
              >
                Clear Screen
              </Button>
            </div>
          </CardHeader>
          <div ref={terminalRef} className="bg-zinc-950 p-6 font-mono text-xs leading-relaxed overflow-y-auto h-[250px] text-zinc-300 select-text">
            {logs.length === 0 ? (
              <div className="text-zinc-650 text-center py-16 font-sans">
                No logs recorded yet. Bot events will display here in real-time.
              </div>
            ) : (
              <div className="space-y-1.5">
                {logs.map((log, idx) => {
                  let levelColor = 'text-blue-400'
                  if (log.level === 'error') levelColor = 'text-red-400 font-bold'
                  if (log.level === 'warn') levelColor = 'text-amber-400 font-bold'
                  if (log.level === 'success') levelColor = 'text-green-400 font-bold'

                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-zinc-600 shrink-0 select-none">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`${levelColor} shrink-0 select-none`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="break-all whitespace-pre-wrap">{log.message}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
