import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Button, Chip, Stack, Tooltip, Typography } from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CloseIcon from '@mui/icons-material/Close'
import { itemAttachmentApi } from '../../api/itemAttachmentApi'

interface ItemAttachmentCellProps {
  entityType: string
  itemId?: number | null
  /** 편집 모드 여부. false 면 칩만 노출(다운로드만 가능). */
  editing?: boolean

  // 부모(parent)가 보류 상태를 관리하는 controlled 모드용 props.
  pendingUploads?: File[]                 // 추가 예정인 새 파일들
  pendingDeleteIds?: number[]             // 삭제 예정으로 마크된 기존 파일 id 목록
  onAddPending?: (files: File[]) => void
  onRemovePending?: (index: number) => void   // 보류 업로드 취소
  onMarkDelete?: (fileId: number) => void
  onUnmarkDelete?: (fileId: number) => void
}

/**
 * 항목 단위 첨부파일 셀.
 * - 부모의 "저장" 클릭 전까지는 업로드/삭제가 서버에 반영되지 않는다 (pending 상태로 유지).
 * - 부모가 보류 상태(pendingUploads / pendingDeleteIds) 와 콜백을 props 로 내려주면 controlled 모드로 동작.
 * - itemId 가 없으면(아직 저장되지 않은 신규 행) 안내 메시지만 노출.
 */
const ItemAttachmentCell: React.FC<ItemAttachmentCellProps> = ({
  entityType,
  itemId,
  editing,
  pendingUploads,
  pendingDeleteIds,
  onAddPending,
  onRemovePending,
  onMarkDelete,
  onUnmarkDelete,
}) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const queryKey = ['itemAttachments', entityType, itemId]
  const { data: files = [] } = useQuery({
    queryKey,
    queryFn: () => itemAttachmentApi.list(entityType, itemId!),
    enabled: !!itemId,
  })

  const handlePickFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    onAddPending?.(Array.from(fileList))
  }

  if (!itemId) {
    return (
      <Typography variant="caption" color="text.secondary">
        {t('evalSheet.saveFirstForAttachment', '저장 후 첨부 가능')}
      </Typography>
    )
  }

  const pendingDeleteSet = new Set(pendingDeleteIds || [])

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ alignItems: 'center' }}>
      {/* 기존 서버 파일들 — 삭제 마크된 항목은 line-through */}
      {files.map(f => {
        const markedDelete = pendingDeleteSet.has(f.id)
        return (
          <Chip
            key={f.id}
            size="small"
            icon={<AttachFileIcon fontSize="small" />}
            label={
              <Tooltip title={f.originalFilename}>
                <Box
                  component="span"
                  sx={{
                    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle',
                    textDecoration: markedDelete ? 'line-through' : 'none',
                  }}
                >
                  {f.originalFilename}
                </Box>
              </Tooltip>
            }
            onClick={() => {
              if (markedDelete) onUnmarkDelete?.(f.id)
              else window.open(`/api/files/${f.id}`, '_blank')
            }}
            deleteIcon={editing ? <CloseIcon fontSize="small" /> : undefined}
            onDelete={editing && !markedDelete ? () => onMarkDelete?.(f.id) : undefined}
            color={markedDelete ? 'default' : undefined}
            variant={markedDelete ? 'outlined' : 'filled'}
          />
        )
      })}

      {/* 보류 업로드(저장 전) — info outline 으로 표시 */}
      {editing && (pendingUploads || []).map((file, fIdx) => (
        <Chip
          key={`pending-${fIdx}`}
          size="small"
          icon={<AttachFileIcon fontSize="small" />}
          label={
            <Tooltip title={file.name}>
              <Box component="span" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }}>
                {file.name}
              </Box>
            </Tooltip>
          }
          color="info"
          variant="outlined"
          deleteIcon={<CloseIcon fontSize="small" />}
          onDelete={() => onRemovePending?.(fIdx)}
        />
      ))}

      {/* 파일 추가 버튼 — 편집 모드에서만 */}
      {editing && (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => { handlePickFiles(e.target.files); if (e.target) e.target.value = '' }}
          />
          <Button
            size="small"
            variant="text"
            startIcon={<AttachFileIcon fontSize="small" />}
            onClick={() => inputRef.current?.click()}
          >
            {t('evalSheet.addFile', '파일추가')}
          </Button>
        </>
      )}
    </Stack>
  )
}

export default ItemAttachmentCell
