import type { ActiveToken } from './types'

export function getActiveToken(value: string, cursorPosition: number): ActiveToken {
  const cursor = Math.min(Math.max(cursorPosition, 0), value.length)
  const tokenStart = value.lastIndexOf(' ', Math.max(0, cursor - 1)) + 1
  const nextSpace = value.indexOf(' ', cursor)
  const tokenEnd = nextSpace === -1 ? value.length : nextSpace

  return {
    start: tokenStart,
    end: tokenEnd,
    text: value.slice(tokenStart, tokenEnd),
  }
}

export function withoutToken(value: string, token: ActiveToken) {
  return `${value.slice(0, token.start)}${value.slice(token.end)}`.replace(/\s{2,}/g, ' ').trim()
}

export function replaceToken(value: string, token: ActiveToken, replacement: string) {
  return {
    value: `${value.slice(0, token.start)}${replacement}${value.slice(token.end)}`,
    caretIndex: token.start + replacement.length,
  }
}
