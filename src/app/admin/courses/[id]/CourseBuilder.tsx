'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  updateCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  createMcq,
  updateMcq,
  deleteMcq,
} from '../actions'

export interface McqNode {
  id: string
  question: string
  options: string[]
  correctAnswerIndex: number
}

export interface LessonNode {
  id: string
  title: string
  videoUrl: string
  textContent: string
  orderIndex: number
  mcqs: McqNode[]
}

export interface ModuleNode {
  id: string
  title: string
  duration: string
  orderIndex: number
  lessons: LessonNode[]
}

export interface CourseBuilderData {
  course: {
    id: string
    title: string
    author: string
    description: string
    imageUrl: string
  }
  modules: ModuleNode[]
}

type Tab = 'info' | 'modules'

export default function CourseBuilder({ initial }: { initial: CourseBuilderData }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('info')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        <TabButton active={tab === 'info'} onClick={() => setTab('info')}>
          Course Info
        </TabButton>
        <TabButton active={tab === 'modules'} onClick={() => setTab('modules')}>
          Modules & Lessons
        </TabButton>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {tab === 'info' && (
        <CourseInfoEditor
          course={initial.course}
          onError={setError}
          onSaved={() => router.refresh()}
        />
      )}

      {tab === 'modules' && (
        <ModulesEditor
          courseId={initial.course.id}
          modules={initial.modules}
          onError={setError}
          onChanged={() => router.refresh()}
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? 'border-zinc-900 text-zinc-900'
          : 'border-transparent text-zinc-500 hover:text-zinc-800'
      }`}
    >
      {children}
    </button>
  )
}

// ─────────────────────────── Course Info ───────────────────────────

function CourseInfoEditor({
  course,
  onError,
  onSaved,
}: {
  course: CourseBuilderData['course']
  onError: (e: string | null) => void
  onSaved: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(course.title)
  const [author, setAuthor] = useState(course.author)
  const [description, setDescription] = useState(course.description)
  const [imageUrl, setImageUrl] = useState(course.imageUrl)

  function handleSave() {
    onError(null)
    startTransition(async () => {
      const result = await updateCourse(course.id, {
        title,
        author,
        description,
        imageUrl,
      })
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      onSaved()
    })
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 max-w-3xl">
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputStyle}
        />
      </Field>
      <Field label="Author">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className={inputStyle}
        />
      </Field>
      <Field label="Image URL" hint="Paste a public image URL.">
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className={inputStyle}
        />
      </Field>
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputStyle}
        />
      </Field>
      <div className="flex justify-end">
        <Button
          variant="primary"
          leftIcon={<Save size={14} />}
          onClick={handleSave}
          isLoading={isPending}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────── Modules + Lessons ───────────────────────────

function ModulesEditor({
  courseId,
  modules,
  onError,
  onChanged,
}: {
  courseId: string
  modules: ModuleNode[]
  onError: (e: string | null) => void
  onChanged: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [newId, setNewId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newDuration, setNewDuration] = useState('')

  function handleAdd() {
    onError(null)
    const orderIndex =
      modules.length > 0 ? Math.max(...modules.map((m) => m.orderIndex)) + 1 : 1
    startTransition(async () => {
      const result = await createModule({
        id: newId,
        courseId,
        title: newTitle,
        duration: newDuration,
        orderIndex,
      })
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      setNewId('')
      setNewTitle('')
      setNewDuration('')
      setShowAdd(false)
      onChanged()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600">
          {modules.length} module{modules.length === 1 ? '' : 's'}
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={14} />}
          onClick={() => {
            setShowAdd((s) => !s)
            onError(null)
          }}
        >
          {showAdd ? 'Cancel' : 'Add Module'}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-sm text-zinc-900">New Module</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Module ID" hint="Slug, e.g. 'd_m5'.">
              <input
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className={inputStyle}
              />
            </Field>
            <Field label="Title">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={inputStyle}
              />
            </Field>
            <Field label="Duration" hint="Free text, e.g. '30 mins'.">
              <input
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className={inputStyle}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleAdd}
              isLoading={isPending}
            >
              Create Module
            </Button>
          </div>
        </div>
      )}

      {modules.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl px-6 py-12 text-center text-sm text-zinc-500">
          No modules yet. Click <strong>Add Module</strong> above.
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((m) => (
            <ModuleCard
              key={m.id}
              courseId={courseId}
              module={m}
              onError={onError}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ModuleCard({
  courseId,
  module: mod,
  onError,
  onChanged,
}: {
  courseId: string
  module: ModuleNode
  onError: (e: string | null) => void
  onChanged: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(mod.title)
  const [duration, setDuration] = useState(mod.duration)
  const [orderIndex, setOrderIndex] = useState(mod.orderIndex)

  function handleSave() {
    onError(null)
    startTransition(async () => {
      const result = await updateModule(mod.id, {
        title,
        duration,
        orderIndex,
        courseId,
      })
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      onChanged()
    })
  }

  function handleDelete() {
    if (
      !confirm(
        `Delete module "${mod.title}"?\n\nAll its lessons and MCQs will be deleted too. This cannot be undone.`,
      )
    ) {
      return
    }
    onError(null)
    startTransition(async () => {
      const result = await deleteModule(mod.id, courseId)
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      onChanged()
    })
  }

  return (
    <details className="bg-white border border-zinc-200 rounded-xl group" open>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-3 hover:bg-zinc-50">
        <ChevronDown
          size={16}
          className="text-zinc-500 transition-transform group-open:rotate-0 -rotate-90"
        />
        <div className="flex-1">
          <div className="font-semibold text-zinc-900">{mod.title}</div>
          <div className="text-xs text-zinc-500 font-mono">
            {mod.id} · {mod.duration || '—'} · order {mod.orderIndex}
          </div>
        </div>
        <span className="text-xs font-semibold bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full">
          {mod.lessons.length} lesson{mod.lessons.length === 1 ? '' : 's'}
        </span>
      </summary>
      <div className="border-t border-zinc-200 p-4 space-y-4">
        {/* Edit module */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputStyle}
            />
          </Field>
          <Field label="Duration">
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputStyle}
            />
          </Field>
          <Field label="Order">
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
              className={inputStyle}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Save size={14} />}
              onClick={handleSave}
              isLoading={isPending}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Lessons */}
        <LessonsEditor
          courseId={courseId}
          moduleId={mod.id}
          lessons={mod.lessons}
          onError={onError}
          onChanged={onChanged}
        />
      </div>
    </details>
  )
}

function LessonsEditor({
  courseId,
  moduleId,
  lessons,
  onError,
  onChanged,
}: {
  courseId: string
  moduleId: string
  lessons: LessonNode[]
  onError: (e: string | null) => void
  onChanged: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [newId, setNewId] = useState('')
  const [newTitle, setNewTitle] = useState('')

  function handleAdd() {
    onError(null)
    const orderIndex =
      lessons.length > 0 ? Math.max(...lessons.map((l) => l.orderIndex)) + 1 : 1
    startTransition(async () => {
      const result = await createLesson({
        id: newId,
        moduleId,
        courseId,
        title: newTitle,
        videoUrl: '',
        textContent: '',
        orderIndex,
      })
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      setNewId('')
      setNewTitle('')
      setShowAdd(false)
      onChanged()
    })
  }

  return (
    <div className="space-y-3 pl-2 border-l-2 border-zinc-100">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
          Lessons
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus size={12} />}
          onClick={() => {
            setShowAdd((s) => !s)
            onError(null)
          }}
        >
          {showAdd ? 'Cancel' : 'Add Lesson'}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Lesson ID" hint="Must be unique across all lessons.">
              <input
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className={inputStyle}
              />
            </Field>
            <Field label="Title">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={inputStyle}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              isLoading={isPending}
            >
              Create Lesson
            </Button>
          </div>
        </div>
      )}

      {lessons.length === 0 ? (
        <div className="text-xs text-zinc-500 px-2 py-3">No lessons in this module.</div>
      ) : (
        <div className="space-y-2">
          {lessons.map((l) => (
            <LessonCard
              key={l.id}
              courseId={courseId}
              lesson={l}
              onError={onError}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LessonCard({
  courseId,
  lesson,
  onError,
  onChanged,
}: {
  courseId: string
  lesson: LessonNode
  onError: (e: string | null) => void
  onChanged: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(lesson.title)
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl)
  const [textContent, setTextContent] = useState(lesson.textContent)
  const [orderIndex, setOrderIndex] = useState(lesson.orderIndex)

  function handleSave() {
    onError(null)
    startTransition(async () => {
      const result = await updateLesson(lesson.id, {
        title,
        videoUrl,
        textContent,
        orderIndex,
        courseId,
      })
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      onChanged()
    })
  }

  function handleDelete() {
    if (
      !confirm(
        `Delete lesson "${lesson.title}"?\n\nAll its MCQs and user progress entries will be deleted too. This cannot be undone.`,
      )
    ) {
      return
    }
    onError(null)
    startTransition(async () => {
      const result = await deleteLesson(lesson.id, courseId)
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      onChanged()
    })
  }

  return (
    <details className="bg-white border border-zinc-200 rounded-lg group">
      <summary className="cursor-pointer list-none px-3 py-2 flex items-center gap-2 hover:bg-zinc-50">
        <ChevronDown
          size={14}
          className="text-zinc-500 transition-transform group-open:rotate-0 -rotate-90"
        />
        <div className="flex-1">
          <div className="text-sm font-semibold text-zinc-900">{lesson.title}</div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {lesson.id} · order {lesson.orderIndex}
          </div>
        </div>
        <span className="text-[11px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
          {lesson.mcqs.length} MCQ{lesson.mcqs.length === 1 ? '' : 's'}
        </span>
      </summary>

      <div className="border-t border-zinc-200 p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputStyle}
            />
          </Field>
          <Field label="Order">
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
              className={inputStyle}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Video URL" hint="Optional. Direct .mp4 or hosted URL.">
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className={inputStyle}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field
              label="Lesson Content (HTML)"
              hint="Raw HTML — rendered with dangerouslySetInnerHTML."
            >
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                className={`${inputStyle} font-mono text-xs`}
              />
            </Field>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Save size={14} />}
            onClick={handleSave}
            isLoading={isPending}
          >
            Save Lesson
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={handleDelete}
            disabled={isPending}
          >
            Delete Lesson
          </Button>
        </div>

        {/* MCQs */}
        <McqsEditor
          courseId={courseId}
          lessonId={lesson.id}
          mcqs={lesson.mcqs}
          onError={onError}
          onChanged={onChanged}
        />
      </div>
    </details>
  )
}

function McqsEditor({
  courseId,
  lessonId,
  mcqs,
  onError,
  onChanged,
}: {
  courseId: string
  lessonId: string
  mcqs: McqNode[]
  onError: (e: string | null) => void
  onChanged: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctIdx, setCorrectIdx] = useState(0)

  function handleAdd() {
    onError(null)
    startTransition(async () => {
      const cleaned = options.map((o) => o.trim()).filter((o) => o.length > 0)
      if (correctIdx >= cleaned.length) {
        onError('Correct answer index is out of range after empty options were removed.')
        return
      }
      const result = await createMcq({
        lessonId,
        courseId,
        question,
        options: cleaned,
        correctAnswerIndex: correctIdx,
      })
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      setQuestion('')
      setOptions(['', '', '', ''])
      setCorrectIdx(0)
      setShowAdd(false)
      onChanged()
    })
  }

  return (
    <div className="space-y-2 pl-2 border-l-2 border-zinc-100">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">
          Multiple Choice Questions
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus size={12} />}
          onClick={() => {
            setShowAdd((s) => !s)
            onError(null)
          }}
        >
          {showAdd ? 'Cancel' : 'Add MCQ'}
        </Button>
      </div>

      {showAdd && (
        <McqForm
          question={question}
          setQuestion={setQuestion}
          options={options}
          setOptions={setOptions}
          correctIdx={correctIdx}
          setCorrectIdx={setCorrectIdx}
          submitLabel="Create MCQ"
          onSubmit={handleAdd}
          isPending={isPending}
        />
      )}

      {mcqs.length === 0 ? (
        <div className="text-xs text-zinc-500 px-2 py-2">No MCQs yet.</div>
      ) : (
        <div className="space-y-2">
          {mcqs.map((m) => (
            <McqCard
              key={m.id}
              courseId={courseId}
              mcq={m}
              onError={onError}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function McqCard({
  courseId,
  mcq,
  onError,
  onChanged,
}: {
  courseId: string
  mcq: McqNode
  onError: (e: string | null) => void
  onChanged: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  // Pad to at least 4 inputs for editing convenience
  const paddedOptions = [...mcq.options, ...Array(Math.max(0, 4 - mcq.options.length)).fill('')]
  const [question, setQuestion] = useState(mcq.question)
  const [options, setOptions] = useState<string[]>(paddedOptions)
  const [correctIdx, setCorrectIdx] = useState(mcq.correctAnswerIndex)

  function handleSave() {
    onError(null)
    startTransition(async () => {
      const cleaned = options.map((o) => o.trim()).filter((o) => o.length > 0)
      if (correctIdx >= cleaned.length) {
        onError('Correct answer index is out of range after empty options were removed.')
        return
      }
      const result = await updateMcq(mcq.id, {
        courseId,
        question,
        options: cleaned,
        correctAnswerIndex: correctIdx,
      })
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      setEditing(false)
      onChanged()
    })
  }

  function handleDelete() {
    if (!confirm(`Delete this MCQ?\n\n"${mcq.question}"`)) return
    onError(null)
    startTransition(async () => {
      const result = await deleteMcq(mcq.id, courseId)
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      onChanged()
    })
  }

  if (!editing) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-1.5">
        <div className="text-sm font-medium text-zinc-900">{mcq.question}</div>
        <ul className="text-xs text-zinc-700 space-y-0.5 pl-1">
          {mcq.options.map((opt, i) => (
            <li
              key={i}
              className={i === mcq.correctAnswerIndex ? 'font-semibold text-green-700' : ''}
            >
              {i === mcq.correctAnswerIndex ? '✓ ' : '· '}
              {opt}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={12} />}
            onClick={handleDelete}
            disabled={isPending}
          >
            Delete
          </Button>
        </div>
      </div>
    )
  }

  return (
    <McqForm
      question={question}
      setQuestion={setQuestion}
      options={options}
      setOptions={setOptions}
      correctIdx={correctIdx}
      setCorrectIdx={setCorrectIdx}
      submitLabel="Save MCQ"
      onSubmit={handleSave}
      onCancel={() => setEditing(false)}
      isPending={isPending}
    />
  )
}

function McqForm({
  question,
  setQuestion,
  options,
  setOptions,
  correctIdx,
  setCorrectIdx,
  submitLabel,
  onSubmit,
  onCancel,
  isPending,
}: {
  question: string
  setQuestion: (s: string) => void
  options: string[]
  setOptions: (s: string[]) => void
  correctIdx: number
  setCorrectIdx: (n: number) => void
  submitLabel: string
  onSubmit: () => void
  onCancel?: () => void
  isPending: boolean
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
      <Field label="Question">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          className={inputStyle}
        />
      </Field>
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Options (mark the correct one)
        </div>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correctIdx"
              checked={correctIdx === i}
              onChange={() => setCorrectIdx(i)}
              className="shrink-0"
            />
            <input
              value={opt}
              onChange={(e) => {
                const next = [...options]
                next[i] = e.target.value
                setOptions(next)
              }}
              placeholder={`Option ${i + 1}`}
              className={inputStyle + ' flex-1'}
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => {
                  const next = options.filter((_, idx) => idx !== i)
                  setOptions(next)
                  if (correctIdx >= next.length) setCorrectIdx(0)
                  else if (correctIdx === i) setCorrectIdx(0)
                  else if (correctIdx > i) setCorrectIdx(correctIdx - 1)
                }}
                className="text-zinc-400 hover:text-red-600"
                aria-label="Remove option"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button
            type="button"
            onClick={() => setOptions([...options, ''])}
            className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold"
          >
            + Add option
          </button>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={onSubmit} isLoading={isPending}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────── Shared ───────────────────────────

const inputStyle =
  'w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
    </label>
  )
}
