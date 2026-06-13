import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Typography, Box,
} from '@mui/material'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { workplaceSiteApi } from '../../api/workplaceSiteApi'
import type { WorkplaceSite, WorkplaceSiteRequest } from '../../types/workplaceSite.types'
import { FormTable, FormRow, FormLabel, FormCell } from '../common/FormTable'
import DatePickerField from '../common/DatePickerField'
import UserSelectModal, { UserInfo } from '../common/UserSelectModal'
import DevTestFillButton from '../common/DevTestFillButton'
import { useAlert } from '../../contexts/AlertContext'

const SITE_TYPES = ['제조', '영업', '물류', '연구', '본사']
const INDUSTRIES = ['도시가스', '도시가스 생산', '도시가스 판매', '가스 운송', '기타']
const RISK_GRADES = ['A', 'B', 'C', 'D']
const OPERATION_STATUSES = [
  { code: 'ACTIVE',    label: '운영중' },
  { code: 'SUSPENDED', label: '일시중지' },
  { code: 'CLOSED',    label: '폐쇄' },
]

interface Props {
  open: boolean
  editing: WorkplaceSite | null  // null = 신규 등록
  onClose: () => void
}

const emptyForm: WorkplaceSiteRequest = {
  siteName: '',
  operationStatus: 'ACTIVE',
}

const WorkplaceSiteFormDialog: React.FC<Props> = ({ open, editing, onClose }) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { showSuccess, showError } = useAlert()
  const [form, setForm] = useState<WorkplaceSiteRequest>(emptyForm)
  const [sheManagerModalOpen, setSheManagerModalOpen] = useState(false)

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          siteName: editing.siteName,
          siteCode: editing.siteCode,
          siteType: editing.siteType,
          industry: editing.industry,
          address: editing.address,
          businessRegNo: editing.businessRegNo,
          sheManager: editing.sheManager,
          establishedDate: editing.establishedDate,
          representativeContact: editing.representativeContact,
          riskGrade: editing.riskGrade,
          operationStatus: editing.operationStatus,
          notes: editing.notes,
        })
      } else {
        setForm(emptyForm)
      }
    }
  }, [open, editing])

  const createM = useMutation({
    mutationFn: (req: WorkplaceSiteRequest) => workplaceSiteApi.create(req),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['workplaceSites'] })
      showSuccess(`사업장이 등록되었습니다 (${created.buildingNumber})`)
      onClose()
    },
    onError: () => showError(t('workplaceSiteFormDialog.msg1', '등록 실패')),
  })

  const updateM = useMutation({
    mutationFn: ({ id, req }: { id: number; req: WorkplaceSiteRequest }) =>
      workplaceSiteApi.update(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workplaceSites'] })
      // 사업장 이름이 바뀌면 백엔드에서 floor_drawing 테이블도 cascade rename되므로
      // 도면 캐시도 함께 무효화하지 않으면 매칭이 깨진 상태로 표시됨
      qc.invalidateQueries({ queryKey: ['floorDrawings'] })
      showSuccess(t('workplaceSiteFormDialog.msg2', '수정되었습니다'))
      onClose()
    },
    onError: () => showError(t('workplaceSiteFormDialog.msg3', '수정 실패')),
  })

  // DEV ONLY — 비어있는 항목을 사업장 도메인 더미데이터로 채움 (입력값은 보존)
  const fillTestData = () => setForm(prev => ({
    ...prev,
    siteName: prev.siteName || '서울 도시가스 공급소',
    siteCode: prev.siteCode || 'STE-001',
    siteType: prev.siteType || '제조',
    industry: prev.industry || '도시가스 생산',
    address: prev.address || '서울특별시 강서구 양천로 100',
    businessRegNo: prev.businessRegNo || '123-45-67890',
    representativeContact: prev.representativeContact || '02-1234-5678',
    riskGrade: prev.riskGrade || 'B',
    operationStatus: prev.operationStatus || 'ACTIVE',
    notes: prev.notes || '도시가스 공급 사업장 (테스트 데이터)',
  }))

  const handleSave = () => {
    if (!form.siteName?.trim()) {
      showError(t('workplaceSiteFormDialog.msg4', '사업장명을 입력하세요'))
      return
    }
    if (editing) updateM.mutate({ id: editing.id, req: form })
    else createM.mutate(form)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="subtitle1" fontWeight={700}>
          {editing ? `사업장 수정 — ${editing.buildingNumber}` : '사업장 신규 등록'}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <FormTable>
          {/* Row 1: 건물 넘버링 (자동) */}
          <FormRow>
            <FormLabel>건물 넘버링</FormLabel>
            <FormCell>
              {editing ? (
                <Typography variant="body2" fontFamily="monospace" fontWeight={700} sx={{ color: 'primary.main' }}>
                  {editing.buildingNumber}
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  신규 등록 시 자동 부여 (B30-NNNN)
                </Typography>
              )}
            </FormCell>
          </FormRow>

          {/* Row 2: 사업장명 | 사업장코드 */}
          <FormRow>
            <FormLabel required>사업장명</FormLabel>
            <FormCell borderRight>
              <TextField fullWidth size="small" value={form.siteName || ''}
                onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
            </FormCell>
            <FormLabel>사업장코드</FormLabel>
            <FormCell>
              <TextField fullWidth size="small" value={form.siteCode || ''}
                onChange={(e) => setForm({ ...form, siteCode: e.target.value })} />
            </FormCell>
          </FormRow>

          {/* Row 3: 사업장유형 | 업종 */}
          <FormRow>
            <FormLabel>사업장유형</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.siteType || ''}
                SelectProps={{ displayEmpty: true }}
                onChange={(e) => setForm({ ...form, siteType: e.target.value })}>
                <MenuItem value=""><em style={{ color: '#9e9e9e', fontStyle: 'normal' }}>선택하세요</em></MenuItem>
                {SITE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel>업종</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.industry || ''}
                SelectProps={{ displayEmpty: true }}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}>
                <MenuItem value=""><em style={{ color: '#9e9e9e', fontStyle: 'normal' }}>선택하세요</em></MenuItem>
                {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>

          {/* Row 4: 주소 | 사업자등록번호 */}
          <FormRow>
            <FormLabel>주소</FormLabel>
            <FormCell borderRight>
              <TextField fullWidth size="small" value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </FormCell>
            <FormLabel>사업자등록번호</FormLabel>
            <FormCell>
              <TextField fullWidth size="small" placeholder="000-00-00000" value={form.businessRegNo || ''}
                onChange={(e) => setForm({ ...form, businessRegNo: e.target.value })} />
            </FormCell>
          </FormRow>

          {/* Row 5: SHE담당자 | 설립일 */}
          <FormRow>
            <FormLabel>SHE담당자</FormLabel>
            <FormCell borderRight>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
                <TextField fullWidth size="small" InputProps={{ readOnly: true }}
                  placeholder="조직도에서 선택"
                  value={form.sheManager || ''} />
                <Button variant="outlined" size="small" sx={{ minWidth: 40 }}
                  onClick={() => setSheManagerModalOpen(true)}>
                  <PersonSearchIcon fontSize="small" />
                </Button>
              </Box>
            </FormCell>
            <FormLabel>설립일</FormLabel>
            <FormCell>
              <DatePickerField value={form.establishedDate || null}
                onChange={(d) => setForm({ ...form, establishedDate: d || undefined })} />
            </FormCell>
          </FormRow>

          {/* Row 6: 대표연락처 | 위험등급 */}
          <FormRow>
            <FormLabel>대표연락처</FormLabel>
            <FormCell borderRight>
              <TextField fullWidth size="small" value={form.representativeContact || ''}
                onChange={(e) => setForm({ ...form, representativeContact: e.target.value })} />
            </FormCell>
            <FormLabel>위험등급</FormLabel>
            <FormCell>
              <TextField select fullWidth size="small" value={form.riskGrade || ''}
                SelectProps={{ displayEmpty: true }}
                onChange={(e) => setForm({ ...form, riskGrade: e.target.value })}>
                <MenuItem value=""><em style={{ color: '#9e9e9e', fontStyle: 'normal' }}>선택하세요</em></MenuItem>
                {RISK_GRADES.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            </FormCell>
          </FormRow>

          {/* Row 7: 운영상태 | 비고 */}
          <FormRow>
            <FormLabel>운영상태</FormLabel>
            <FormCell borderRight>
              <TextField select fullWidth size="small" value={form.operationStatus || 'ACTIVE'}
                onChange={(e) => setForm({ ...form, operationStatus: e.target.value })}>
                {OPERATION_STATUSES.map(s => <MenuItem key={s.code} value={s.code}>{s.label}</MenuItem>)}
              </TextField>
            </FormCell>
            <FormLabel>비고</FormLabel>
            <FormCell>
              <TextField fullWidth size="small" value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </FormCell>
          </FormRow>
        </FormTable>
      </DialogContent>
      <DialogActions>
        {!editing && <DevTestFillButton onFill={fillTestData} />}
        <Button variant="outlined" onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleSave} disabled={createM.isPending || updateM.isPending}>
          저장
        </Button>
      </DialogActions>

      {/* SHE담당자 선택 모달 */}
      <UserSelectModal
        open={sheManagerModalOpen}
        onClose={() => setSheManagerModalOpen(false)}
        selectedUsers={[]}
        singleSelect
        title="SHE담당자 선택"
        onConfirm={(users: UserInfo[]) => {
          if (users[0]) {
            setForm({ ...form, sheManager: users[0].name })
          }
          setSheManagerModalOpen(false)
        }}
      />
    </Dialog>
  )
}

export default WorkplaceSiteFormDialog
