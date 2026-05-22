'use client'

import React, { useState } from 'react'
import { Coins, Save, BookOpen } from 'lucide-react'
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

export default function SettingsManager({
  initialSettings,
  initialCourses,
}: {
  initialSettings: SettingItem[]
  initialCourses: CourseItem[]
}) {
  // Local states for settings
  const [dailyDeedReward, setDailyDeedReward] = useState<string>(
    initialSettings.find((s) => s.key === 'daily_deed_reward')?.value || '10'
  )
  const [eventReward, setEventReward] = useState<string>(
    initialSettings.find((s) => s.key === 'event_attendance_reward')?.value || '50'
  )

  // Local state for courses
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses)

  // Saving states
  const [isSavingGlobal, setIsSavingGlobal] = useState(false)
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

  // Handles course-specific reward updates
  const handleSaveCourseReward = async (courseId: string, rewardVal: number) => {
    setSavingCourseId(courseId)

    try {
      const res = await updateCourseReward(courseId, rewardVal)
      if (res?.error) {
        toast.error(res.error || 'Failed to save.')
      } else {
        toast.success('Course reward points saved successfully!')
        // Refresh local state points representation
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* GLOBAL REWARDS CONFIGURATION */}
      <div className="lg:col-span-1 space-y-6">
        <h2 className="text-lg font-bold text-zinc-900">Base Reward System</h2>
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
                  <div className="relative flex items-center">
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
                  <div className="relative flex items-center">
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
                className="w-full bg-[#1D1D1D] hover:bg-black text-white py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm"
                isLoading={isSavingGlobal}
                leftIcon={<Save size={16} />}
              >
                Save Action Coins
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* COURSE-SPECIFIC REWARDS LIST */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-lg font-bold text-zinc-900">LMS Course Completions</h2>
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
    </div>
  )
}
