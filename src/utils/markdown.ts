import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
})

export function renderMarkdown(source: string) {
  return DOMPurify.sanitize(markdown.render(source))
}
