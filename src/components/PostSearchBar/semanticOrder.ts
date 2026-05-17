import type { Ref } from 'vue'
import type { SemanticTokenOrderItem } from './types'

export function useSemanticTokenOrder(semanticTokenOrder: Ref<SemanticTokenOrderItem[]>) {
  function appendTagOrder(tagName: string) {
    removeOrderItems((item) => item.kind === 'tag' && item.tagName === tagName)
    appendOrderItem({ id: `order-tag-${tagName}`, kind: 'tag', tagName })
  }

  function appendOrderItem(item: SemanticTokenOrderItem) {
    semanticTokenOrder.value = [...semanticTokenOrder.value, item]
  }

  function removeOrderItems(predicate: (item: SemanticTokenOrderItem) => boolean) {
    semanticTokenOrder.value = semanticTokenOrder.value.filter((item) => !predicate(item))
  }

  function replaceDraftOrderItem(draftId: string, replacement: SemanticTokenOrderItem) {
    const orderIndex = semanticTokenOrder.value.findIndex(
      (item) => item.kind === 'draft' && item.draftId === draftId,
    )

    if (orderIndex === -1) {
      appendOrderItem(replacement)
      return
    }

    semanticTokenOrder.value = semanticTokenOrder.value.map((item, index) =>
      index === orderIndex ? replacement : item,
    )
  }

  function replaceOrderAtIndex(index: number, replacement: SemanticTokenOrderItem) {
    if (index < 0) {
      appendOrderItem(replacement)
      return
    }

    semanticTokenOrder.value = semanticTokenOrder.value.map((item, itemIndex) =>
      itemIndex === index ? replacement : item,
    )
  }

  return {
    appendOrderItem,
    appendTagOrder,
    removeOrderItems,
    replaceDraftOrderItem,
    replaceOrderAtIndex,
  }
}
