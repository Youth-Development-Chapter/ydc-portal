'use client'

import React, { useState, useTransition } from 'react'
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
  Download,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Map,
  Edit3,
  Save,
  Trash2,
  BookOpen,
  Award,
  Clock,
  User,
  Plus,
  Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { 
  updateUserAdminRole, 
  adjustUserCoins, 
  getUserFullHistory, 
  updateUserProfileAdmin, 
  deleteUserProfile 
} from '@/app/admin/actions'
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
  unit_name: string
  unit_id: string
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
  adminUnitId,
  allUnits = [],
}: {
  initialUsers: DirectoryUser[]
  activeAdminId: string
  activeAdminRole: string
  adminUnitId?: string
  allUnits?: { id: string; name: string }[]
}) {
  const [users, setUsers] = useState<DirectoryUser[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState('all')
  const [qualificationFilter, setQualificationFilter] = useState('all')

  // Selected user detailed state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [isPendingHistory, startHistoryTransition] = useTransition()
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    father_name: '',
    dob: '',
    whatsapp: '',
    phone: '',
    unit_id: '',
    qualification: '',
    address: ''
  })

  // Generate unique filter options dynamically from user list
  const uniqueUnits = Array.from(new Set(initialUsers.map(u => u.unit_name).filter(Boolean))).sort()
  const uniqueQualifications = Array.from(new Set(initialUsers.map(u => u.qualification).filter(Boolean))).sort()

  // Modals state
  const [activeUser, setActiveUser] = useState<DirectoryUser | null>(null)
  const [modalType, setModalType] = useState<'role' | 'coins' | 'add_user' | 'delete_user' | null>(null)

  // Form states for quick actions
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

  // Fetch full details of a user
  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId)
    setDetailData(null)
    setIsEditingProfile(false)

    startHistoryTransition(async () => {
      try {
        const res = await getUserFullHistory(userId)
        if ('error' in res && res.error) {
          toast.error(res.error)
          setSelectedUserId(null)
        } else if ('data' in res && res.data) {
          setDetailData(res.data)
          // Populate profile edit form
          const prof = res.data.profile
          setProfileForm({
            father_name: prof.father_name || '',
            dob: prof.dob || '',
            whatsapp: prof.whatsapp || '',
            phone: prof.phone || '',
            unit_id: prof.unit_id || '',
            qualification: prof.qualification || '',
            address: prof.address || ''
          })
        }
      } catch (err) {
        toast.error('Failed to load user detailed history.')
        setSelectedUserId(null)
      }
    })
  }

  // Open modals
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

  const openDeleteModal = (user: DirectoryUser) => {
    setActiveUser(user)
    setModalType('delete_user')
  }

  const closeModal = () => {
    setActiveUser(null)
    setModalType(null)
  }

  // Update administrative roles
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
        // If we are looking at detail, sync
        if (detailData && detailData.profile.id === activeUser.id) {
          setDetailData((prev: any) => ({
            ...prev,
            profile: { ...prev.profile, role: targetRole }
          }))
        }
        
        closeModal()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Adjust coins
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
        // If looking at detail, sync coins and prepend to transaction history
        if (detailData && detailData.profile.id === activeUser.id) {
          const newTxn = {
            id: Math.random().toString(),
            user_id: activeUser.id,
            amount,
            reason: `manual_adjustment: ${adjustmentReason}`,
            created_at: new Date().toISOString()
          }
          setDetailData((prev: any) => ({
            ...prev,
            profile: { ...prev.profile, coins: (prev.profile.coins || 0) + amount },
            coinTransactions: [newTxn, ...prev.coinTransactions]
          }))
        }
        
        closeModal()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Save profile updates (Update part of CRUD)
  const handleSaveProfile = async () => {
    if (!selectedUserId) return
    setIsSubmitting(true)

    try {
      const res = await updateUserProfileAdmin(selectedUserId, profileForm)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('User profile updated successfully!')
        setIsEditingProfile(false)
        // Sync locally
        setUsers(prev => 
          prev.map(u => 
            u.id === selectedUserId 
              ? { ...u, unit_id: profileForm.unit_id, qualification: profileForm.qualification } 
              : u
          )
        )
        // Sync detailData
        setDetailData((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, ...profileForm }
        }))
      }
    } catch (err) {
      toast.error('Failed to update profile.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete user (Delete part of CRUD)
  const handleDeleteUser = async () => {
    if (!activeUser) return
    setIsSubmitting(true)

    try {
      const res = await deleteUserProfile(activeUser.id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`YDC profile for ${activeUser.full_name} has been deleted.`)
        
        // Remove from local users list
        setUsers(prev => prev.filter(u => u.id !== activeUser.id))
        
        // Reset selections and close modal
        setSelectedUserId(null)
        setDetailData(null)
        closeModal()
      }
    } catch (err) {
      toast.error('An error occurred while deleting user.')
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
      user.unit_name.toLowerCase().includes(query) ||
      user.qualification.toLowerCase().includes(query)
    
    const matchesRole = 
      roleFilter === 'all' || 
      user.role === roleFilter

    const matchesUnit = 
      unitFilter === 'all' || 
      user.unit_name === unitFilter

    const matchesQualification = 
      qualificationFilter === 'all' || 
      user.qualification === qualificationFilter

    return matchesSearch && matchesRole && matchesUnit && matchesQualification
  })

  // CSV Export logic
  const exportToCsv = () => {
    const headers = ['Full Name', 'Email', 'Role', 'Division', 'Qualification', 'Coins Balance', 'Current Streak', 'Longest Streak', 'Registration Date']
    
    const rows = filteredUsers.map(user => [
      user.full_name,
      user.email,
      roleLabels[user.role] || user.role,
      user.unit_name,
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
    'tier-3': 'Event Scanner',
    admin: 'Administrator',
    volunteer: 'Volunteer'
  }

  // Render detail dashboard view
  if (selectedUserId) {
    const userSummary = users.find(u => u.id === selectedUserId)
    const isLoading = isPendingHistory || !detailData

    return (
      <div className="space-y-6">
        {/* Back and Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => {
              setSelectedUserId(null)
              setDetailData(null)
            }}
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to User Directory
          </button>

          {detailData && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => openCoinModal({ ...userSummary!, coins: detailData.profile.coins || 0 })}
                variant="outline"
                size="sm"
                className="font-bold border-zinc-200"
                leftIcon={<Coins size={14} className="text-amber-500" />}
              >
                Adjust Coins
              </Button>
              <Button
                onClick={() => openRoleModal({ ...userSummary!, role: detailData.profile.role })}
                variant="outline"
                size="sm"
                className="font-bold border-zinc-200"
                leftIcon={<UserCog size={14} />}
              >
                Edit Role / Perms
              </Button>
              {(activeAdminRole === 'superadmin' || activeAdminRole === 'president') && (
                <Button
                  onClick={() => openDeleteModal({ ...userSummary! })}
                  variant="outline"
                  size="sm"
                  className="font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  leftIcon={<Trash2 size={14} />}
                >
                  Delete Profile
                </Button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-20 space-y-4">
              <Loader2 className="animate-spin text-zinc-400" size={32} />
              <p className="text-zinc-500 text-sm font-medium">Retrieving database histories...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Profile Overview Header Card */}
            <Card className="shadow-sm bg-white overflow-hidden border border-zinc-200">
              <div className="bg-zinc-50 border-b border-zinc-150 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 shadow-inner overflow-hidden border border-zinc-300">
                    {detailData.profile.avatar_url ? (
                      <img src={detailData.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={30} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-zinc-900">{detailData.profile.full_name || 'Anonymous Volunteer'}</h2>
                      <Badge className="bg-zinc-100 text-zinc-800 border-zinc-200">
                        {roleLabels[detailData.profile.role] || detailData.profile.role}
                      </Badge>
                    </div>
                    <p className="text-zinc-500 text-xs font-mono">{detailData.profile.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-semibold">
                        <MapPin size={12} className="text-zinc-400" />
                        {detailData.profile.unit_name ? detailData.profile.unit_name.toUpperCase() : 'NO UNIT'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scorecards */}
                <div className="flex gap-4 self-start md:self-auto">
                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3 text-center min-w-[90px] shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block">YDC Coins</span>
                    <span className="text-lg font-black font-mono text-amber-700">{detailData.profile.coins ?? 0}</span>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-center min-w-[90px] shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider block">Streak</span>
                    <span className="text-lg font-black font-mono text-orange-700 inline-flex items-center gap-1 justify-center">
                      <Flame size={16} className="fill-orange-500 text-orange-500" />
                      {detailData.streak?.current_streak ?? 0}d
                    </span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-center min-w-[90px] shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Longest</span>
                    <span className="text-lg font-black font-mono text-zinc-700">{detailData.streak?.longest_streak ?? 0}d</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* TABBED HISTORY SECTIONS */}
            <Tabs defaultValue="profile">
              <TabsList variant="line" className="mb-4">
                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                <TabsTrigger value="coins">Coin Ledger ({detailData.coinTransactions.length})</TabsTrigger>
                <TabsTrigger value="events">Events RSVP ({detailData.registrations.length})</TabsTrigger>
                <TabsTrigger value="lms">LMS Course Progress ({detailData.progress.length})</TabsTrigger>
              </TabsList>

              {/* Profile details tab (CRUD Read/Update form) */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="shadow-sm border border-zinc-200 bg-white">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <h3 className="font-extrabold text-zinc-900 text-base">Personal & Demographic Bio</h3>
                      {!isEditingProfile ? (
                        <Button 
                          onClick={() => setIsEditingProfile(true)}
                          variant="outline" 
                          size="sm"
                          className="h-8 font-bold text-xs"
                          leftIcon={<Edit3 size={12} />}
                        >
                          Edit Profile
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setIsEditingProfile(false)}
                            variant="outline" 
                            size="sm"
                            className="h-8 font-bold text-xs"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSaveProfile}
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                            size="sm"
                            className="h-8 bg-zinc-900 hover:bg-black text-white text-xs font-bold"
                            leftIcon={<Save size={12} />}
                          >
                            Save
                          </Button>
                        </div>
                      )}
                    </div>

                    {isEditingProfile ? (
                      /* Edit form inputs */
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <Input
                          label="Father's Name"
                          value={profileForm.father_name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, father_name: e.target.value }))}
                        />
                        <Input
                          label="Date of Birth"
                          type="date"
                          value={profileForm.dob}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, dob: e.target.value }))}
                        />
                        <Input
                          label="WhatsApp Number"
                          placeholder="+92 300 1234567"
                          value={profileForm.whatsapp}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                        />
                        <Input
                          label="Mobile Phone"
                          placeholder="+92 300 1234567"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Unit (City Branch)</span>
                          <Select
                            value={profileForm.unit_id || ''}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, unit_id: e.target.value || '' }))}
                            disabled={activeAdminRole === 'president'}
                          >
                            <option value="">No Unit Assigned</option>
                            {allUnits.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Qualification</span>
                          <Select
                            value={profileForm.qualification}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, qualification: e.target.value }))}
                          >
                            <option value="undergraduate">Undergraduate</option>
                            <option value="matric">Matric</option>
                            <option value="fsc">F.Sc / Intermediate</option>
                            <option value="graduate">Graduate</option>
                          </Select>
                        </div>
                        <div className="sm:col-span-2 md:col-span-3">
                          <Input
                            label="Residential Address"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Read details text view */
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Father&apos;s Name</span>
                          <span className="font-semibold text-zinc-800 block text-sm">{detailData.profile.father_name || '—'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                          <span className="font-semibold text-zinc-800 block text-sm">
                            {detailData.profile.dob ? new Date(detailData.profile.dob).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">WhatsApp</span>
                          <span className="font-semibold text-zinc-800 block text-sm">{detailData.profile.whatsapp || '—'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Alternative Mobile</span>
                          <span className="font-semibold text-zinc-800 block text-sm">{detailData.profile.phone || '—'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Unit</span>
                          <span className="font-semibold text-zinc-800 block text-sm uppercase">{detailData.profile.unit_name || '—'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Highest Education</span>
                          <span className="font-semibold text-zinc-800 block text-sm capitalize">{detailData.profile.qualification || '—'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Joined Date</span>
                          <span className="font-semibold text-zinc-800 block text-sm">
                            {detailData.profile.created_at ? new Date(detailData.profile.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                          </span>
                        </div>
                        <div className="sm:col-span-2 md:col-span-3 space-y-1">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Residential Address</span>
                          <span className="font-semibold text-zinc-800 block text-sm">{detailData.profile.address || '—'}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Coin History Ledger Tab */}
              <TabsContent value="coins" className="space-y-4">
                <Card className="shadow-sm border border-zinc-200 bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                          <th className="p-4">Date & Time</th>
                          <th className="p-4 text-center">Amount</th>
                          <th className="p-4">Reason / Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-sm">
                        {detailData.coinTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-12 text-center text-zinc-400 text-xs font-semibold">
                              This user has no recorded coin transactions.
                            </td>
                          </tr>
                        ) : (
                          detailData.coinTransactions.map((txn: any) => {
                            const isPositive = txn.amount > 0
                            return (
                              <tr key={txn.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="p-4 text-xs font-semibold text-zinc-500 font-mono">
                                  {new Date(txn.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                                <td className={`p-4 text-center font-bold font-mono text-sm ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {isPositive ? '+' : ''}{txn.amount} C
                                </td>
                                <td className="p-4 text-xs font-semibold text-zinc-800">
                                  {txn.reason}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* Event check-ins tab */}
              <TabsContent value="events" className="space-y-4">
                <Card className="shadow-sm border border-zinc-200 bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                          <th className="p-4">Event details</th>
                          <th className="p-4 text-center">Ticket code</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-right">Checked In At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-sm">
                        {detailData.registrations.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-zinc-400 text-xs font-semibold">
                              This user has not registered for any events.
                            </td>
                          </tr>
                        ) : (
                          detailData.registrations.map((reg: any) => {
                            const ev = reg.events
                            return (
                              <tr key={reg.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="p-4">
                                  <div>
                                    <span className="font-bold text-zinc-900 block">{ev?.title || 'Unknown Event'}</span>
                                    <span className="text-[10px] text-zinc-400 font-semibold font-mono">
                                      Date: {ev?.date ? new Date(ev.date).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 text-center font-mono text-xs font-bold text-zinc-600">
                                  {reg.ticket_code}
                                </td>
                                <td className="p-4 text-center">
                                  <Badge 
                                    className={
                                      reg.attended 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                    }
                                  >
                                    {reg.attended ? 'Attended' : 'Registered'}
                                  </Badge>
                                </td>
                                <td className="p-4 text-right text-xs font-semibold text-zinc-500 font-mono">
                                  {reg.attended_at 
                                    ? new Date(reg.attended_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) 
                                    : '—'}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* LMS Progress Tab */}
              <TabsContent value="lms" className="space-y-4">
                <Card className="shadow-sm border border-zinc-200 bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                          <th className="p-4">Course</th>
                          <th className="p-4">Lesson</th>
                          <th className="p-4 text-center">Language</th>
                          <th className="p-4 text-center">Difficulty</th>
                          <th className="p-4 text-right">Completed At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-sm">
                        {detailData.progress.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-zinc-400 text-xs font-semibold">
                              No lessons completed yet in the e-learning courses.
                            </td>
                          </tr>
                        ) : (
                          detailData.progress.map((row: any) => {
                            const c = row.courses
                            const l = row.lessons
                            return (
                              <tr key={row.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="p-4">
                                  <div className="font-bold text-zinc-900 block">{c?.title || row.course_id}</div>
                                  <span className="text-[10px] text-zinc-400 font-medium font-nastaliq block text-right mt-0.5">{c?.title_ur}</span>
                                </td>
                                <td className="p-4">
                                  <div className="font-semibold text-zinc-700 text-xs block">{l?.title || row.lesson_id}</div>
                                  <span className="text-[10px] text-zinc-400 font-medium font-nastaliq block text-right mt-0.5">{l?.title_ur}</span>
                                </td>
                                <td className="p-4 text-center text-xs font-semibold uppercase text-zinc-600">
                                  {row.language === 'ur' ? 'Urdu' : 'English'}
                                </td>
                                <td className="p-4 text-center">
                                  <Badge 
                                    className={
                                      row.difficulty === 'expert' ? 'bg-red-50 text-red-700 border-red-200' :
                                      row.difficulty === 'advanced' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      'bg-zinc-100 text-zinc-700 border-zinc-200'
                                    }
                                  >
                                    {row.difficulty}
                                  </Badge>
                                </td>
                                <td className="p-4 text-right text-xs font-semibold text-zinc-500 font-mono">
                                  {new Date(row.completed_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* REUSE Quick modals from within detailed view */}
        {modalType === 'role' && activeUser && renderRoleModal()}
        {modalType === 'coins' && activeUser && renderCoinsModal()}
        {modalType === 'delete_user' && activeUser && renderDeleteModal()}
      </div>
    )
  }

  // Helper modals rendering (DRY layout)
  function renderRoleModal() {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
            <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
              <Shield size={18} className="text-zinc-950" />
              Manage Account Role
            </h3>
            <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Volunteer Profile</span>
              <span className="font-bold text-zinc-900">{activeUser?.full_name}</span>
              <span className="text-xs text-zinc-500 block">{activeUser?.email}</span>
            </div>

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
    )
  }

  function renderCoinsModal() {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
            <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
              <Coins size={18} className="text-amber-500" />
              Manual Coin Adjustment
            </h3>
            <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Volunteer Profile</span>
              <span className="font-bold text-zinc-900">{activeUser?.full_name}</span>
              <p className="text-xs text-zinc-400 font-medium">Current Balance: <span className="text-zinc-900 font-bold font-mono">{activeUser?.coins} C</span></p>
            </div>

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

            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Adjustment Reason (Required)</label>
              <textarea
                placeholder="Explain why this manual adjustment is being made."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
                className="w-full text-sm p-3 rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-900"
                required
              />
            </div>
          </div>

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
    )
  }

  function renderDeleteModal() {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-zinc-150 flex justify-between items-center bg-red-50">
            <h3 className="font-extrabold text-red-700 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" />
              Delete Volunteer Profile
            </h3>
            <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-zinc-600 leading-relaxed">
              Are you sure you want to delete the YDC profile for <span className="font-bold text-zinc-900">{activeUser?.full_name}</span>?
            </p>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex gap-2 text-xs text-red-700 font-semibold leading-relaxed">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <p>
                WARNING: This will permanently remove their records, including streaks history, event registrations, course progression, and coin balances from the relational database. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-red-100 bg-zinc-50 flex justify-end gap-3">
            <Button onClick={closeModal} variant="outline" size="sm">
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="bg-red-600 hover:bg-red-700 border-red-600 text-white font-bold"
              size="sm"
            >
              Delete Profile
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SEARCH AND FILTERS CARD */}
      <Card className="shadow-sm bg-white border border-zinc-200">
        <CardContent className="p-4 space-y-4">
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

            <div className="flex gap-2">
              <Button
                onClick={() => setModalType('add_user')}
                className="h-10 bg-[#0BA242] border-[#0BA242] text-white hover:bg-[#098235] font-bold shrink-0"
                leftIcon={<Plus size={16} />}
              >
                Add Volunteer
              </Button>
              <Button
                onClick={exportToCsv}
                variant="outline"
                className="h-10 border-zinc-200 hover:bg-zinc-50 font-bold shrink-0"
                leftIcon={<Download size={16} />}
                disabled={filteredUsers.length === 0}
              >
                Export Excel
              </Button>
            </div>
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
                <option value="tier-3">Event Scanners</option>
                <option value="admin">Legacy Admins</option>
                <option value="president">President Admins</option>
                <option value="superadmin">Super Admins</option>
              </Select>
            </div>

            {/* Unit Filter */}
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Unit</span>
              <Select 
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="all">All Units</option>
                {uniqueUnits.map(unit => (
                  <option key={unit} value={unit}>{unit.toUpperCase()}</option>
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
                  <option key={qual} value={qual}>{qual.toUpperCase()}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USER LIST CARD */}
      <Card className="shadow-sm overflow-hidden border border-zinc-200 bg-white">
        <CardContent className="p-0">
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Education</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Coins</th>
                  <th className="py-3 px-4 text-center">Streak</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-400 font-semibold text-sm">
                      No members matched your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === activeAdminId
                    return (
                      <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-2.5 px-4">
                          <div>
                            <span 
                              onClick={() => handleViewDetails(user.id)}
                              className="font-bold text-zinc-900 hover:text-red-600 hover:underline cursor-pointer block text-sm"
                            >
                              {user.full_name}
                            </span>
                            <span className="text-zinc-400 font-mono block mt-0.5">{user.email}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-zinc-600 uppercase">
                          {user.unit_name}
                        </td>
                        <td className="py-2.5 px-4 text-zinc-600 capitalize">
                          {user.qualification}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge 
                            className={
                              user.role === 'superadmin' ? 'bg-[#DD0408] border-[#DD0408] text-white' :
                              user.role === 'president' ? 'bg-[#0A9EDE] border-[#0A9EDE] text-white' :
                              user.role === 'tier-3' ? 'border-[#0BA242] text-[#0BA242] bg-[#0BA242]/5' : 
                              'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }
                          >
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold font-mono text-zinc-800 text-sm">
                          {user.coins} C
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full shrink-0">
                            <Flame size={12} className="text-orange-500 fill-orange-500" />
                            <span className="font-black text-orange-600">
                              {user.streak.current}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400 block mt-0.5 font-semibold">
                            Max: {user.streak.longest}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex gap-1.5">
                            <Button 
                              onClick={() => handleViewDetails(user.id)}
                              variant="outline" 
                              size="sm" 
                              className="h-7 py-0 px-2.5 text-[10px] font-bold border-zinc-200"
                            >
                              Details
                            </Button>
                            {(activeAdminRole === 'superadmin' || activeAdminRole === 'admin') && (
                              <Button 
                                onClick={() => openCoinModal(user)}
                                variant="outline" 
                                size="sm" 
                                className="h-7 py-0 px-2 text-[10px] font-bold border-zinc-200"
                                leftIcon={<Coins size={12} className="text-amber-500" />}
                              >
                                Coins
                              </Button>
                            )}
                            <Button 
                              onClick={() => openRoleModal(user)}
                              variant="outline" 
                              size="sm"
                              className="h-7 py-0 px-2 text-[10px] font-bold border-zinc-200"
                              disabled={isSelf}
                              leftIcon={<UserCog size={12} />}
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
                        <span 
                          onClick={() => handleViewDetails(user.id)}
                          className="font-bold text-zinc-950 text-sm block truncate hover:underline cursor-pointer"
                        >
                          {user.full_name}
                        </span>
                        <span className="text-xs text-zinc-400 block truncate font-mono">{user.email}</span>
                      </div>
                      <Badge 
                        className={
                          user.role === 'superadmin' ? 'bg-[#DD0408] border-[#DD0408] text-white text-[9px] px-2 py-0.5 shrink-0' :
                          user.role === 'president' ? 'bg-[#0A9EDE] border-[#0A9EDE] text-white text-[9px] px-2 py-0.5 shrink-0' :
                          user.role === 'tier-3' ? 'border-[#0BA242] text-[#0BA242] bg-[#0BA242]/5 text-[9px] px-2 py-0.5 shrink-0' : 
                          'bg-zinc-100 text-zinc-700 text-[9px] px-2 py-0.5 shrink-0 border-zinc-200'
                        }
                      >
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-zinc-400" />
                        <span className="uppercase">{user.unit_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GraduationCap size={12} className="text-zinc-400" />
                        <span className="truncate max-w-[150px] capitalize">{user.qualification}</span>
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

                      <div className="flex gap-1.5">
                        <Button 
                          onClick={() => handleViewDetails(user.id)}
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-[10px] px-2.5 border-zinc-200 font-bold"
                        >
                          Details
                        </Button>
                        {(activeAdminRole === 'superadmin' || activeAdminRole === 'admin') && (
                          <Button 
                            onClick={() => openCoinModal(user)}
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] px-2 border-zinc-200 font-bold"
                            leftIcon={<Coins size={10} className="text-amber-500" />}
                          >
                            Coins
                          </Button>
                        )}
                        <Button 
                          onClick={() => openRoleModal(user)}
                          variant="outline" 
                          size="sm"
                          className="h-7 text-[10px] px-2 border-zinc-200 font-bold"
                          disabled={isSelf}
                          leftIcon={<UserCog size={10} />}
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

      {/* CREATE NEW USER INFO MODAL */}
      {modalType === 'add_user' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50">
              <h3 className="font-extrabold text-zinc-900 flex items-center gap-2">
                <User size={18} className="text-[#0BA242]" />
                Add New Volunteer
              </h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                <Plus size={24} />
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Volunteers must register themselves to secure their authentication credentials and setup streaks. Direct the new volunteer to register an account.
              </p>
              
              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 space-y-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Registration flow</span>
                <ol className="list-decimal list-inside text-xs text-zinc-700 space-y-2">
                  <li>Ask the volunteer to navigate to the sign-up page: <strong className="font-mono text-zinc-900">/auth/signup</strong></li>
                  <li>After email verification, they will complete the initial onboarding profile setup.</li>
                  <li>Once done, their profile will immediately pop up in this list, letting you manage their records or assign permissions.</li>
                </ol>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-150 bg-zinc-50 flex justify-end">
              <Button onClick={closeModal} className="bg-zinc-900 border-zinc-900 hover:bg-black text-white" size="sm">
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ROLE & COIN ACTIONS */}
      {modalType === 'role' && activeUser && renderRoleModal()}
      {modalType === 'coins' && activeUser && renderCoinsModal()}
    </div>
  )
}
