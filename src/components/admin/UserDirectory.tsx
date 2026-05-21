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
  MapPin
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { updateUserAdminRole, adjustUserCoins } from '@/app/admin/actions'

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
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const openRoleModal = (user: DirectoryUser) => {
    setActiveUser(user)
    setTargetRole(user.role)
    setPerms({ ...user.permissions })
    setModalType('role')
    setActionError(null)
    setActionSuccess(null)
  }

  const openCoinModal = (user: DirectoryUser) => {
    setActiveUser(user)
    setCoinAdjustment('')
    setAdjustmentReason('')
    setModalType('coins')
    setActionError(null)
    setActionSuccess(null)
  }

  const closeModal = () => {
    setActiveUser(null)
    setModalType(null)
    setActionError(null)
    setActionSuccess(null)
  }

  const handleRoleUpdate = async () => {
    if (!activeUser) return
    setIsSubmitting(true)
    setActionError(null)

    try {
      const res = await updateUserAdminRole(activeUser.id, targetRole, perms)
      if (res?.error) {
        setActionError(res.error)
      } else {
        setActionSuccess('Role and permissions updated successfully!')
        
        // Update local state
        setUsers(prev => 
          prev.map(u => 
            u.id === activeUser.id 
              ? { ...u, role: targetRole, permissions: targetRole === 'tier-3' ? perms : u.permissions } 
              : u
          )
        )
        
        setTimeout(() => closeModal(), 1500)
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCoinAdjustment = async () => {
    if (!activeUser) return
    const amount = parseInt(coinAdjustment, 10)
    if (isNaN(amount) || amount === 0) {
      setActionError('Please enter a valid non-zero coin amount.')
      return
    }
    if (!adjustmentReason.trim()) {
      setActionError('Adjustment reason is required.')
      return
    }

    setIsSubmitting(true)
    setActionError(null)

    try {
      const res = await adjustUserCoins(activeUser.id, amount, adjustmentReason)
      if (res?.error) {
        setActionError(res.error)
      } else {
        setActionSuccess('Coins ledger entry recorded successfully!')
        
        // Update local state
        setUsers(prev => 
          prev.map(u => 
            u.id === activeUser.id 
              ? { ...u, coins: u.coins + amount } 
              : u
          )
        )
        
        setTimeout(() => closeModal(), 1500)
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter users based on query and role filter
  const filteredUsers = users.filter(user => {
    const query = search.toLowerCase()
    const matchesSearch = 
      user.full_name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query) ||
      user.division.toLowerCase().includes(query)
    
    const matchesRole = 
      roleFilter === 'all' || 
      user.role === roleFilter

    return matchesSearch && matchesRole
  })

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
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative flex items-center">
            <Input 
              placeholder="Search volunteers by name, email, or division..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3.5 text-zinc-400" size={16} />
          </div>

          <div className="w-full md:w-64">
            <Select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="volunteer">Volunteers</option>
              <option value="tier-3">Tier 3 Admins</option>
              <option value="admin">Legacy Admins</option>
              <option value="president">President Admins</option>
              <option value="superadmin">Super Admins</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* USER LIST CARD */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                      No members matched your search.
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
                              user.role === 'superadmin' ? 'bg-zinc-950 text-white' :
                              user.role === 'president' ? 'bg-zinc-900 text-white border-zinc-700' :
                              user.role === 'tier-3' ? 'border-[#0A9EDE] text-[#0A9EDE] bg-[#0A9EDE]/5' : 
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
                            <Button 
                              onClick={() => openCoinModal(user)}
                              variant="outline" 
                              size="sm" 
                              className="h-8 py-0 px-2.5"
                              leftIcon={<Coins size={14} className="text-amber-600" />}
                            >
                              Coins
                            </Button>
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
        </CardContent>
      </Card>

      {/* EDIT ROLE & PERMISSIONS MODAL */}
      {modalType === 'role' && activeUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
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
                  <option value="tier-3">Tier 3 (Customizable Permissions)</option>
                  <option value="admin">Administrator (Legacy Full Admin)</option>
                  <option value="president">President (President Admin)</option>
                  {activeAdminRole === 'superadmin' && (
                    <option value="superadmin">Super Admin (Full System Control)</option>
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
                  </div>
                </div>
              )}

              {actionError && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-lg font-medium">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {actionSuccess && (
                <div className="flex gap-2 p-3 bg-[#0BA242]/10 border border-[#0BA242]/20 text-xs text-[#0BA242] rounded-lg font-medium">
                  <Check size={16} className="shrink-0" />
                  <span>{actionSuccess}</span>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
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

              {actionError && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-lg font-medium">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {actionSuccess && (
                <div className="flex gap-2 p-3 bg-[#0BA242]/10 border border-[#0BA242]/20 text-xs text-[#0BA242] rounded-lg font-medium">
                  <Check size={16} className="shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}
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
