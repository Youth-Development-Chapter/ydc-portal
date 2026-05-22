# Course JSON Import Schema

This guide explains the JSON structure used to import courses, modules, chapters/lessons, and quizzes into the YDC Portal LMS database.

---

## 1. Video URL Formats

The LMS automatically detects and renders two types of video links:

1. **YouTube Videos (Recommended)**: You can paste standard YouTube URLs. The player automatically extracts the video ID and renders them inside a secure `iframe`.
   - **Standard URL**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - **Share URL**: `https://youtu.be/dQw4w9WgXcQ`
   - **Embed URL**: `https://www.youtube.com/embed/dQw4w9WgXcQ`
2. **Direct Video Files**: Links that point directly to video files (such as `.mp4` URLs hosted on Cloudflare R2, AWS S3, or standard servers). These are rendered in a native HTML5 video player.
   - **Example**: `https://www.w3schools.com/html/mov_bbb.mp4`

---

## 2. JSON Structure Specifications

All IDs (`id` fields for course, module, and lesson) must contain only **lowercase letters, numbers, dashes, or underscores** (regex: `/^[a-z0-9_-]+$/`).

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **course.id** | string | Yes | Lowercase slug (e.g. `deenyat`, `seerat-advanced`). |
| **course.title** | string | Yes | The name of the course. |
| **course.author** | string | Yes | The author/instructor name. |
| **course.description** | string | No | A short summary of what the course covers. |
| **course.imageUrl** | string | No | A public image URL for the course card. |
| **course.rewardPoints** | integer | No | Coin reward upon course completion. Default is `50`. |
| **course.modules** | array | No | Nested modules/chapters of the course. |

### Module Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **module.id** | string | Yes | Unique ID slug within the course (e.g. `d_m1`). |
| **module.title** | string | Yes | The title of this module/unit. |
| **module.duration** | string | No | Duration label (e.g., `45 mins`, `2 hours`). |
| **module.orderIndex** | integer | Yes | Sorting order (1, 2, 3...). |
| **module.lessons** | array | No | Nested lessons within this module. |

### Lesson Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **lesson.id** | string | Yes | Unique ID slug within the course (e.g. `d_m1_l1`). |
| **lesson.title** | string | Yes | The title of this lesson chapter. |
| **lesson.videoUrl** | string | No | Direct video MP4 link or YouTube watch link. |
| **lesson.textContent** | string | Yes | Rich HTML lesson content. |
| **lesson.orderIndex** | integer | Yes | Sorting order within the module (1, 2, 3...). |
| **lesson.mcqs** | array | No | Multiple-choice quiz questions for this lesson. |

### MCQ Quiz Fields
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **mcq.question** | string | Yes | The question text. |
| **mcq.options** | array of strings | Yes | A list of choice strings (minimum 2 options). |
| **mcq.correctAnswerIndex** | integer | Yes | The 0-based index of the correct option. |

---

## 3. Complete JSON Template Example

Here is a template you can copy, paste, and modify:

```json
{
  "id": "islamic-history-101",
  "title": "Introduction to Islamic History",
  "author": "Dr. Tariq Mahmood",
  "description": "An introductory course on the key events, empires, and cultural developments of the early Islamic civilization.",
  "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e",
  "rewardPoints": 100,
  "modules": [
    {
      "id": "ih_m1",
      "title": "The Golden Age of Baghdad",
      "duration": "1 hour",
      "orderIndex": 1,
      "lessons": [
        {
          "id": "ih_m1_l1",
          "title": "The House of Wisdom",
          "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          "textContent": "<p>The <strong>House of Wisdom</strong> (Bayt al-Hikma) was a major intellectual hub established in Baghdad during the Abbasid Era...</p><p>Scholars translated classical Greek, Persian, and Sanskrit works into Arabic, laying the groundwork for algebra, astronomy, and modern medicine.</p>",
          "orderIndex": 1,
          "mcqs": [
            {
              "question": "In which city was the House of Wisdom located?",
              "options": [
                "Makkah",
                "Damascus",
                "Baghdad",
                "Cairo"
              ],
              "correctAnswerIndex": 2
            },
            {
              "question": "What was the primary language used for translation in Bayt al-Hikma?",
              "options": [
                "Latin",
                "Persian",
                "Greek",
                "Arabic"
              ],
              "correctAnswerIndex": 3
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 4. AI Generator System Prompt

Copy and paste the prompt below into ChatGPT, Claude, or any LLM to generate courses in this exact format.

```text
Act as an expert curriculum designer and educational content writer. I want you to design a comprehensive course for our online learning platform. 

Generate the entire course content in a single, strictly valid JSON format conforming to the structure below. Do not include any markdown fences or conversational preambles (start directly with '{' and end with '}').

JSON Schema Requirements:
1. "id", "title", "author", "description", "imageUrl", and "rewardPoints" (integer) at the course root.
2. "modules" is an array of objects. Each module has "id", "title", "duration" (e.g. "30 mins"), "orderIndex" (integer starting at 1), and "lessons" (array).
3. Each lesson has "id", "title", "videoUrl" (YouTube watch url or empty string/null), "textContent" (detailed lesson content formatted as HTML string with paragraphs, bold, lists, etc.), "orderIndex" (integer), and "mcqs" (array of quizzes).
4. Each MCQ has "question", "options" (array of strings), and "correctAnswerIndex" (0-based integer matching the index of the correct option in the options array).

Strict Constraint:
All "id" fields (course.id, module.id, lesson.id) must be unique slugs containing ONLY lowercase letters, numbers, dashes, or underscores.

Topic of the course: [INSERT TOPIC/TITLE HERE]
Number of modules: [INSERT MODULE COUNT]
Average chapters per module: [INSERT CHAPTER COUNT]
Average quiz questions per chapter: [INSERT QUIZ COUNT]
```
