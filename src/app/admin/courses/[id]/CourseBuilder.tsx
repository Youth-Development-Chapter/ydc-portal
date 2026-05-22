'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, ChevronDown, Image as ImageIcon } from 'lucide-react'
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
  uploadCourseCover,
} from '../actions'

export interface McqNode {
  id: string
  question: string
  questionUr?: string
  options: string[]
  optionsUr?: string[]
  correctAnswerIndex: number
  difficulty: 'beginner' | 'advanced' | 'expert'
}

export interface LessonNode {
  id: string
  title: string
  titleUr?: string
  videoUrl: string
  videoUrlUr?: string
  textContent: string
  textContentUr?: string
  orderIndex: number
  mcqs: McqNode[]
}

export interface ModuleNode {
  id: string
  title: string
  titleUr?: string
  duration: string
  orderIndex: number
  lessons: LessonNode[]
}

export interface CourseBuilderData {
  course: {
    id: string
    title: string
    titleUr?: string
    author: string
    description: string
    descriptionUr?: string
    imageUrl: string
    rewardPoints: number
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
  const [titleUr, setTitleUr] = useState(course.titleUr || '')
  const [author, setAuthor] = useState(course.author)
  const [description, setDescription] = useState(course.description)
  const [descriptionUr, setDescriptionUr] = useState(course.descriptionUr || '')
  const [imageUrl, setImageUrl] = useState(course.imageUrl)
  const [rewardPoints, setRewardPoints] = useState<number>(course.rewardPoints)
  const [isUploading, setIsUploading] = useState(false)

  function handleSave() {
    onError(null)
    startTransition(async () => {
      const result = await updateCourse(course.id, {
        title,
        titleUr: titleUr.trim() || undefined,
        author,
        description,
        descriptionUr: descriptionUr.trim() || undefined,
        imageUrl,
        rewardPoints,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Title (English)">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputStyle}
            placeholder="Course Title in English"
          />
        </Field>
        <Field label="Title (Urdu)">
          <input
            value={titleUr}
            onChange={(e) => setTitleUr(e.target.value)}
            className={`${inputStyle} font-nastaliq text-right text-lg`}
            dir="rtl"
            placeholder="اردو میں کورس کا عنوان"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Author">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className={inputStyle}
            placeholder="Author name"
          />
        </Field>
        <Field
          label="Reward Coins"
          hint="Coins awarded to a user when they complete every chapter of this course."
        >
          <input
            type="number"
            min={0}
            step={1}
            value={rewardPoints}
            onChange={(e) => setRewardPoints(parseInt(e.target.value, 10) || 0)}
            className={inputStyle}
          />
        </Field>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Cover Photo
        </span>
        <div className="flex gap-4 items-start">
          {imageUrl && (
            <div className="w-24 h-32 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 shrink-0 relative group shadow-md">
              <img src={imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
              >
                Remove
              </button>
            </div>
          )}
          <label className={`flex-1 border-2 border-dashed border-zinc-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-zinc-400 hover:bg-zinc-50/50 transition relative ${isUploading ? 'pointer-events-none opacity-60' : ''}`}>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setIsUploading(true)
                onError(null)
                try {
                  const fd = new FormData()
                  fd.append('file', file)
                  const res = await uploadCourseCover(fd)
                  if ('error' in res && res.error) {
                    onError(res.error)
                  } else if (res.imageUrl) {
                    setImageUrl(res.imageUrl)
                  }
                } catch (err) {
                  onError(err instanceof Error ? err.message : String(err))
                } finally {
                  setIsUploading(false)
                }
              }}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-500 font-medium">Uploading cover photo...</span>
              </div>
            ) : (
              <>
                <ImageIcon size={20} className="text-zinc-400" />
                <div className="text-xs font-semibold text-zinc-700">
                  Click to select or drag and drop image here
                </div>
                <div className="text-[10px] text-zinc-400">
                  Recommended size: 3:4 ratio (e.g. 600x800)
                </div>
              </>
            )}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Description (English)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputStyle}
            placeholder="Course details and summary in English"
          />
        </Field>
        <Field label="Description (Urdu)">
          <textarea
            value={descriptionUr}
            onChange={(e) => setDescriptionUr(e.target.value)}
            rows={4}
            className={`${inputStyle} font-nastaliq text-right text-base`}
            dir="rtl"
            placeholder="اردو میں کورس کی تفصیل اور خلاصہ"
          />
        </Field>
      </div>

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
  const [newTitleUr, setNewTitleUr] = useState('')
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
        titleUr: newTitleUr.trim() || undefined,
        duration: newDuration,
        orderIndex,
      })
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      setNewId('')
      setNewTitle('')
      setNewTitleUr('')
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Module ID" hint="Slug, e.g. 'm1'. Only letters/numbers/dashes/underscores.">
              <input
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className={inputStyle}
                placeholder="slug-id"
              />
            </Field>
            <Field label="Duration" hint="Free text, e.g. '30 mins'.">
              <input
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className={inputStyle}
                placeholder="30 mins"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Title (English)">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={inputStyle}
                placeholder="Module Title (English)"
              />
            </Field>
            <Field label="Title (Urdu)">
              <input
                value={newTitleUr}
                onChange={(e) => setNewTitleUr(e.target.value)}
                className={`${inputStyle} font-nastaliq text-right`}
                dir="rtl"
                placeholder="اردو میں عنوان"
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
  const [titleUr, setTitleUr] = useState(mod.titleUr || '')
  const [duration, setDuration] = useState(mod.duration)
  const [orderIndex, setOrderIndex] = useState(mod.orderIndex)

  function handleSave() {
    onError(null)
    startTransition(async () => {
      const result = await updateModule(mod.id, {
        title,
        titleUr: titleUr.trim() || undefined,
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
    <details className="bg-white border border-zinc-200 rounded-xl group animate-in fade-in" open>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 select-none">
        <ChevronDown
          size={16}
          className="text-zinc-500 transition-transform group-open:rotate-0 -rotate-90"
        />
        <div className="flex-1">
          <div className="font-semibold text-zinc-900 flex items-center gap-2">
            <span>{mod.title}</span>
            {mod.titleUr && (
              <span className="text-zinc-400 text-xs font-nastaliq" dir="rtl">
                ({mod.titleUr})
              </span>
            )}
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Title (English)">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputStyle}
            />
          </Field>
          <Field label="Title (Urdu)">
            <input
              value={titleUr}
              onChange={(e) => setTitleUr(e.target.value)}
              className={`${inputStyle} font-nastaliq text-right`}
              dir="rtl"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
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
          <div className="flex gap-2 justify-end pb-0.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Save size={14} />}
              onClick={handleSave}
              isLoading={isPending}
            >
              Save Module
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
  const [newTitle, setNewTitle] = useState('')
  const [newTitleUr, setNewTitleUr] = useState('')

  function handleAdd() {
    onError(null)
    const orderIndex =
      lessons.length > 0 ? Math.max(...lessons.map((l) => l.orderIndex)) + 1 : 1
    startTransition(async () => {
      const result = await createLesson({
        id: moduleId, // In this LMS structure, lessonId = moduleId
        moduleId,
        courseId,
        title: newTitle,
        titleUr: newTitleUr.trim() || undefined,
        videoUrl: '',
        textContent: '',
        orderIndex,
      })
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      setNewTitle('')
      setNewTitleUr('')
      setShowAdd(false)
      onChanged()
    })
  }

  // Each module maps to exactly one lesson in the LMS design.
  const hasLesson = lessons.length > 0

  return (
    <div className="space-y-3 pl-2 border-l-2 border-zinc-100">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
          Lessons
        </div>
        {!hasLesson && (
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
        )}
      </div>

      {showAdd && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Title (English)">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={inputStyle}
                placeholder="Lesson Title (English)"
              />
            </Field>
            <Field label="Title (Urdu)">
              <input
                value={newTitleUr}
                onChange={(e) => setNewTitleUr(e.target.value)}
                className={`${inputStyle} font-nastaliq text-right`}
                dir="rtl"
                placeholder="اردو میں سبق کا عنوان"
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
  const [titleUr, setTitleUr] = useState(lesson.titleUr || '')
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl)
  const [videoUrlUr, setVideoUrlUr] = useState(lesson.videoUrlUr || '')
  const [textContent, setTextContent] = useState(lesson.textContent)
  const [textContentUr, setTextContentUr] = useState(lesson.textContentUr || '')
  const [orderIndex, setOrderIndex] = useState(lesson.orderIndex)

  function handleSave() {
    onError(null)
    startTransition(async () => {
      const result = await updateLesson(lesson.id, {
        title,
        titleUr: titleUr.trim() || undefined,
        videoUrl,
        videoUrlUr: videoUrlUr.trim() || undefined,
        textContent,
        textContentUr: textContentUr.trim() || undefined,
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
      <summary className="cursor-pointer list-none px-3 py-2 flex items-center gap-2 hover:bg-zinc-50 select-none">
        <ChevronDown
          size={14}
          className="text-zinc-500 transition-transform group-open:rotate-0 -rotate-90"
        />
        <div className="flex-1">
          <div className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <span>{lesson.title}</span>
            {lesson.titleUr && (
              <span className="text-zinc-400 text-xs font-nastaliq" dir="rtl">
                ({lesson.titleUr})
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {lesson.id} · order {lesson.orderIndex}
          </div>
        </div>
        <span className="text-[11px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
          {lesson.mcqs.length} MCQ{lesson.mcqs.length === 1 ? '' : 's'}
        </span>
      </summary>

      <div className="border-t border-zinc-200 p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Title (English)">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputStyle}
              />
            </Field>
            <Field label="Title (Urdu)">
              <input
                value={titleUr}
                onChange={(e) => setTitleUr(e.target.value)}
                className={`${inputStyle} font-nastaliq text-right`}
                dir="rtl"
              />
            </Field>
          </div>
          <Field label="Order">
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
              className={inputStyle}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Video URL (English)" hint="Optional. Direct .mp4 or YouTube.">
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className={inputStyle}
              placeholder="https://..."
            />
          </Field>
          <Field label="Video URL (Urdu)" hint="Optional. Leave blank to fallback to English video.">
            <input
              value={videoUrlUr}
              onChange={(e) => setVideoUrlUr(e.target.value)}
              className={inputStyle}
              placeholder="https://..."
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Lesson Content HTML (English)"
            hint="Raw HTML — rendered with dangerouslySetInnerHTML."
          >
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={8}
              className={`${inputStyle} font-mono text-xs`}
            />
          </Field>
          <Field
            label="Lesson Content HTML (Urdu)"
            hint="Raw HTML in Urdu — rendered with dangerouslySetInnerHTML."
          >
            <textarea
              value={textContentUr}
              onChange={(e) => setTextContentUr(e.target.value)}
              rows={8}
              className={`${inputStyle} font-nastaliq text-right text-base`}
              dir="rtl"
            />
          </Field>
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
  const [questionUr, setQuestionUr] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [optionsUr, setOptionsUr] = useState<string[]>(['', '', '', ''])
  const [correctIdx, setCorrectIdx] = useState(0)
  const [difficulty, setDifficulty] = useState<'beginner' | 'advanced' | 'expert'>('beginner')

  function handleAdd() {
    onError(null)
    startTransition(async () => {
      const cleaned = options.map((o) => o.trim()).filter((o) => o.length > 0)
      const cleanedUr = optionsUr.map((o) => o.trim()).filter((o) => o.length > 0)
      if (correctIdx >= cleaned.length) {
        onError('Correct answer index is out of range after empty options were removed.')
        return
      }
      const result = await createMcq({
        lessonId,
        courseId,
        question,
        questionUr: questionUr.trim() || undefined,
        options: cleaned,
        optionsUr: cleanedUr.length > 0 ? cleanedUr : undefined,
        correctAnswerIndex: correctIdx,
        difficulty,
      })
      if ('error' in result && result.error) {
        onError(result.error)
        return
      }
      setQuestion('')
      setQuestionUr('')
      setOptions(['', '', '', ''])
      setOptionsUr(['', '', '', ''])
      setCorrectIdx(0)
      setDifficulty('beginner')
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
          questionUr={questionUr}
          setQuestionUr={setQuestionUr}
          options={options}
          setOptions={setOptions}
          optionsUr={optionsUr}
          setOptionsUr={setOptionsUr}
          correctIdx={correctIdx}
          setCorrectIdx={setCorrectIdx}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
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
  const paddedOptions = [...mcq.options, ...Array(Math.max(0, 4 - mcq.options.length)).fill('')]
  const paddedOptionsUr = mcq.optionsUr
    ? [...mcq.optionsUr, ...Array(Math.max(0, paddedOptions.length - mcq.optionsUr.length)).fill('')]
    : Array(paddedOptions.length).fill('')

  const [question, setQuestion] = useState(mcq.question)
  const [questionUr, setQuestionUr] = useState(mcq.questionUr || '')
  const [options, setOptions] = useState<string[]>(paddedOptions)
  const [optionsUr, setOptionsUr] = useState<string[]>(paddedOptionsUr)
  const [correctIdx, setCorrectIdx] = useState(mcq.correctAnswerIndex)
  const [difficulty, setDifficulty] = useState<'beginner' | 'advanced' | 'expert'>(mcq.difficulty)

  function handleSave() {
    onError(null)
    startTransition(async () => {
      const cleaned = options.map((o) => o.trim()).filter((o) => o.length > 0)
      const cleanedUr = optionsUr.map((o) => o.trim()).filter((o) => o.length > 0)
      if (correctIdx >= cleaned.length) {
        onError('Correct answer index is out of range after empty options were removed.')
        return
      }
      const result = await updateMcq(mcq.id, {
        courseId,
        question,
        questionUr: questionUr.trim() || undefined,
        options: cleaned,
        optionsUr: cleanedUr.length > 0 ? cleanedUr : undefined,
        correctAnswerIndex: correctIdx,
        difficulty,
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
    const diffColor = mcq.difficulty === 'expert'
      ? 'bg-red-50 text-red-700 border-red-200'
      : mcq.difficulty === 'advanced'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-green-50 text-green-700 border-green-200'

    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-1.5 animate-in fade-in">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-zinc-400 font-mono">
            {mcq.id}
          </div>
          <span className={`text-[10px] font-extrabold uppercase border px-2 py-0.5 rounded-full ${diffColor}`}>
            {mcq.difficulty}
          </span>
        </div>
        <div className="text-sm font-medium text-zinc-900">{mcq.question}</div>
        {mcq.questionUr && (
          <div className="text-base font-medium text-zinc-700 font-nastaliq text-right" dir="rtl">
            {mcq.questionUr}
          </div>
        )}
        <ul className="text-xs text-zinc-700 space-y-1 pl-1 mt-2">
          {mcq.options.map((opt, i) => {
            const optUr = mcq.optionsUr?.[i]
            return (
              <li
                key={i}
                className={`py-0.5 px-1.5 rounded ${i === mcq.correctAnswerIndex ? 'bg-green-50 font-semibold text-green-700 border border-green-200/50' : ''}`}
              >
                <span className="font-mono text-zinc-400 mr-1">{i + 1}.</span>
                <span>{opt}</span>
                {optUr && (
                  <span className="font-nastaliq text-zinc-500 float-right" dir="rtl">
                    {optUr}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        <div className="flex gap-2 justify-end mt-2 pt-1 border-t border-zinc-200/50">
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
      questionUr={questionUr}
      setQuestionUr={setQuestionUr}
      options={options}
      setOptions={setOptions}
      optionsUr={optionsUr}
      setOptionsUr={setOptionsUr}
      correctIdx={correctIdx}
      setCorrectIdx={setCorrectIdx}
      difficulty={difficulty}
      setDifficulty={setDifficulty}
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
  questionUr,
  setQuestionUr,
  options,
  setOptions,
  optionsUr,
  setOptionsUr,
  correctIdx,
  setCorrectIdx,
  difficulty,
  setDifficulty,
  submitLabel,
  onSubmit,
  onCancel,
  isPending,
}: {
  question: string
  setQuestion: (s: string) => void
  questionUr: string
  setQuestionUr: (s: string) => void
  options: string[]
  setOptions: (s: string[]) => void
  optionsUr: string[]
  setOptionsUr: (s: string[]) => void
  correctIdx: number
  setCorrectIdx: (n: number) => void
  difficulty: 'beginner' | 'advanced' | 'expert'
  setDifficulty: (d: 'beginner' | 'advanced' | 'expert') => void
  submitLabel: string
  onSubmit: () => void
  onCancel?: () => void
  isPending: boolean
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3 shadow-inner">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Field label="Question (English)">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              className={inputStyle}
              placeholder="What is..."
            />
          </Field>
        </div>
        <Field label="Difficulty">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'advanced' | 'expert')}
            className={inputStyle}
          >
            <option value="beginner">Beginner</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </Field>
      </div>

      <Field label="Question (Urdu)">
        <textarea
          value={questionUr}
          onChange={(e) => setQuestionUr(e.target.value)}
          rows={2}
          className={`${inputStyle} font-nastaliq text-right text-base`}
          dir="rtl"
          placeholder="سوال یہاں درج کریں..."
        />
      </Field>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Options (mark the correct option on the left radio button)
        </div>
        {options.map((opt, i) => (
          <div key={i} className="bg-zinc-50 border border-zinc-100 rounded-lg p-2 space-y-2 relative">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="correctIdx"
                checked={correctIdx === i}
                onChange={() => setCorrectIdx(i)}
                className="shrink-0 accent-zinc-950 w-4 h-4 cursor-pointer"
              />
              <span className="text-[10px] font-mono font-bold text-zinc-400 w-12 shrink-0">
                EN {i + 1}
              </span>
              <input
                value={opt}
                onChange={(e) => {
                  const next = [...options]
                  next[i] = e.target.value
                  setOptions(next)
                }}
                placeholder={`English option ${i + 1}`}
                className={inputStyle + ' flex-1'}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = options.filter((_, idx) => idx !== i)
                    setOptions(next)
                    const nextUr = optionsUr.filter((_, idx) => idx !== i)
                    setOptionsUr(nextUr)
                    if (correctIdx >= next.length) setCorrectIdx(0)
                    else if (correctIdx === i) setCorrectIdx(0)
                    else if (correctIdx > i) setCorrectIdx(correctIdx - 1)
                  }}
                  className="text-zinc-400 hover:text-red-600 shrink-0"
                  aria-label="Remove option"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 pl-6">
              <span className="text-[10px] font-mono font-bold text-zinc-400 w-12 shrink-0">
                UR {i + 1}
              </span>
              <input
                value={optionsUr[i] || ''}
                onChange={(e) => {
                  const next = [...optionsUr]
                  next[i] = e.target.value
                  setOptionsUr(next)
                }}
                placeholder={`اردو آپشن ${i + 1}`}
                className={`${inputStyle} flex-1 font-nastaliq text-right`}
                dir="rtl"
              />
            </div>
          </div>
        ))}
        
        <div className="flex gap-2">
          {options.length < 6 && (
            <button
              type="button"
              onClick={() => {
                setOptions([...options, ''])
                setOptionsUr([...optionsUr, ''])
              }}
              className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold"
            >
              + Add option
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-zinc-100">
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
  'w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white'

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
