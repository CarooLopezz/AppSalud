import axios from 'axios'

export function errorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const message = error.response?.data?.message
  if (Array.isArray(message)) return message.join('. ')
  if (typeof message === 'string') return message
  return fallback
}
