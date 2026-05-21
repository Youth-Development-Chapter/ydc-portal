'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createCourse, deleteCourse } from './actions'

export interface CourseRow {
  id: string
  title: string
  author: string
  description: string
  imageUrl: string
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
  const [error, setError] = useState<string | null>(null)

  // Create form state
  const [newId, setNewId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')

  function resetForm() {
    setNewId('')
    setNewTitle('')
    setNewAuthor('')
    setNewDescription('')
    setNewImageUrl('')
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
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setShowCreate((s) => !s)
            setError(null)
          }}
        >
          {showCreate ? 'Cancel' : 'Add Course'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
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
