export interface MCQ {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  textContent: string;
  mcq: MCQ[];
}

export interface Course {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  modules: { id: string; title: string; duration: string }[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_LMS_API_URL || 'http://localhost:5000/api';

export async function getCourses(): Promise<Course[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/courses`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      console.error("Failed to fetch courses, status:", res.status);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error("Error in getCourses:", err);
    return [];
  }
}

export async function getCourseById(courseId: string): Promise<Course | undefined> {
  try {
    const res = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      return undefined;
    }
    return await res.json();
  } catch (err) {
    console.error(`Error in getCourseById(${courseId}):`, err);
    return undefined;
  }
}

export async function getLessonById(lessonId: string): Promise<Lesson | undefined> {
  try {
    const res = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      return undefined;
    }
    return await res.json();
  } catch (err) {
    console.error(`Error in getLessonById(${lessonId}):`, err);
    return undefined;
  }
}

export async function getProgress(userId: string, courseId: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/progress/${userId}/${courseId}`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error(`Error in getProgress(${userId}, ${courseId}):`, err);
    return [];
  }
}

export async function saveProgress(userId: string, courseId: string, lessonId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, courseId, lessonId }),
    });
    return res.ok;
  } catch (err) {
    console.error("Error in saveProgress:", err);
    return false;
  }
}

