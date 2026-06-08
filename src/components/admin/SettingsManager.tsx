'use client'

import React, { useState } from 'react'
import { Coins, Save, BookOpen, Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateSystemSetting, updateCourseReward } from '@/app/admin/actions'
import { toast } from 'sonner'

interface SettingItem {
  key: string
  value: string
  description?: string
}

interface CourseItem {
  id: string
  title: string
  author: string
  reward_points: number
}

interface RankTier {
  name: string
  min_coins: number
  color: string
}

export default function SettingsManager({
  initialSettings,
  initialCourses,
}: {
  initialSettings: SettingItem[]
  initialCourses: CourseItem[]
}) {
  const [activeTab, setActiveTab] = useState<'global' | 'gamification' | 'lms'>('global')

  // Local states for settings
  const [dailyDeedReward, setDailyDeedReward] = useState<string>(
    initialSettings.find((s) => s.key === 'daily_deed_reward')?.value || '10'
  )
  const [eventReward, setEventReward] = useState<string>(
    initialSettings.find((s) => s.key === 'event_attendance_reward')?.value || '50'
  )

  const [rankTiers, setRankTiers] = useState<RankTier[]>(() => {
    const raw = initialSettings.find((s) => s.key === 'rank_tiers')?.value
    if (!raw) return [
      { name: "Bronze", min_coins: 0, color: "#CD7F32" },
      { name: "Silver", min_coins: 500, color: "#C0C0C0" },
      { name: "Gold", min_coins: 2000, color: "#FFD700" },
      { name: "Platinum", min_coins: 5000, color: "#E5E4E2" },
      { name: "Diamond", min_coins: 10000, color: "#B9F2FF" }
    ]
    try {
      return JSON.parse(raw) as RankTier[]
    } catch (e) {
      return []
    }
  })

  // Local state for courses
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses)

  // Saving states
  const [isSavingGlobal, setIsSavingGlobal] = useState(false)
  const [isSavingRanks, setIsSavingRanks] = useState(false)
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null)

  // Handles saving global settings
  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingGlobal(true)

    try {
      const res1 = await updateSystemSetting('daily_deed_reward', dailyDeedReward)
      const res2 = await updateSystemSetting('event_attendance_reward', eventReward)

      if (res1?.error || res2?.error) {
        toast.error(res1?.error || res2?.error || 'Failed to update settings.')
      } else {
        toast.success('Global rewards settings saved successfully.')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setIsSavingGlobal(false)
    }
  }

  // Handles saving rank tiers
  const handleSaveRankTiers = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingRanks(true)

    try {
      const sortedTiers = [...rankTiers].sort((a, b) => a.min_coins - b.min_coins)
      const res = await updateSystemSetting('rank_tiers', JSON.stringify(sortedTiers, null, 2))
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Rank Tiers saved successfully.')
        setRankTiers(sortedTiers) // update local view to sorted
      }
    } catch (err: unknown) {
      toast.error('An error occurred while saving rank tiers.')
    } finally {
      setIsSavingRanks(false)
    }
  }

  const addRankTier = () => {
    setRankTiers([...rankTiers, { name: '', min_coins: 0, color: '#000000' }])
  }

  const updateRankTier = (index: number, field: keyof RankTier, value: string | number) => {
    const newTiers = [...rankTiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setRankTiers(newTiers)
  }

  const removeRankTier = (index: number) => {
    setRankTiers(rankTiers.filter((_, i) => i !== index))
  }

  // Handles course-specific reward updates
  const handleSaveCourseReward = async (courseId: string, rewardVal: number) => {
    setSavingCourseId(courseId)

    try {
      const res = await updateCourseReward(courseId, rewardVal)
      if (res?.error) {
        toast.error(res.error || 'Failed to save.')
      } else {
        toast.success('Course reward points saved successfully!')
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, reward_points: rewardVal } : c))
        )
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error occurred.')
    } finally {
      setSavingCourseId(null)
    }
  }

  const handleCourseRewardChange = (courseId: string, valStr: string) => {
    const numeric = parseInt(valStr, 10) || 0
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, reward_points: Math.max(0, numeric) } : c))
    )
  }

  return (
    <div className="space-y-6">
      {/* TABS NAVIGATION */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button
          onClick={() => setActiveTab('global')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'global' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Base Rewards
        </button>
        <button
          onClick={() => setActiveTab('gamification')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'gamification' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Gamification
        </button>
        <button
          onClick={() => setActiveTab('lms')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'lms' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          LMS Completions
        </button>
      </div>

      <div className="animate-in fade-in duration-300">
        {/* GLOBAL REWARDS */}
        {activeTab === 'global' && (
          <div className="max-w-2xl space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-zinc-500">
                  Global Action Coins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveGlobal} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">
                        Daily Deed Approved Reward
                      </label>
                      <div className="relative flex items-center max-w-sm">
                        <Input
                          type="number"
                          value={dailyDeedReward}
                          onChange={(e) => setDailyDeedReward(e.target.value)}
                          placeholder="e.g. 10"
                          className="pl-10 font-bold text-zinc-800"
                          min="0"
                          required
                        />
                        <Coins className="absolute left-3.5 text-zinc-400" size={16} />
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Standard coins credited automatically when a daily deed submission is approved.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">
                        Event Attendance Reward
                      </label>
                      <div className="relative flex items-center max-w-sm">
                        <Input
                          type="number"
                          value={eventReward}
                          onChange={(e) => setEventReward(e.target.value)}
                          placeholder="e.g. 50"
                          className="pl-10 font-bold text-zinc-800"
                          min="0"
                          required
                        />
                        <Coins className="absolute left-3.5 text-zinc-400" size={16} />
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Coins rewarded to members checking in at events via ticket scans.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-[#1D1D1D] hover:bg-black text-white py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm"
                    isLoading={isSavingGlobal}
                    leftIcon={<Save size={16} />}
                  >
                    Save Action Coins
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* RANK TIERS */}
        {activeTab === 'gamification' && (
          <div className="max-w-4xl space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-zinc-500">
                  Rank Tiers Builder
                </CardTitle>
                <Button onClick={addRankTier} variant="outline" size="sm" className="h-8 gap-1 rounded-lg">
                  <Plus size={14} /> Add Tier
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveRankTiers} className="space-y-6">
                  <div className="space-y-3">
                    {rankTiers.map((tier, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl relative group">
                        <div className="flex-1 w-full space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tier Name</label>
                          <Input 
                            value={tier.name}
                            onChange={(e) => updateRankTier(idx, 'name', e.target.value)}
                            placeholder="e.g. Gold"
                            required
                            className="bg-white"
                          />
                        </div>
                        <div className="w-full sm:w-32 space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Min Coins</label>
                          <Input 
                            type="number"
                            value={tier.min_coins}
                            onChange={(e) => updateRankTier(idx, 'min_coins', parseInt(e.target.value) || 0)}
                            min="0"
                            required
                            className="bg-white font-mono"
                          />
                        </div>
                        <div className="w-full sm:w-24 space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Color Hex</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={tier.color}
                              onChange={(e) => updateRankTier(idx, 'color', e.target.value)}
                              className="w-8 h-8 rounded cursor-pointer p-0 border-0"
                            />
                            <Input 
                              value={tier.color}
                              onChange={(e) => updateRankTier(idx, 'color', e.target.value)}
                              className="bg-white font-mono text-xs px-2"
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                              title="Hex color code (e.g. #FFD700)"
                            />
                          </div>
                        </div>
                        
                        <button 
                          type="button" 
                          onClick={() => removeRankTier(idx)}
                          className="mt-6 p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                          title="Remove Tier"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {rankTiers.length === 0 && (
                      <p className="text-sm text-zinc-400 italic py-4 text-center">No rank tiers configured. Add one above.</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-5">
                    <p className="text-xs text-zinc-400">
                      Tiers will be automatically sorted by min coins upon saving.
                    </p>
                    <Button
                      type="submit"
                      className="bg-[#1D1D1D] hover:bg-black text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm"
                      isLoading={isSavingRanks}
                      leftIcon={<Save size={16} />}
                    >
                      Save Rank Tiers
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* COURSE REWARDS */}
        {activeTab === 'lms' && (
          <div className="max-w-4xl space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-zinc-500">
                  Customize Coin Value Per Course
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {courses.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400">
                    <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No courses found in database.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200">
                    {courses.map((course) => {
                      const isSaving = savingCourseId === course.id

                      return (
                        <div
                          key={course.id}
                          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors"
                        >
                          <div className="space-y-1">
                            <span className="font-extrabold text-sm text-zinc-900">
                              {course.title}
                            </span>
                            <p className="text-xs text-zinc-400">Instructor: {course.author}</p>
                            <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded uppercase">
                              ID: {course.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-28 relative flex items-center">
                              <Input
                                type="number"
                                value={course.reward_points}
                                onChange={(e) => handleCourseRewardChange(course.id, e.target.value)}
                                className="pr-12 text-center font-bold text-zinc-800 h-9"
                                min="0"
                              />
                              <span className="absolute right-3.5 text-[10px] font-extrabold text-zinc-400 uppercase font-mono pointer-events-none">
                                PTS
                              </span>
                            </div>

                            <Button
                              onClick={() => handleSaveCourseReward(course.id, course.reward_points)}
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 shrink-0 border-zinc-200 hover:bg-zinc-50"
                              isLoading={isSaving}
                              leftIcon={!isSaving && <Save size={14} />}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

