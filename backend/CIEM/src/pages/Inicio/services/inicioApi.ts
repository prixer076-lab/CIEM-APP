import { apiRequest } from '../../../shared/api/apiClient'
import type { AuthSession } from '../../../shared/auth/authStorage'
import type { InicioCategory, InicioPost } from '../types/inicioTypes'

type FeedPostsResponse = {
  items: InicioPost[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

type CreateFeedPostInput = {
  body: string
  category: InicioCategory
  badge: string
  hashtags: string[]
  isSos: boolean
  sosTitle?: string
}

type DeleteFeedPostResponse = {
  deleted: boolean
  id: string
}

type ToggleLikeResponse = {
  likes: number
  isLiked: boolean
}

type DeleteCommentResponse = {
  deleted: boolean
  id: string
}

export async function getFeedPostsRequest(
  session?: AuthSession | null,
  filter?: 'todo' | InicioCategory,
  search?: string,
) {
  const params = new URLSearchParams()

  if (filter && filter !== 'todo') {
    params.set('filter', filter)
  }

  if (search?.trim()) {
    params.set('search', search.trim())
  }

  const path = params.size ? `/feed/posts?${params.toString()}` : '/feed/posts'
  const response = await apiRequest<FeedPostsResponse>(path, {
    token: session?.accessToken,
    headers: session
      ? {
          'x-user-id': session.user.id,
        }
      : undefined,
  })
  return response.items
}

export function createFeedPostRequest(session: AuthSession, payload: CreateFeedPostInput) {
  return apiRequest<InicioPost>('/feed/posts', {
    method: 'POST',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
    body: payload,
  })
}

export function updateFeedPostRequest(session: AuthSession, postId: string | number, payload: CreateFeedPostInput) {
  return apiRequest<InicioPost>(`/feed/posts/${postId}`, {
    method: 'PATCH',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
    body: payload,
  })
}

export function deleteFeedPostRequest(session: AuthSession, postId: string | number) {
  return apiRequest<DeleteFeedPostResponse>(`/feed/posts/${postId}`, {
    method: 'DELETE',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  })
}

export function likeFeedPostRequest(session: AuthSession, postId: string | number) {
  return apiRequest<ToggleLikeResponse>(`/feed/posts/${postId}/likes`, {
    method: 'POST',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  })
}

export function unlikeFeedPostRequest(session: AuthSession, postId: string | number) {
  return apiRequest<ToggleLikeResponse>(`/feed/posts/${postId}/likes`, {
    method: 'DELETE',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  })
}

export function createFeedCommentRequest(session: AuthSession, postId: string | number, body: string) {
  return apiRequest<{
    id: string
    author: string
    text: string
    time: string
  }>(`/feed/posts/${postId}/comments`, {
    method: 'POST',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
    body: {
      body,
    },
  })
}

export function deleteFeedCommentRequest(
  session: AuthSession,
  postId: string | number,
  commentId: string | number,
) {
  return apiRequest<DeleteCommentResponse>(`/feed/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  })
}
