import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Typography, TextField, Button, IconButton, Paper, Stack,
  CircularProgress, Divider,
} from '@mui/material'
import ReplyIcon from '@mui/icons-material/Reply'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useAlert } from '../../contexts/AlertContext'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import type { ApiResponse } from '../../types/common.types'
import LoadingOverlay from '../common/LoadingOverlay'
import { formatDateTime } from '../../utils/dateDefaults'

export interface EhsAlertComment {
  id: number
  alertId: number
  parentId: number | null
  content: string
  authorName: string
  authorDept?: string
  authorEmail?: string
  createdAt: string
  modifiedAt?: string
}

const fetchComments = async (alertId: number): Promise<EhsAlertComment[]> => {
  const res = await axiosInstance.get<ApiResponse<EhsAlertComment[]>>(`/alerts/${alertId}/comments`)
  return res.data.data
}

const createComment = async (alertId: number, body: Partial<EhsAlertComment>) => {
  const res = await axiosInstance.post<ApiResponse<EhsAlertComment>>(`/alerts/${alertId}/comments`, body)
  return res.data.data
}

const updateComment = async (commentId: number, content: string) => {
  const res = await axiosInstance.put<ApiResponse<EhsAlertComment>>(`/alerts/comments/${commentId}`, { content })
  return res.data.data
}

const deleteComment = async (commentId: number) => {
  await axiosInstance.delete(`/alerts/comments/${commentId}`)
}

interface CommentRowProps {
  comment: EhsAlertComment
  isReply?: boolean
  myName?: string
  replyOpenId: number | null
  editOpenId: number | null
  replyText: string
  editText: string
  onReplyToggle: (id: number | null) => void
  onEditToggle: (id: number | null, initial?: string) => void
  onReplyTextChange: (s: string) => void
  onEditTextChange: (s: string) => void
  onSubmitReply: (parentId: number) => void
  onSubmitEdit: (id: number) => void
  onDelete: (id: number) => void
  pending: boolean
}

const CommentRow: React.FC<CommentRowProps> = ({
  comment, isReply, myName,
  replyOpenId, editOpenId, replyText, editText,
  onReplyToggle, onEditToggle, onReplyTextChange, onEditTextChange,
  onSubmitReply, onSubmitEdit, onDelete, pending,
}) => {
  const canModify = !!myName && comment.authorName === myName
  const isReplyOpen = replyOpenId === comment.id
  const isEditOpen = editOpenId === comment.id

  return (
    <Box sx={{
      pl: isReply ? { xs: 2, md: 4 } : 0,
      borderLeft: isReply ? 2 : 0,
      borderColor: 'primary.light',
      ml: isReply ? { xs: 1, md: 2 } : 0,
    }}>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: isReply ? 'grey.50' : 'background.paper' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
          <Box>
            <Typography variant="body2" fontWeight={700} component="span">{comment.authorName}</Typography>
            {comment.authorDept && (
              <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 1 }}>
                {comment.authorDept}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 1 }}>
              {formatDateTime(comment.createdAt)}
              {comment.modifiedAt && comment.modifiedAt !== comment.createdAt && ' (수정됨)'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            {!isReply && (
              <IconButton size="small" onClick={() => onReplyToggle(isReplyOpen ? null : comment.id)} title="답글">
                <ReplyIcon fontSize="inherit" />
              </IconButton>
            )}
            {canModify && (
              <>
                <IconButton size="small" onClick={() => onEditToggle(isEditOpen ? null : comment.id, comment.content)} title="수정">
                  <EditIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(comment.id)} title="삭제">
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </>
            )}
          </Stack>
        </Stack>

        {isEditOpen ? (
          <Box sx={{ mt: 1 }}>
            <TextField fullWidth multiline minRows={2} size="small" value={editText} onChange={(e) => onEditTextChange(e.target.value)} />
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button size="small" variant="outlined" onClick={() => onEditToggle(null)}>취소</Button>
              <Button size="small" variant="contained" disabled={!editText.trim() || pending} onClick={() => onSubmitEdit(comment.id)}>저장</Button>
            </Stack>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
            {comment.content}
          </Typography>
        )}

        {isReplyOpen && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <TextField fullWidth multiline minRows={2} size="small" placeholder={`@${comment.authorName} 님에게 답글...`}
              value={replyText} onChange={(e) => onReplyTextChange(e.target.value)} />
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button size="small" variant="outlined" onClick={() => onReplyToggle(null)}>취소</Button>
              <Button size="small" variant="contained" disabled={!replyText.trim() || pending} onClick={() => onSubmitReply(comment.id)}>답글 등록</Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

interface Props {
  alertId: number
}

const EhsAlertCommentsSection: React.FC<Props> = ({ alertId }) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { user } = useAuth()
  const { showConfirm, showError } = useAlert()
  const myName = user?.name

  const [newComment, setNewComment] = useState('')
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null)
  const [editOpenId, setEditOpenId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editText, setEditText] = useState('')

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['ehsAlertComments', alertId],
    queryFn: () => fetchComments(alertId),
    enabled: !!alertId,
  })

  // 트리화: 최상위 + 자식 묶기
  const tree = useMemo(() => {
    const tops = comments.filter(c => !c.parentId)
    return tops.map(top => ({
      ...top,
      children: comments.filter(c => c.parentId === top.id),
    }))
  }, [comments])

  const createMut = useMutation({
    mutationFn: (body: Partial<EhsAlertComment>) => createComment(alertId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ehsAlertComments', alertId] })
      setNewComment(''); setReplyText(''); setReplyOpenId(null)
    },
    onError: () => showError(t('ehsAlertCommentsSection.msg1', '댓글 등록에 실패했습니다.')),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => updateComment(id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ehsAlertComments', alertId] })
      setEditOpenId(null); setEditText('')
    },
    onError: () => showError(t('ehsAlertCommentsSection.msg2', '수정에 실패했습니다.')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ehsAlertComments', alertId] }),
    onError: () => showError(t('ehsAlertCommentsSection.msg3', '삭제에 실패했습니다.')),
  })

  const handleNewSubmit = () => {
    if (!newComment.trim()) return
    createMut.mutate({ content: newComment.trim(), parentId: null })
  }

  const handleReplySubmit = (parentId: number) => {
    if (!replyText.trim()) return
    createMut.mutate({ content: replyText.trim(), parentId })
  }

  const handleEditToggle = (id: number | null, initial?: string) => {
    setEditOpenId(id)
    setEditText(initial || '')
  }

  const handleEditSubmit = (id: number) => {
    if (!editText.trim()) return
    updateMut.mutate({ id, content: editText.trim() })
  }

  const handleDelete = async (id: number) => {
    if (await showConfirm(t('ehsAlertCommentsSection.msg4', '삭제하시겠습니까? 답글이 있는 경우 함께 삭제됩니다.'))) {
      deleteMut.mutate(id)
    }
  }

  const overlayMessage = createMut.isPending ? '댓글 저장 중...'
    : updateMut.isPending ? '댓글 수정 중...'
    : deleteMut.isPending ? '댓글 삭제 중...'
    : ''

  return (
    <Box sx={{ mt: 4 }}>
      <LoadingOverlay open={createMut.isPending || updateMut.isPending || deleteMut.isPending} message={overlayMessage} />
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        댓글 {comments.length > 0 && <Typography component="span" color="primary.main" fontWeight={700}>({comments.length})</Typography>}
      </Typography>

      {/* 새 댓글 입력 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <TextField fullWidth multiline minRows={2} size="small" placeholder="댓글을 입력하세요..."
          value={newComment} onChange={(e) => setNewComment(e.target.value)} />
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
          <Button variant="contained" size="small" onClick={handleNewSubmit}
            disabled={!newComment.trim() || createMut.isPending}>
            등록
          </Button>
        </Stack>
      </Paper>

      <Divider sx={{ mb: 2 }} />

      {/* 댓글 목록 */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : tree.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
          첫 번째 댓글을 남겨보세요.
        </Typography>
      ) : (
        <Box>
          {tree.map(top => (
            <Box key={top.id}>
              <CommentRow
                comment={top}
                myName={myName}
                replyOpenId={replyOpenId}
                editOpenId={editOpenId}
                replyText={replyText}
                editText={editText}
                onReplyToggle={(id) => { setReplyOpenId(id); setReplyText('') }}
                onEditToggle={handleEditToggle}
                onReplyTextChange={setReplyText}
                onEditTextChange={setEditText}
                onSubmitReply={handleReplySubmit}
                onSubmitEdit={handleEditSubmit}
                onDelete={handleDelete}
                pending={createMut.isPending || updateMut.isPending}
              />
              {top.children.map(child => (
                <CommentRow
                  key={child.id}
                  comment={child}
                  isReply
                  myName={myName}
                  replyOpenId={replyOpenId}
                  editOpenId={editOpenId}
                  replyText={replyText}
                  editText={editText}
                  onReplyToggle={(id) => { setReplyOpenId(id); setReplyText('') }}
                  onEditToggle={handleEditToggle}
                  onReplyTextChange={setReplyText}
                  onEditTextChange={setEditText}
                  onSubmitReply={handleReplySubmit}
                  onSubmitEdit={handleEditSubmit}
                  onDelete={handleDelete}
                  pending={createMut.isPending || updateMut.isPending}
                />
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default EhsAlertCommentsSection
