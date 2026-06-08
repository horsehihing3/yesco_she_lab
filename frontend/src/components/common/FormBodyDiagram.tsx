import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, useTheme } from '@mui/material'
import { BodyComponent } from 'reactjs-human-body'
import type { PartsInput } from 'reactjs-human-body/dist/components/BodyComponent/BodyComponent'
import { svgIdToRegion, regionBodyParts, regionSvgIds } from './BodyDiagram'
import { HealthCheckupDetailRequest, BodyPart } from '../../types/healthCheckup.types'

// ===== Types =====
export interface DetailRowWithRegion extends HealthCheckupDetailRequest {
  _region?: string
}

// ===== Constants =====
export const allBodyParts: BodyPart[] = [
  'head', 'eye', 'ear', 'nose', 'mouth', 'neck',
  'chest', 'heart', 'lung', 'abdomen', 'back', 'stomach', 'largeIntestine', 'liver', 'pancreas',
  'leftShoulder', 'rightShoulder', 'leftArm', 'rightArm', 'leftHand', 'rightHand',
  'leftLeg', 'rightLeg', 'leftKnee', 'rightKnee',
  'leftFoot', 'rightFoot', 'leftAnkle', 'rightAnkle',
]

export const emptyDetailRow = (): HealthCheckupDetailRequest => ({
  bodyPart: '', category: '', resultValue: '', referenceRange: '', resultStatus: 'normal', notes: '',
})

export const getRegionForBodyPart = (bp: string): string | undefined => {
  for (const [region, parts] of Object.entries(regionBodyParts)) {
    if (parts.includes(bp as BodyPart)) return region
  }
  return undefined
}

// ===== Component =====
const FormBodyDiagram: React.FC<{
  detailRows: DetailRowWithRegion[]
  onBodyPartClick: (bodyPart: string) => void
  t: (key: string) => string
}> = ({ detailRows, onBodyPartClick, t }) => {
  const theme = useTheme()

  const getRegionColor = (region: string): string | null => {
    const parts = regionBodyParts[region] || []
    const pd = detailRows.filter((d) => parts.includes(d.bodyPart as BodyPart))
    if (pd.length === 0) return null
    if (pd.some((d) => d.resultStatus === 'abnormal')) return theme.palette.error.main
    if (pd.some((d) => d.resultStatus === 'caution')) return theme.palette.warning.main
    return theme.palette.success.main
  }

  const colorOverrides = useMemo(() => {
    const styles: Record<string, object> = {}
    for (const [region, svgIds] of Object.entries(regionSvgIds)) {
      const color = getRegionColor(region) || theme.palette.grey[300]
      for (const svgId of svgIds) {
        styles[`& svg#${svgId} path`] = { fill: `${color} !important` }
      }
    }
    return styles
  }, [detailRows])

  const partsInput = useMemo((): PartsInput => ({
    head: { show: true }, leftShoulder: { show: true }, rightShoulder: { show: true },
    leftArm: { show: true }, rightArm: { show: true }, chest: { show: true },
    stomach: { show: true }, leftLeg: { show: true }, rightLeg: { show: true },
    leftHand: { show: true }, rightHand: { show: true }, leftFoot: { show: true }, rightFoot: { show: true },
  }), [])

  const handleClick = (id: string) => {
    const region = svgIdToRegion[id]
    if (region) onBodyPartClick(region)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
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
      <Box sx={{
        width: 220, height: 520, position: 'relative',
        '& .human-body': { margin: '0 !important', transform: 'scale(0.9)', transformOrigin: 'top center' },
        '& .human-body svg': { pointerEvents: 'none' },
        '& .human-body svg path': { pointerEvents: 'auto' },
        '& .human-body svg:hover path': { fill: '#90a4ae !important' },
        ...colorOverrides,
      }}>
        <BodyComponent partsInput={partsInput} onClick={handleClick} />
      </Box>
      <Typography variant="caption" color="text.secondary">
        {t('healthCheckup.clickBodyPart')}
      </Typography>
    </Box>
  )
}

export default FormBodyDiagram