import React, { useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
} from '@mui/material'
import { BodyComponent } from 'reactjs-human-body'
import type { PartsInput } from 'reactjs-human-body/dist/components/BodyComponent/BodyComponent'
import { HealthCheckupDetail, BodyPart, ResultStatus } from '../../types/healthCheckup.types'

// SVG part id -> region key (for click handling)
export const svgIdToRegion: Record<string, string> = {
  head: 'head',
  leftShoulder: 'leftShoulder', rightShoulder: 'rightShoulder',
  leftArm: 'leftArm', rightArm: 'rightArm',
  chest: 'chest', stomach: 'abdomen',
  leftLeg: 'leftLeg', rightLeg: 'rightLeg',
  leftHand: 'leftHand', rightHand: 'rightHand',
  leftFoot: 'leftFoot', rightFoot: 'rightFoot',
}

// Region -> grouped body parts (clicking region shows these in results)
export const regionBodyParts: Record<string, BodyPart[]> = {
  head: ['head', 'eye', 'ear', 'nose', 'mouth', 'neck'],
  chest: ['chest', 'heart', 'lung'],
  abdomen: ['abdomen', 'back', 'stomach', 'largeIntestine', 'liver', 'pancreas'],
  leftShoulder: ['leftShoulder'], rightShoulder: ['rightShoulder'],
  leftArm: ['leftArm'], rightArm: ['rightArm'],
  leftHand: ['leftHand'], rightHand: ['rightHand'],
  leftLeg: ['leftLeg', 'leftKnee'], rightLeg: ['rightLeg', 'rightKnee'],
  leftFoot: ['leftFoot', 'leftAnkle'], rightFoot: ['rightFoot', 'rightAnkle'],
}

// Region -> SVG element ids (for color/highlight)
export const regionSvgIds: Record<string, string[]> = {
  head: ['head'],
  chest: ['chest'],
  abdomen: ['stomach'],
  leftShoulder: ['leftShoulder'], rightShoulder: ['rightShoulder'],
  leftArm: ['leftArm'], rightArm: ['rightArm'],
  leftHand: ['leftHand'], rightHand: ['rightHand'],
  leftLeg: ['leftLeg'], rightLeg: ['rightLeg'],
  leftFoot: ['leftFoot'], rightFoot: ['rightFoot'],
}

export const getResultStatusColor = (status: ResultStatus): 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'normal': return 'success'
    case 'caution': return 'warning'
    case 'abnormal': return 'error'
    default: return 'success'
  }
}

const BodyDiagram: React.FC<{
  details: HealthCheckupDetail[]
  selectedRegion: string | null
  onRegionClick: (region: string) => void
  filteredDetails: HealthCheckupDetail[]
  t: (key: string) => string
}> = ({ details, selectedRegion, onRegionClick, filteredDetails, t }) => {
  const theme = useTheme()

  // Get color for a region based on worst result status across all grouped body parts
  const getRegionColor = (region: string): string | null => {
    const parts = regionBodyParts[region] || []
    const pd = details.filter((d) => parts.includes(d.bodyPart as BodyPart))
    if (pd.length === 0) return null
    if (pd.some((d) => d.resultStatus === 'abnormal')) return theme.palette.error.main
    if (pd.some((d) => d.resultStatus === 'caution')) return theme.palette.warning.main
    return theme.palette.success.main
  }

  // Build CSS overrides for body part colors (always set fill to prevent library's pink selected color)
  const colorOverrides = useMemo(() => {
    const styles: Record<string, object> = {}
    for (const [region, svgIds] of Object.entries(regionSvgIds)) {
      const color = getRegionColor(region) || theme.palette.grey[300]
      for (const svgId of svgIds) {
        styles[`& svg#${svgId} path`] = { fill: `${color} !important` }
      }
    }
    return styles
  }, [details, selectedRegion])

  // Build partsInput - all parts visible
  const partsInput = useMemo((): PartsInput => ({
    head: { show: true }, leftShoulder: { show: true }, rightShoulder: { show: true },
    leftArm: { show: true }, rightArm: { show: true }, chest: { show: true },
    stomach: { show: true }, leftLeg: { show: true }, rightLeg: { show: true },
    leftHand: { show: true }, rightHand: { show: true }, leftFoot: { show: true }, rightFoot: { show: true },
  }), [])

  const handleClick = (id: string) => {
    const region = svgIdToRegion[id]
    if (region) onRegionClick(region)
  }

  return (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
      {/* Left: Legend + Body Model */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: { xs: '100%', md: 'auto' } }}>
        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { color: theme.palette.success.main, label: t('healthCheckup.legend.normal') },
            { color: theme.palette.warning.main, label: t('healthCheckup.legend.caution') },
            { color: theme.palette.error.main, label: t('healthCheckup.legend.abnormal') },
            { color: theme.palette.grey[300], label: t('healthCheckup.legend.noData') },
          ].map((item) => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
              <Typography variant="caption">{item.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Body Model */}
        <Box sx={{
          width: 220, height: 520, position: 'relative', mx: 'auto',
          '& .human-body': { margin: '0 !important', transform: 'scale(0.9)', transformOrigin: 'top center' },
          '& .human-body svg': { pointerEvents: 'none' },
          '& .human-body svg path': { pointerEvents: 'auto' },
          '& .human-body svg:hover path': { fill: '#90a4ae !important' },
          ...colorOverrides,
        }}>
          <BodyComponent
            partsInput={partsInput}
            onClick={handleClick}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {t('healthCheckup.clickBodyPart')}
        </Typography>
      </Box>

      {/* Right: Detail Results Table */}
      <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {t('healthCheckup.bodyPartResult')}
          </Typography>
          <Button size="small" onClick={() => onRegionClick('')} sx={{ visibility: selectedRegion ? 'visible' : 'hidden' }}>
            {t('healthCheckup.allParts')}
          </Button>
        </Box>
        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 400, '& .MuiTableCell-root': { borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', whiteSpace: 'nowrap' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }} align="center">{t('healthCheckup.bodyPart')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }} align="center">{t('healthCheckup.category')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }} align="center">{t('healthCheckup.resultValue')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }} align="center">{t('healthCheckup.referenceRange')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('healthCheckup.resultStatus')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDetails.length > 0 ? (
                filteredDetails.map((detail, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{t(`healthCheckup.bodyParts.${detail.bodyPart}`)}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{detail.category}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{detail.resultValue || ''}</TableCell>
                    <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>{detail.referenceRange || ''}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={t(`healthCheckup.resultStatusLabels.${detail.resultStatus}`)}
                        color={getResultStatusColor(detail.resultStatus)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">{t('healthCheckup.noDetailResults')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}

export default BodyDiagram
