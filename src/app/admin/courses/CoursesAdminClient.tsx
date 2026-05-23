'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, BookOpen, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createCourse, deleteCourse, importCourseFromJson } from './actions'
import { updateCourseReward } from '@/app/admin/actions'
import { toast } from 'sonner'

export interface CourseRow {
  id: string
  title: string
  author: string
  description: string
  imageUrl: string
  rewardPoints: number
  moduleCount: number
}

export default function CoursesAdminClient({
  initialCourses,
}: {
  initialCourses: CourseRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inline reward editing states
  const [courseRewards, setCourseRewards] = useState<Record<string, number>>({})
  const [savingReward, setSavingReward] = useState<Record<string, boolean>>({})

  const handleSaveReward = async (courseId: string) => {
    const pts = courseRewards[courseId] !== undefined 
      ? courseRewards[courseId] 
      : (initialCourses.find(c => c.id === courseId)?.rewardPoints ?? 50)
    setSavingReward(prev => ({ ...prev, [courseId]: true }))
    try {
      const res = await updateCourseReward(courseId, pts)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Course coin reward updated!')
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update reward.')
    } finally {
      setSavingReward(prev => ({ ...prev, [courseId]: false }))
    }
  }

  // Create form state
  const [newId, setNewId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newReward, setNewReward] = useState<number>(50)
  const [jsonText, setJsonText] = useState('')

  function resetForm() {
    setNewId('')
    setNewTitle('')
    setNewAuthor('')
    setNewDescription('')
    setNewImageUrl('')
    setNewReward(50)
    setJsonText('')
    setError(null)
  }

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await createCourse({
        id: newId,
        title: newTitle,
        author: newAuthor,
        description: newDescription,
        imageUrl: newImageUrl,
        rewardPoints: newReward,
      })
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      resetForm()
      setShowCreate(false)
      router.refresh()
    })
  }

  function handleImport() {
    setError(null)
    startTransition(async () => {
      const result = await importCourseFromJson(jsonText)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      resetForm()
      setShowImport(false)
      router.refresh()
    })
  }

  function handleDelete(id: string, title: string) {
    if (
      !confirm(
        `Delete course "${title}"?\n\nThis also deletes all its modules, lessons, MCQs, and user progress. This cannot be undone.`,
      )
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await deleteCourse(id)
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600">
          {initialCourses.length} course{initialCourses.length === 1 ? '' : 's'}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<FileJson size={16} />}
            onClick={() => {
              setShowImport((s) => !s)
              setShowCreate(false)
              setError(null)
            }}
          >
            {showImport ? 'Cancel Import' : 'Import JSON'}
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => {
              setShowCreate((s) => !s)
              setShowImport(false)
              setError(null)
            }}
          >
            {showCreate ? 'Cancel' : 'Add Course'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Import JSON form */}
      {showImport && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <h2 className="font-bold text-zinc-900">Import Course from JSON</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Paste the AI-generated or custom JSON structure representing your course tree.
              </p>
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("You can find the schema documentation and prompt at:\ndocs/course_import_schema.md in your repository root.");
              }}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 px-2 py-1 rounded transition-colors"
            >
              View Schema Guide
            </a>
          </div>

          <FormField
            label="Course JSON Structure"
            hint="Paste the valid JSON structure matching our import schema."
          >
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`{\n  "id": "islamic-history-101",\n  "title": "Introduction to Islamic History",\n  "author": "Dr. Tariq Mahmood",\n  "description": "An introductory course...",\n  "imageUrl": "",\n  "rewardPoints": 100,\n  "modules": []\n}`}
              rows={12}
              className="w-full font-mono text-xs border border-zinc-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50"
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { resetForm(); setShowImport(false) }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              isLoading={isPending}
              disabled={!jsonText.trim()}
            >
              Save Import
            </Button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-zinc-900">New Course</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Course ID"
              hint="Lowercase slug (e.g. 'deenyat'). Used in URLs. Cannot be changed later."
            >
              <input
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="my-course"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </FormField>
            <FormField label="Title">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="My Course"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </FormField>
            <FormField label="Author">
              <input
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Author name"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </FormField>
            <FormField label="Image URL" hint="Paste a public image URL.">
              <input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://…"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </FormField>
            <FormField
              label="Reward Coins"
              hint="Awarded to a user when they complete every chapter of this course."
            >
              <input
                type="number"
                min={0}
                step={1}
                value={newReward}
                onChange={(e) => setNewReward(parseInt(e.target.value, 10) || 0)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Description">
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Short description of the course."
                  rows={3}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </FormField>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { resetForm(); setShowCreate(false) }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} isLoading={isPending}>
              Create Course
            </Button>
          </div>
        </div>
      )}

      {/* Courses table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {initialCourses.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-500">
            No courses yet. Click <strong>Add Course</strong> to create one,
            or visit <code className="bg-zinc-100 px-1 rounded">/api/lms/seed</code> to load
            the starter Deenyat + Seerat data.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Course</th>
                <th className="text-left px-4 py-3 font-semibold">Author</th>
                <th className="text-left px-4 py-3 font-semibold">Modules</th>
                <th className="text-left px-4 py-3 font-semibold">Reward</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialCourses.map((c) => (
                <tr key={c.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-zinc-900">{c.title}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5">{c.id}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{c.author}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full">
                      <BookOpen size={12} />
                      {c.moduleCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-zinc-900">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={courseRewards[c.id] !== undefined ? courseRewards[c.id] : c.rewardPoints}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0
                          setCourseRewards(prev => ({ ...prev, [c.id]: val }))
                        }}
                        className="w-16 px-2 py-1 text-xs border border-zinc-250 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 rounded bg-zinc-50/50 font-mono text-center"
                        disabled={savingReward[c.id]}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-bold text-[#0A9EDE] hover:bg-[#0A9EDE]/5 shrink-0"
                        onClick={() => handleSaveReward(c.id)}
                        isLoading={savingReward[c.id]}
                      >
                        Save
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/courses/${c.id}`}>
                        <Button variant="outline" size="sm" leftIcon={<Pencil size={14} />}>
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => handleDelete(c.id, c.title)}
                        disabled={isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
    </label>
  )
}
