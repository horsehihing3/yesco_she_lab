export interface QnaPost {
  id: number
  title: string
  content: string
  category: string
  authorName: string
  authorDept: string
  authorPosition?: string
  authorEmail: string
  views: number
  isAnswered: boolean
  answer: string | null
  answerAuthorName: string | null
  answerAuthorDept: string | null
  answerDate: string | null
  isPublic: boolean
  createdAt: string
  modifiedAt: string
}

export interface QnaPostRequest {
  title: string
  content?: string
  category?: string
  authorName?: string
  authorDept?: string
  authorPosition?: string
  authorEmail?: string
  isPublic?: boolean
}

export interface QnaAnswerRequest {
  answer: string
  answerAuthorName?: string
  answerAuthorDept?: string
}
