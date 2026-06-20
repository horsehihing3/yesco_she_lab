import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  FormControl,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import GroupIcon from '@mui/icons-material/Group'
import { useThemeMode } from '../../context/ThemeContext'
import { useAlert } from '../../contexts/AlertContext'
import axiosInstance from '../../api/axiosInstance'
import { ApiResponse } from '../../types/common.types'
import DeptUserMultiSelectModal from '../common/DeptUserMultiSelectModal'
import { UserInfo } from '../common/UserSelectModal'

interface DbUser {
  id: number
  username: string
  name: string
  email: string
  department: string
  company: string
  role: string
}

interface CompanyTreeNode {
  nodeId: string
  type: 'COMPANY' | 'GROUP' | 'USER'
  label: string
  username?: string
  department?: string
  children: CompanyTreeNode[]
}

const ROLES = [
  // 시스템 기본
  { value: 'SYSTEM_ADMIN', labelKey: 'role.systemAdmin', group: 'system' },
  { value: 'EHS_ADMIN', labelKey: 'role.ehsAdmin', group: 'system' },
  { value: 'TEAM_ADMIN', labelKey: 'role.teamAdmin', group: 'system' },
  { value: 'TEAM_MEMBER', labelKey: 'role.teamMember', group: 'system' },
  // 안전관리
  { value: 'RISK_ASSESS_ADMIN', labelKey: 'role.riskAssessAdmin', group: 'safety' },
  { value: 'NEAR_MISS_ADMIN', labelKey: 'role.nearMissAdmin', group: 'safety' },
  { value: 'AUDIT_ADMIN', labelKey: 'role.auditAdmin', group: 'safety' },
  { value: 'PERMIT_ADMIN', labelKey: 'role.permitAdmin', group: 'safety' },
  { value: 'PPE_ADMIN', labelKey: 'role.ppeAdmin', group: 'safety' },
  { value: 'TRAINING_ADMIN', labelKey: 'role.trainingAdmin', group: 'safety' },
  { value: 'EMERGENCY_ADMIN', labelKey: 'role.emergencyAdmin', group: 'safety' },
  // 보건관리
  { value: 'HEALTH_ADMIN', labelKey: 'role.healthAdmin', group: 'health' },
  { value: 'OCCUPATIONAL_ADMIN', labelKey: 'role.occupationalAdmin', group: 'health' },
  { value: 'WORK_ENV_ADMIN', labelKey: 'role.workEnvAdmin', group: 'health' },
  { value: 'ERGONOMICS_ADMIN', labelKey: 'role.ergonomicsAdmin', group: 'health' },
  // 환경관리
  { value: 'COMPLIANCE_ADMIN', labelKey: 'role.complianceAdmin', group: 'env' },
  // SHE 경영
  { value: 'QNA_ADMIN', labelKey: 'role.qnaAdmin', group: 'ehs' },
]

const ROLE_COLORS: Record<string, 'error' | 'warning' | 'info' | 'success' | 'default' | 'primary' | 'secondary'> = {
  SYSTEM_ADMIN: 'error',
  EHS_ADMIN: 'warning',
  TEAM_ADMIN: 'info',
  TEAM_MEMBER: 'success',
}

const getChipColor = (role: string) => ROLE_COLORS[role] || 'default'

const fetchDbUsers = async (): Promise<DbUser[]> => {
  const res = await axiosInstance.get<ApiResponse<DbUser[]>>('/users')
  return res.data.data
}

const fetchCompanyTree = async (): Promise<CompanyTreeNode[]> => {
  const res = await axiosInstance.get<ApiResponse<CompanyTreeNode[]>>('/users/company-tree')
  return res.data.data
}

const updateUserRole = async (uid: string, role: string): Promise<void> => {
  await axiosInstance.put(`/users/${uid}/role`, { role })
}

const RoleManageTab: React.FC = () => {
  const { t } = useTranslation()
  const { isDarkMode } = useThemeMode()
  const { showSuccess, showError, showConfirm } = useAlert()
  const queryClient = useQueryClient()

  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [roleSearch, setRoleSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const paperBg = isDarkMode ? '#18181b' : 'background.paper'

  const { data: dbUsers = [], isLoading } = useQuery({
    queryKey: ['dbUsersForRole'],
    queryFn: fetchDbUsers,
  })

  const { data: companyTree = [] } = useQuery({
    queryKey: ['companyTreeForRoleNames'],
    queryFn: fetchCompanyTree,
  })

  // 조직도에서 부서 코드 → 이름 + username → 부서명 매핑 생성
  // GROUP nodeId 형식: "group-{companyCode}-{groupCode}" — bareCode(groupCode)도 별도 매핑
  const { deptByCode, deptByUsername } = useMemo(() => {
    const codeMap: Record<string, string> = {}
    const userMap: Record<string, string> = {}
    const walk = (nodes: CompanyTreeNode[], parentLabels: string[] = []) => {
      for (const n of nodes) {
        if (n.type === 'GROUP') {
          // 전체 nodeId
          codeMap[n.nodeId] = n.label
          // groupCode 단독 (nodeId의 마지막 세그먼트)
          const segs = n.nodeId.split('-')
          const bareCode = segs[segs.length - 1]
          if (bareCode) codeMap[bareCode] = n.label
          // 사용자 자식
          n.children?.forEach(c => {
            if (c.type === 'USER' && c.username) userMap[c.username] = n.label
          })
          walk(n.children || [], [...parentLabels, n.label])
        } else if (n.type === 'COMPANY') {
          walk(n.children || [], [n.label])
        } else if (n.type === 'USER' && n.username) {
          if (n.department) userMap[n.username] = n.department
          else userMap[n.username] = parentLabels[parentLabels.length - 1] || ''
        }
      }
    }
    walk(companyTree)
    return { deptByCode: codeMap, deptByUsername: userMap }
  }, [companyTree])

  const resolveDeptName = (user: DbUser): string => {
    // 1) username 기반 매핑 (가장 정확 — USER 노드의 department 필드 = 그룹명)
    if (deptByUsername[user.username]) return deptByUsername[user.username]
    // 2) 코드 매핑 (groupCode 또는 전체 nodeId)
    if (user.department && deptByCode[user.department]) return deptByCode[user.department]
    // 3) 숫자로만 구성된 코드는 부서명 없음으로 표시
    if (user.department && /^\d+$/.test(user.department)) return ''
    // 4) 원본 그대로
    return user.department || ''
  }

  const roleMutation = useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: string }) => updateUserRole(uid, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dbUsersForRole'] })
    },
  })

  const getRoleLabel = (roleValue: string) => {
    const found = ROLES.find((r) => r.value === roleValue)
    return found ? t(found.labelKey) : roleValue || t('role.teamMember')
  }

  // 부서 매칭 여부 판단 (resolveDeptName이 "-" 또는 숫자만 반환하면 부서 없음)
  const hasDept = (user: DbUser): boolean => {
    if (deptByUsername[user.username]) return true
    if (user.department && deptByCode[user.department]) return true
    if (!user.department) return false
    if (/^\d+$/.test(user.department)) return false
    return true
  }

  // TEAM_MEMBER는 부서 있는 경우만, 그 외 역할은 부서 여부 무관 표시
  const visibleUsers = useMemo(
    () => dbUsers.filter(u => u.role !== 'TEAM_MEMBER' || hasDept(u)),
    [dbUsers, deptByUsername, deptByCode],
  )

  // 권한별 사용자 수 (부서 있는 사용자만)
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    visibleUsers.forEach((u) => { counts[u.role] = (counts[u.role] || 0) + 1 })
    return counts
  }, [visibleUsers])

  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return ROLES
    const q = roleSearch.toLowerCase()
    return ROLES.filter(r => t(r.labelKey).toLowerCase().includes(q) || r.value.toLowerCase().includes(q))
  }, [roleSearch, t])

  // 선택된 권한을 가진 사용자 (부서 있는 사용자만)
  const usersInRole = useMemo(() => {
    if (!selectedRole) return []
    return visibleUsers.filter(u => u.role === selectedRole)
  }, [visibleUsers, selectedRole])

  const totalPages = Math.ceil(usersInRole.length / rowsPerPage)
  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage
    return usersInRole.slice(start, start + rowsPerPage)
  }, [usersInRole, page, rowsPerPage])

  const handleSelectRole = (roleValue: string) => {
    setSelectedRole(roleValue)
    setPage(0)
  }

  const handleAddUsers = async (selected: UserInfo[]) => {
    if (!selectedRole || selected.length === 0) {
      setAddModalOpen(false)
      return
    }
    try {
      await Promise.all(selected.map(u => updateUserRole(u.username, selectedRole)))
      queryClient.invalidateQueries({ queryKey: ['dbUsersForRole'] })
      showSuccess(t('role.added', '권한이 부여되었습니다'))
    } catch {
      showError(t('role.updateFailed'))
    }
    setAddModalOpen(false)
  }

  const handleRemoveUser = async (user: DbUser) => {
    const ok = await showConfirm(t('role.confirmRemove', '해당 사용자의 권한을 해제하시겠습니까?'))
    if (!ok) return
    try {
      await roleMutation.mutateAsync({ uid: user.username, role: 'TEAM_MEMBER' })
      showSuccess(t('role.removed', '권한이 해제되었습니다'))
    } catch { showError(t('role.updateFailed')) }
  }

  const headerCellSx = { fontWeight: 'bold', borderRight: 1, borderColor: 'divider', wordBreak: 'keep-all' as const }
  const lastHeaderCellSx = { fontWeight: 'bold', wordBreak: 'keep-all' as const }
  const cellSx = { borderRight: 1, borderColor: 'divider' }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* PC Layout: Role List Left + User List Right */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, flex: 1, minHeight: 0 }}>
        {/* Left: Role list */}
        <Paper sx={{ width: '25%', minWidth: 280, p: 2, bgcolor: paperBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            {t('role.roleTypes', '권한 유형')}
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder={t('role.searchRole', '권한 검색')}
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <List dense disablePadding>
              {filteredRoles.map(r => {
                const count = roleCounts[r.value] || 0
                const isSelected = selectedRole === r.value
                return (
                  <ListItemButton
                    key={r.value}
                    selected={isSelected}
                    onClick={() => handleSelectRole(r.value)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <Chip
                      label={t(r.labelKey)}
                      color={getChipColor(r.value)}
                      size="small"
                      variant={isSelected ? 'filled' : 'outlined'}
                      sx={{ mr: 1 }}
                    />
                    <ListItemText
                      primary={null}
                      secondary={`${count}${t('role.personUnit', '명')}`}
                      sx={{ textAlign: 'right', '& .MuiListItemText-secondary': { fontWeight: isSelected ? 'bold' : 'normal' } }}
                    />
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        </Paper>

        {/* Right: Users with selected role */}
        <Paper sx={{ flex: 1, p: 2, bgcolor: paperBg, overflow: 'auto' }}>
          {!selectedRole ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, color: 'text.secondary' }}>
              <GroupIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography>{t('role.selectRole', '권한을 선택해 주세요')}</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={getRoleLabel(selectedRole)}
                  color={getChipColor(selectedRole)}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip label={`${usersInRole.length}${t('role.personUnit', '명')}`} size="small" variant="outlined" />
                <Box sx={{ flex: 1 }} />
                <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setAddModalOpen(true)}>
                  {t('role.addUser', '사용자 추가')}
                </Button>
              </Box>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid', borderColor: 'divider' }, '& .MuiTableCell-root:last-child': { borderRight: 'none' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ ...headerCellSx, width: 50 }}>{t('common.no')}</TableCell>
                      <TableCell align="center" sx={headerCellSx}>{t('role.name', '이름')}</TableCell>
                      <TableCell align="center" sx={headerCellSx}>{t('role.username', '계정')}</TableCell>
                      <TableCell align="center" sx={headerCellSx}>{t('role.department', '부서')}</TableCell>
                      <TableCell align="center" sx={{ ...lastHeaderCellSx, width: 70 }}>{t('common.action', '관리')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedUsers.length > 0 ? paginatedUsers.map((user, idx) => (
                      <TableRow key={user.username}>
                        <TableCell align="center" sx={cellSx}>{page * rowsPerPage + idx + 1}</TableCell>
                        <TableCell align="center" sx={cellSx}>{user.name}</TableCell>
                        <TableCell align="center" sx={cellSx}>{user.username}</TableCell>
                        <TableCell sx={cellSx}>{resolveDeptName(user)}</TableCell>
                        <TableCell align="center">
                          <Tooltip title={t('role.removeUser', '권한 해제')}>
                            <IconButton size="small" color="error" onClick={() => handleRemoveUser(user)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>{t('common.noData')}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={(_, newPage) => setPage(newPage - 1)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0) }}
                      size="small"
                     displayEmpty>
                      <MenuItem value="" disabled>선택하세요</MenuItem>
                      {[20, 50, 100].map((n) => (
                        <MenuItem key={n} value={n}>{n}건</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>

      {/* Mobile Layout */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {!selectedRole ? (
          <Paper sx={{ p: 2, bgcolor: paperBg }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              {t('role.roleTypes', '권한 유형')}
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder={t('role.searchRole', '권한 검색')}
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
            <List dense disablePadding>
              {filteredRoles.map(r => {
                const count = roleCounts[r.value] || 0
                return (
                  <ListItemButton key={r.value} onClick={() => handleSelectRole(r.value)} sx={{ borderRadius: 1, mb: 0.5 }}>
                    <Chip label={t(r.labelKey)} color={getChipColor(r.value)} size="small" sx={{ mr: 1 }} />
                    <ListItemText secondary={`${count}${t('role.personUnit', '명')}`} sx={{ textAlign: 'right' }} />
                  </ListItemButton>
                )
              })}
            </List>
          </Paper>
        ) : (
          <Paper sx={{ p: 2, bgcolor: paperBg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={() => setSelectedRole(null)}
              >
                ← {t('common.back')}
              </Typography>
              <Chip label={getRoleLabel(selectedRole)} color={getChipColor(selectedRole)} size="small" />
              <Chip label={`${usersInRole.length}${t('role.personUnit', '명')}`} size="small" variant="outlined" />
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setAddModalOpen(true)}>
                {t('common.add', '추가')}
              </Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                <Paper key={user.username} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography fontWeight="bold" variant="body2">{user.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.username} | {resolveDeptName(user)}
                      </Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleRemoveUser(user)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              )) : (
                <Typography align="center" color="text.secondary" sx={{ py: 3 }}>{t('common.noData')}</Typography>
              )}
            </Box>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(_, newPage) => setPage(newPage - 1)}
                  color="primary"
                  size="small"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Paper>
        )}
      </Box>

      {/* 사용자 추가 모달 (조직도 + 복수 선택) */}
      <DeptUserMultiSelectModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onConfirm={handleAddUsers}
        title={t('role.selectUsersFor', '권한 부여 - {{role}}', { role: selectedRole ? getRoleLabel(selectedRole) : '' })}
      />
    </Box>
  )
}

export default RoleManageTab
