import type {
  CaretPlacement,
  DateFilter,
  RenderSemanticItem,
  SemanticPill,
  SemanticTokenOrderItem,
} from './types'
import type { TagResponse } from '@/types/api'

export interface OrderedSemanticItemsOptions {
  orderItems: SemanticTokenOrderItem[]
  selectedTags: TagResponse[]
  selectedDateFilters: DateFilter[]
  draftPills: SemanticPill[]
}

export function buildOrderedSemanticItems({
  orderItems,
  selectedTags,
  selectedDateFilters,
  draftPills,
}: OrderedSemanticItemsOptions) {
  const items: RenderSemanticItem[] = []
  const seenTags = new Set<string>()
  const seenDateOperators = new Set<DateFilter['operator']>()
  const seenDraftPills = new Set<string>()

  orderItems.forEach((orderItem, orderIndex) => {
    if (orderItem.kind === 'tag') {
      const tag = selectedTags.find((selectedTag) => selectedTag.name === orderItem.tagName)

      if (tag) {
        seenTags.add(tag.name)
        items.push({ key: orderItem.id, kind: 'tag', orderIndex, tag })
      }

      return
    }

    if (orderItem.kind === 'date') {
      const dateFilter = selectedDateFilters.find((filter) => filter.operator === orderItem.operator)

      if (dateFilter) {
        seenDateOperators.add(dateFilter.operator)
        items.push({ key: orderItem.id, kind: 'date', orderIndex, dateFilter })
      }

      return
    }

    const pill = draftPills.find((draftPill) => draftPill.id === orderItem.draftId)

    if (pill) {
      seenDraftPills.add(pill.id)
      items.push({ key: orderItem.id, kind: 'draft', orderIndex, pill })
    }
  })

  selectedTags
    .filter((tag) => !seenTags.has(tag.name))
    .forEach((tag) => items.push({ key: `unordered-tag-${tag.id}`, kind: 'tag', orderIndex: -1, tag }))

  selectedDateFilters
    .filter((dateFilter) => !seenDateOperators.has(dateFilter.operator))
    .forEach((dateFilter) =>
      items.push({
        key: `unordered-date-${dateFilter.operator}`,
        kind: 'date',
        orderIndex: -1,
        dateFilter,
      }),
    )

  draftPills
    .filter((pill) => !seenDraftPills.has(pill.id))
    .forEach((pill) => items.push({ key: `unordered-draft-${pill.id}`, kind: 'draft', orderIndex: -1, pill }))

  return items
}

export function pillPrefix(pill: SemanticPill) {
  return pill.type === 'tag' ? '#' : `${pill.operator}:`
}

export function pillTitle(pill: SemanticPill) {
  return pill.type === 'tag' ? `Remove #${pill.value}` : `Remove ${pill.operator}:${pill.value}`
}

export function semanticItemText(item: RenderSemanticItem) {
  if (item.kind === 'tag') {
    return item.tag.name
  }

  if (item.kind === 'date') {
    return `${item.dateFilter.operator}:${item.dateFilter.dateValue}`
  }

  return `${pillPrefix(item.pill)}${item.pill.value}`
}

export function semanticItemTitle(item: RenderSemanticItem) {
  return `Edit ${semanticItemText(item)}`
}

export type { CaretPlacement }
