'use client'

import React, { useState } from 'react'
import { 
  Search, 
  UserCog, 
  Coins, 
  Flame, 
  Check, 
  X, 
  Key, 
  Shield, 
  AlertTriangle,
  GraduationCap,
  MapPin,
  Download
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { updateUserAdminRole, adjustUserCoins } from '@/app/admin/actions'
import { toast } from 'sonner'

interface GranularPermissions {
  can_scan_tickets: boolean
  can_approve_deeds: boolean
  can_manage_events: boolean
  can_manage_courses: boolean
  can_manage_settings: boolean
  can_manage_admins: boolean
}

interface DirectoryUser {
  id: string
  full_name: string
  email: string
  role: string
  division: string
  qualification: string
  created_at: string
  coins: number
  streak: { current: number; longest: number }
  permissions: GranularPermissions
}

export default function UserDirectory({
  initialUsers,
  activeAdminId,
  activeAdminRole,
}: {
  initialUsers: DirectoryUser[]
  activeAdminId: string
  activeAdminRole: string
}) {
  const [users, setUsers] = useState<DirectoryUser[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [divisionFilter, setDivisionFilter] = useState('all')
  const [qualificationFilter, setQualificationFilter] = useState('all')

  // Generate unique filter options dynamically from user list
  const uniqueDivisions = Array.from(new Set(initialUsers.map(u => u.division).filter(Boolean))).sort()
  const uniqueQualifications = Array.from(new Set(initialUsers.map(u => u.qualification).filter(Boolean))).sort()

  // Modals state
  const [activeUser, setActiveUser] = useState<DirectoryUser | null>(null)
  const [modalType, setModalType] = useState<'role' | 'coins' | null>(null)

  // Form states
  const [targetRole, setTargetRole] = useState<string>('volunteer')
  const [perms, setPerms] = useState<GranularPermissions>({
    can_scan_tickets: false,
    can_approve_deeds: false,
    can_manage_events: false,
    can_manage_courses: false,
    can_manage_settings: false,
    can_manage_admins: false,
  })
  
  const [coinAdjustment, setCoinAdjustment] = useState<string>('')
  const [adjustmentReason, setAdjustmentReason] = useState<string>('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openRoleModal = (user: DirectoryUser) => {
    setActiveUser(user)
    setTargetRole(user.role)
    if (activeAdminRole === 'president') {
      setPerms({
        can_scan_tickets: user.permissions.can_scan_tickets,
        can_approve_deeds: false,
        can_manage_events: false,
        can_manage_courses: false,
        can_manage_settings: false,
        can_manage_admins: false,
      })
    } else {
      setPerms({ ...user.permissions })
    }
    setModalType('role')
  }

  const openCoinModal = (user: DirectoryUser) => {
    setActiveUser(user)
    setCoinAdjustment('')
    setAdjustmentReason('')
    setModalType('coins')
  }

  const closeModal = () => {
    setActiveUser(null)
    setModalType(null)
  }

  const handleRoleUpdate = async () => {
    if (!activeUser) return
    setIsSubmitting(true)

    try {
      const res = await updateUserAdminRole(activeUser.id, targetRole, perms)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Role and permissions updated for ${activeUser.full_name}!`)
        
        // Update local state
        setUsers(prev => 
          prev.map(u => 
            u.id === activeUser.id 
              ? { ...u, role: targetRole, permissions: targetRole === 'tier-3' ? perms : u.permissions } 
              : u
          )
        )
        
        closeModal()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCoinAdjustment = async () => {
    if (!activeUser) return
    const amount = parseInt(coinAdjustment, 10)
    if (isNaN(amount) || amount === 0) {
      toast.error('Please enter a valid non-zero coin amount.')
      return
    }
    if (!adjustmentReason.trim()) {
      toast.error('Adjustment reason is required.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await adjustUserCoins(activeUser.id, amount, adjustmentReason)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Adjusted balance by ${amount > 0 ? '+' : ''}${amount} coins for ${activeUser.full_name}!`)
        
        // Update local state
        setUsers(prev => 
          prev.map(u => 
            u.id === activeUser.id 
              ? { ...u, coins: u.coins + amount } 
              : u
          )
        )
        
        closeModal()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter users based on query, role, division, and qualification filters
  const filteredUsers = users.filter(user => {
    const query = search.toLowerCase()
    const matchesSearch = 
      user.full_name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query) ||
      user.division.toLowerCase().includes(query) ||
      user.qualification.toLowerCase().includes(query)
    
    const matchesRole = 
      roleFilter === 'all' || 
      user.role === roleFilter

    const matchesDivision = 
      divisionFilter === 'all' || 
      user.division === divisionFilter

    const matchesQualification = 
      qualificationFilter === 'all' || 
      user.qualification === qualificationFilter

    return matchesSearch && matchesRole && matchesDivision && matchesQualification
  })

  // CSV Export logic
  const exportToCsv = () => {
    const headers = ['Full Name', 'Email', 'Role', 'Division', 'Qualification', 'Coins Balance', 'Current Streak', 'Longest Streak', 'Registration Date']
    
    const rows = filteredUsers.map(user => [
      user.full_name,
      user.email,
      roleLabels[user.role] || user.role,
      user.division,
      user.qualification,
      user.coins,
      user.streak.current,
      user.streak.longest,
      new Date(user.created_at).toLocaleDateString('en-US')
    ])
    
    const formatValue = (val: any) => {
      const stringVal = String(val === null || val === undefined ? '' : val)
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`
      }
      return stringVal
    }
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(formatValue).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const today = new Date().toISOString().split('T')[0]
    
    link.setAttribute('href', url)
    link.setAttribute('download', `ydc_members_export_${today}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success(`Successfully exported ${filteredUsers.length} member records!`)
  }

  // Role labels
  const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    president: 'President Admin',
    'tier-3': 'Tier 3 Admin',
    admin: 'Administrator',
    volunteer: 'Volunteer'
  }

  return (
    <div className="space-y-6">
      {/* SEARCH AND FILTERS CARD */}
      <Card className="shadow-sm bg-white">
        <CardContent className="p-4 space-y-4">
          {/* Main search and export button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative flex items-center">
              <Input 
                placeholder="Search volunteers by name, email, division, or education..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 w-full"
              />
              <Search className="absolute left-3.5 text-zinc-400" size={16} />
            </div>

            <Button
              onClick={exportToCsv}
              variant="outline"
              className="h-10 border-zinc-200 hover:bg-zinc-50 font-bold shrink-0 w-full sm:w-auto"
              leftIcon={<Download size={16} />}
              disabled={filteredUsers.length === 0}
            >
              Export Excel
            </Button>
          </div>

          {/* Granular Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Role Filter */}
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Role</span>
              <Select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="all">All Roles</option>
                <option value="volunteer">Volunteers</option>
                <option value="tier-3">Tier 3 Admins</option>
                <option value="admin">Legacy Admins</option>
                <option value="president">President Admins</option>
                <option value="superadmin">Super Admins</option>
              </Select>
            </div>

            {/* Division Filter */}
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Division</span>
              <Select 
                value={divisionFilter}
                onChange={(e) => setDivisionFilter(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="all">All Divisions</option>
                {uniqueDivisions.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </Select>
            </div>

            {/* Education/Qualification Filter */}
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Education</span>
              <Select 
                value={qualificationFilter}
                onChange={(e) => setQualificationFilter(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="all">All Education Levels</option>
                {uniqueQualifications.map(qual => (
                  <option key={qual} value={qual}>{qual}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USER LIST CARD */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  <th className="p-5">Name & Division</th>
                  <th className="p-5">Role</th>
                  <th className="p-5 text-center">Coins</th>
                  <th className="p-5 text-center">Streak</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-zinc-400">
                      No members matched your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === activeAdminId
                    return (
                      <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-5">
                          <div>
                            <span className="font-bold text-zinc-900 block">{user.full_name}</span>
                            <span className="text-xs text-zinc-400">{user.email}</span>
                            <div className="flex gap-2 mt-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500">
                                <MapPin size={10} className="text-zinc-400" />
                                {user.division}
                              </span>
                              <span className="text-zinc-200">|</span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500">
                                <GraduationCap size={10} className="text-zinc-400" />
                                {user.qualification}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <Badge 
                            variant={
                              user.role === 'superadmin' ? 'inverse' :
                              user.role === 'president' ? 'inverse' :
                              user.role === 'tier-3' ? 'outline' : 'default'
                            }
                            className={
                              user.role === 'superadmin' ? 'bg-[#DD0408] border-[#DD0408] text-white' :
                              user.role === 'president' ? 'bg-[#0A9EDE] border-[#0A9EDE] text-white' :
                              user.role === 'tier-3' ? 'border-[#0BA242] text-[#0BA242] bg-[#0BA242]/5' : 
                              'bg-zinc-100 text-zinc-700'
                            }
                          >
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </td>
                        <td className="p-5 text-center font-bold font-mono text-zinc-800">
                          {user.coins} C
                        </td>
                        <td className="p-5 text-center">
                          <div className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full shrink-0">
                            <Flame size={12} className="text-orange-500 fill-orange-500" />
                            <span className="font-extrabold text-xs text-orange-600">
                              {user.streak.current}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            Max: {user.streak.longest}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <div className="inline-flex gap-2">
                            {(activeAdminRole === 'superadmin' || activeAdminRole === 'admin') && (
                              <Button 
                                onClick={() => openCoinModal(user)}
                                variant="outline" 
                                size="sm" 
                                className="h-8 py-0 px-2.5"
                                leftIcon={<Coins size={14} className="text-amber-600" />}
                              >
                                Coins
                              </Button>
                            )}
                            <Button 
                              onClick={() => openRoleModal(user)}
                              variant="outline" 
                              size="sm"
                              className="h-8 py-0 px-2.5"
                              disabled={isSelf}
                              leftIcon={<UserCog size={14} />}
                            >
                              Role
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="block md:hidden divide-y divide-zinc-150">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-sm text-zinc-400">
                No members matched your filters.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = user.id === activeAdminId
                return (
                  <div key={user.id} className="p-4 space-y-3 bg-white hover:bg-zinc-50/50 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-zinc-950 text-sm block truncate">{user.full_name}</span>
                        <span className="text-xs text-zinc-400 block truncate font-mono">{user.email}</span>
                      </div>
                      <Badge 
                        variant={
                          user.role === 'superadmin' ? 'inverse' :
                          user.role === 'president' ? 'inverse' :
                          user.role === 'tier-3' ? 'outline' : 'default'
                        }
                        className={
                          user.role === 'superadmin' ? 'bg-[#DD0408] border-[#DD0408] text-white text-[9px] px-2 py-0.5 shrink-0' :
                          user.role === 'president' ? 'bg-[#0A9EDE] border-[#0A9EDE] text-white text-[9px] px-2 py-0.5 shrink-0' :
                          user.role === 'tier-3' ? 'border-[#0BA242] text-[#0BA242] bg-[#0BA242]/5 text-[9px] px-2 py-0.5 shrink-0' : 
                          'bg-zinc-100 text-zinc-700 text-[9px] px-2 py-0.5 shrink-0'
                        }
                      >
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-zinc-400" />
                        <span>{user.division}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GraduationCap size={12} className="text-zinc-400" />
                        <span className="truncate max-w-[150px]">{user.qualification}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xs text-zinc-800 bg-zinc-100 px-2 py-1 rounded">
                          {user.coins} C
                        </span>
                        <div className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                          <Flame size={10} className="text-orange-500 fill-orange-500" />
                          <span className="font-extrabold text-[10px] text-orange-600">
                            {user.streak.current}d <span className="font-normal text-zinc-400">({user.streak.longest} max)</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {(activeAdminRole === 'superadmin' || activeAdminRole === 'admin') && (
                          <Button 
                            onClick={() => openCoinModal(user)}
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs px-2.5"
                            leftIcon={<Coins size={12} className="text-amber-600" />}
                          >
                            Coins
                          </Button>
                        )}
                        <Button 
                          onClick={() => openRoleModal(user)}
                          variant="outline" 
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          disabled={isSelf}
                          leftIcon={<UserCog size={12} />}
                        >
                          Role
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* EDIT ROLE & PERMISSIONS MODAL */}
      {modalType === 'role' && activeUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
                <Shield size={18} className="text-zinc-950" />
                Manage Account Role
              </h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Volunteer Profile</span>
                <span className="font-bold text-zinc-900">{activeUser.full_name}</span>
                <span className="text-xs text-zinc-500 block">{activeUser.email}</span>
              </div>

              {/* Role Select */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Administrative Role</label>
                <Select 
                  value={targetRole} 
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="volunteer">Volunteer (Default Member)</option>
                  <option value="tier-3">Event Scanner (Tier 3 Admin)</option>
                  {activeAdminRole !== 'president' && (
                    <>
                      <option value="admin">Administrator (Legacy Full Admin)</option>
                      <option value="president">President (President Admin)</option>
                      {activeAdminRole === 'superadmin' && (
                        <option value="superadmin">Super Admin (Full System Control)</option>
                      )}
                    </>
                  )}
                </Select>
              </div>

              {/* Tier 3 Granular Toggles */}
              {targetRole === 'tier-3' && (
                <div className="space-y-4 pt-4 border-t border-zinc-150">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold uppercase tracking-wider">
                    <Key size={14} className="text-[#0A9EDE]" />
                    <span>Assign Granular Permissions</span>
                  </div>

                  <div className="space-y-3 bg-zinc-50 border border-zinc-150 rounded-xl p-4">
                    {activeAdminRole !== 'president' ? (
                      <>
                        <Switch 
                          label="Ticket Scanning (Event check-ins)" 
                          checked={perms.can_scan_tickets}
                          onChange={(checked) => setPerms(prev => ({ ...prev, can_scan_tickets: checked }))}
                        />
                        <Switch 
                          label="Deed & Streak Approvals (+ bonus points)" 
                          checked={perms.can_approve_deeds}
                          onChange={(checked) => setPerms(prev => ({ ...prev, can_approve_deeds: checked }))}
                        />
                        <Switch 
                          label="Manage Events (Create, Edit events)" 
                          checked={perms.can_manage_events}
                          onChange={(checked) => setPerms(prev => ({ ...prev, can_manage_events: checked }))}
                        />
                        <Switch 
                          label="Manage Courses (LMS completions rewards)" 
                          checked={perms.can_manage_courses}
                          onChange={(checked) => setPerms(prev => ({ ...prev, can_manage_courses: checked }))}
                        />
                        <Switch 
                          label="Manage Settings (Global reward configuration)" 
                          checked={perms.can_manage_settings}
                          onChange={(checked) => setPerms(prev => ({ ...prev, can_manage_settings: checked }))}
                        />
                        <Switch 
                          label="Manage Admins (Edit roles/permissions)" 
                          checked={perms.can_manage_admins}
                          onChange={(checked) => setPerms(prev => ({ ...prev, can_manage_admins: checked }))}
                        />
                      </>
                    ) : (
                      <div className="space-y-1">
                        <Switch 
                          label="Ticket Scanning (Event check-ins)" 
                          checked={perms.can_scan_tickets}
                          onChange={(checked) => setPerms(prev => ({
                            can_scan_tickets: checked,
                            can_approve_deeds: false,
                            can_manage_events: false,
                            can_manage_courses: false,
                            can_manage_settings: false,
                            can_manage_admins: false
                          }))}
                        />
                        <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                          Presidents can only assign the Ticket Scanning permission to Event Scanners.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-150 bg-zinc-50 flex justify-end gap-3">
              <Button onClick={closeModal} variant="outline" size="sm">
                Cancel
              </Button>
              <Button 
                onClick={handleRoleUpdate}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="bg-zinc-900 border-zinc-900 hover:bg-black text-white"
                size="sm"
              >
                Save Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADJUST COINS MODAL */}
      {modalType === 'coins' && activeUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
                <Coins size={18} className="text-amber-500" />
                Manual Coin Adjustment
              </h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Volunteer Profile</span>
                <span className="font-bold text-zinc-900">{activeUser.full_name}</span>
                <p className="text-xs text-zinc-400 font-medium">Current Balance: <span className="text-zinc-900 font-bold font-mono">{activeUser.coins} C</span></p>
              </div>

              {/* Adjustment amount */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Adjustment Amount</label>
                <Input 
                  type="number"
                  placeholder="e.g. 50 (grant) or -30 (revoke)"
                  value={coinAdjustment}
                  onChange={(e) => setCoinAdjustment(e.target.value)}
                  required
                />
                <p className="text-[10px] text-zinc-400 font-medium">
                  Enter a positive number to credit coins, or a negative number to subtract coins.
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Adjustment Reason (Required)</label>
                <textarea
                  placeholder="Explain why this manual adjustment is being made (e.g. reward for outstanding participation in youth camp)."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  rows={3}
                  className="w-full text-sm p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-150 bg-zinc-50 flex justify-end gap-3">
              <Button onClick={closeModal} variant="outline" size="sm">
                Cancel
              </Button>
              <Button 
                onClick={handleCoinAdjustment}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="bg-[#0BA242] hover:bg-[#0BA242]/90 border-[#0BA242] text-white"
                size="sm"
              >
                Confirm Adjustment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
