import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { hasAdminPermission } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Authorize: must be logged in AND have can_manage_courses.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const allowed = await hasAdminPermission(user.id, 'can_manage_courses')
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('Starting custom LMS database seeding...')

    // 1. Seed Courses
    const courses = [
      {
        id: 'deenyat',
        title: 'Deenyat',
        author: 'Molana Syed Abul Ala Maududi',
        description: 'A comprehensive introduction to the fundamental beliefs and practices of Islam. This course breaks down the core concepts of faith, prayer, and character building.',
        image_url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800&q=80',
      },
      {
        id: 'seerat',
        title: 'Seerat-un-Nabi (PBUH)',
        author: 'YDC Scholars',
        description: 'An in-depth study of the life of the Prophet Muhammad (PBUH), focusing on his character, leadership, and the lessons we can apply in modern life.',
        image_url: 'https://images.unsplash.com/photo-1594951469342-eb418576426f?w=800&q=80',
      }
    ]

    for (const course of courses) {
      const { error } = await supabase.from('courses').upsert(course, { onConflict: 'id' })
      if (error) throw new Error(`Failed to seed course ${course.id}: ${error.message}`)
    }

    // 2. Seed Modules
    const modules = [
      // Deenyat Modules
      { id: 'd_m1', course_id: 'deenyat', title: 'Chapter 1: Iman (Faith)', duration: '25 mins', order_index: 1 },
      { id: 'd_m2', course_id: 'deenyat', title: 'Chapter 2: Islam (Submission)', duration: '30 mins', order_index: 2 },
      { id: 'd_m3', course_id: 'deenyat', title: 'Chapter 3: Salat (Prayer)', duration: '45 mins', order_index: 3 },
      { id: 'd_m4', course_id: 'deenyat', title: 'Chapter 4: Zakat (Charity)', duration: '35 mins', order_index: 4 },
      // Seerat Modules
      { id: 's_m1', course_id: 'seerat', title: 'Early Life in Makkah', duration: '40 mins', order_index: 1 },
      { id: 's_m2', course_id: 'seerat', title: 'The Revelation', duration: '45 mins', order_index: 2 },
      { id: 's_m3', course_id: 'seerat', title: 'Migration to Madinah', duration: '50 mins', order_index: 3 }
    ]

    for (const mod of modules) {
      const { error } = await supabase.from('modules').upsert(mod, { onConflict: 'id' })
      if (error) throw new Error(`Failed to seed module ${mod.id}: ${error.message}`)
    }

    // 3. Seed Lessons
    const lessons: Array<{
      id: string
      module_id: string
      title: string
      video_url: string | null
      text_content: string
      order_index: number
    }> = [
      // Deenyat Lessons
      {
        id: 'd_m1',
        module_id: 'd_m1',
        title: 'Chapter 1: Iman (Faith)',
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        text_content: `
          <h2>The Meaning of Iman</h2>
          <p>Iman (Faith) is the bedrock of a Muslim's life. It is not merely a blind belief, but a conviction based on reason and knowledge. The core of Iman is believing in Allah, His Angels, His Books, His Messengers, the Last Day, and Divine Decree.</p>
          <br/>
          <p>True faith manifests in one's actions. It transforms a person's character, instilling honesty, patience, and gratitude.</p>
        `,
        order_index: 1
      },
      {
        id: 'd_m2',
        module_id: 'd_m2',
        title: 'Chapter 2: Islam (Submission)',
        video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        text_content: `
          <h2>What does Islam mean?</h2>
          <p>Islam literally means peace and submission. In a spiritual context, it means submitting completely to the will of Allah. By choosing to submit to the Creator, a person aligns their life with cosmic order and experiences true internal peace.</p>
        `,
        order_index: 1
      },
      {
        id: 'd_m3',
        module_id: 'd_m3',
        title: 'Chapter 3: Salat (Prayer)',
        video_url: null,
        text_content: `
          <h2>Salat: The Spiritual Connection</h2>
          <p>Salat is the second pillar of Islam and a direct conversation with Allah. It is performed five times daily. It serves as a continuous reminder of our purpose and pulls us away from worldly distractions, keeping us grounded and spiritually alive.</p>
        `,
        order_index: 1
      },
      {
        id: 'd_m4',
        module_id: 'd_m4',
        title: 'Chapter 4: Zakat (Charity)',
        video_url: null,
        text_content: `
          <h2>Zakat: Purifying Wealth</h2>
          <p>Zakat is the third pillar of Islam. It is an obligatory charity of 2.5% of a Muslim's savings and assets above a certain threshold (Nisab) to help the poor and needy. Zakat purifies one's wealth, limits greed, and fosters social equity.</p>
        `,
        order_index: 1
      },
      // Seerat Lessons
      {
        id: 's_m1',
        module_id: 's_m1',
        title: 'Early Life in Makkah',
        video_url: null,
        text_content: `
          <h2>Early Life of the Prophet (PBUH)</h2>
          <p>The Prophet Muhammad (PBUH) was born in Makkah in the year 570 CE, in the noble family of Banu Hashim of the Quraysh tribe. Raised as an orphan by his grandfather Abdul Muttalib and later his uncle Abu Talib, he was known even in his youth as Al-Amin (the Trustworthy) and As-Sadiq (the Truthful) for his impeccable character.</p>
        `,
        order_index: 1
      },
      {
        id: 's_m2',
        module_id: 's_m2',
        title: 'The Revelation',
        video_url: null,
        text_content: `
          <h2>The First Revelation</h2>
          <p>At the age of 40, while meditating in the Cave of Hira on the Mount of Light (Jabal al-Nour) near Makkah, the Prophet Muhammad (PBUH) received the first revelation. The Angel Jibril (Gabriel) appeared to him and commanded him: "Iqra!" (Read/Recite), marking the beginning of his Prophethood.</p>
        `,
        order_index: 1
      },
      {
        id: 's_m3',
        module_id: 's_m3',
        title: 'Migration to Madinah',
        video_url: null,
        text_content: `
          <h2>The Hijrah (Migration)</h2>
          <p>In 622 CE, following severe persecution in Makkah, the Prophet (PBUH) and his companions migrated to Yathrib, which was later renamed Madinah (the City of the Prophet). This event, known as the Hijrah, marks the birth of the first Islamic state and the beginning of the Islamic Hijri calendar.</p>
        `,
        order_index: 1
      }
    ]

    for (const lesson of lessons) {
      const { error } = await supabase.from('lessons').upsert(lesson, { onConflict: 'id' })
      if (error) throw new Error(`Failed to seed lesson ${lesson.id}: ${error.message}`)
    }

    // 4. Seed MCQs
    // Clear MCQs only for the lessons we're about to re-seed, so other course MCQs aren't wiped.
    const seededLessonIds = lessons.map((l) => l.id)
    await supabase.from('mcqs').delete().in('lesson_id', seededLessonIds)

    const mcqs = [
      // d_m1
      {
        lesson_id: 'd_m1',
        question: 'What is the core meaning of Iman in Islam?',
        options: ['Blind belief without reason', 'Conviction based on reason and knowledge', 'Only performing physical rituals', 'Accepting cultural traditions'],
        correct_answer_index: 1
      },
      {
        lesson_id: 'd_m1',
        question: 'True faith manifests in which of the following?',
        options: ['Wealth and status', 'Physical strength', "One's actions and character", 'Memorizing texts without understanding'],
        correct_answer_index: 2
      },
      // d_m2
      {
        lesson_id: 'd_m2',
        question: 'What does the word Islam literally mean?',
        options: ['Peace', 'Submission', 'War', 'Both A and B'],
        correct_answer_index: 3
      },
      // d_m3
      {
        lesson_id: 'd_m3',
        question: 'How many times is Salat performed daily by a Muslim?',
        options: ['3 times', '5 times', '7 times', 'As many times as they want'],
        correct_answer_index: 1
      },
      // d_m4
      {
        lesson_id: 'd_m4',
        question: 'What percentage of savings/wealth is typically paid as Zakat?',
        options: ['1.5%', '2.5%', '5.0%', '10.0%'],
        correct_answer_index: 1
      },
      // s_m1
      {
        lesson_id: 's_m1',
        question: 'Which title was given to the Prophet (PBUH) in his youth for his honesty?',
        options: ['Al-Faruq', 'Al-Amin', 'Al-Siddiq', 'Saifullah'],
        correct_answer_index: 1
      },
      // s_m2
      {
        lesson_id: 's_m2',
        question: 'Where did the Prophet (PBUH) receive the first revelation?',
        options: ['Cave of Thawr', 'Cave of Hira', 'Mount Sinai', 'Kaaba'],
        correct_answer_index: 1
      },
      // s_m3
      {
        lesson_id: 's_m3',
        question: 'What was Madinah called before the Hijrah?',
        options: ['Taif', 'Yathrib', 'Quba', 'Khaybar'],
        correct_answer_index: 1
      }
    ]

    for (const mcq of mcqs) {
      const { error } = await supabase.from('mcqs').insert(mcq)
      if (error) throw new Error(`Failed to seed MCQ for lesson ${mcq.lesson_id}: ${error.message}`)
    }

    console.log('Custom LMS database seeded successfully!')
    return NextResponse.json({ success: true, message: 'Database seeded successfully' })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
