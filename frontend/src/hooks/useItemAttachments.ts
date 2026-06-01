import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { itemAttachmentApi } from '../api/itemAttachmentApi'

/**
 * 체크리스트/위험성평가 등 항목 단위 첨부파일의 보류(pending) 상태 관리.
 *
 * - addPending(itemId, files): 사용자가 파일 선택 → 보류 큐에 적재 (서버 호출 X)
 * - removePending(itemId, idx): 보류 업로드 취소
 * - markDelete(itemId, fileId): 기존 서버 파일을 삭제 예정으로 마크
 * - unmarkDelete(itemId, fileId): 삭제 마크 취소
 * - flush(): 부모 저장이 성공한 다음에 호출. 마크된 삭제와 보류 업로드를 실제로 서버에 반영.
 * - reset(): 보류 상태 전체 초기화 (취소 시).
 */
export function useItemAttachments(entityType: string) {
  const queryClient = useQueryClient()
  const [pendingUploads, setPendingUploads] = useState<Record<number, File[]>>({})
  const [pendingDeletes, setPendingDeletes] = useState<Record<number, number[]>>({})

  const addPending = useCallback((itemId: number, files: File[]) => {
    setPendingUploads(prev => ({ ...prev, [itemId]: [...(prev[itemId] || []), ...files] }))
  }, [])

  const removePending = useCallback((itemId: number, idx: number) => {
    setPendingUploads(prev => {
      const arr = (prev[itemId] || []).filter((_, i) => i !== idx)
      const next = { ...prev }
      if (arr.length === 0) delete next[itemId]
      else next[itemId] = arr
      return next
    })
  }, [])

  const markDelete = useCallback((itemId: number, fileId: number) => {
    setPendingDeletes(prev => {
      const arr = prev[itemId] || []
      if (arr.includes(fileId)) return prev
      return { ...prev, [itemId]: [...arr, fileId] }
    })
  }, [])

  const unmarkDelete = useCallback((itemId: number, fileId: number) => {
    setPendingDeletes(prev => {
      const arr = (prev[itemId] || []).filter(id => id !== fileId)
      const next = { ...prev }
      if (arr.length === 0) delete next[itemId]
      else next[itemId] = arr
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setPendingUploads({})
    setPendingDeletes({})
  }, [])

  const flush = useCallback(async () => {
    // 1) 삭제 먼저
    const deleteIds = Object.values(pendingDeletes).flat()
    for (const fileId of deleteIds) {
      try { await itemAttachmentApi.remove(fileId) } catch { /* skip */ }
    }
    // 2) 업로드
    const affectedItemIds: number[] = []
    for (const [itemIdStr, files] of Object.entries(pendingUploads)) {
      const itemId = Number(itemIdStr)
      affectedItemIds.push(itemId)
      for (const file of files) {
        try { await itemAttachmentApi.upload(entityType, itemId, file) } catch { /* skip */ }
      }
    }
    // 3) 영향받은 항목 캐시 무효화
    const allItemIds = new Set([
      ...affectedItemIds,
      ...Object.keys(pendingDeletes).map(Number),
    ])
    allItemIds.forEach(id => {
      queryClient.invalidateQueries({ queryKey: ['itemAttachments', entityType, id] })
    })
    setPendingUploads({})
    setPendingDeletes({})
  }, [entityType, pendingUploads, pendingDeletes, queryClient])

  const hasPending = Object.keys(pendingUploads).length > 0 || Object.keys(pendingDeletes).length > 0

  return {
    pendingUploads,
    pendingDeletes,
    addPending,
    removePending,
    markDelete,
    unmarkDelete,
    flush,
    reset,
    hasPending,
  }
}
