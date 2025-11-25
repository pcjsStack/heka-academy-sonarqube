export interface CourseLeaderboard {
  id: number
  name: string
  shortName: string
  description: string
}

export interface LeaderBoardItem {
  user: {
    id: number
    firstName: string
    surname: string
    email: string
    externalId: string
    username: string
    status: string
    languageId: number
    image: string
  }
  percentage: number
  updatedAt: string
}
export interface LeaderboardParams {
  ownerType: 'course' | 'lessons'
  ownerId?: number
  perPage?: number
  page?: number
}
