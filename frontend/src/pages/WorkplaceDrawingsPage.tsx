import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Divider,
  useTheme,
  MenuItem,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Tooltip,
  Menu,
  Chip,
} from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import FavoriteIcon from '@mui/icons-material/Favorite'
import VideocamIcon from '@mui/icons-material/Videocam'
import WarningIcon from '@mui/icons-material/Warning'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import PlaceIcon from '@mui/icons-material/Place'
import CloseIcon from '@mui/icons-material/Close'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import BusinessIcon from '@mui/icons-material/Business'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../contexts/AlertContext'
import { floorDrawingApi } from '../api/floorDrawingApi'
import { FloorDrawing, SafetyDeviceType, SafetyDeviceRequest, FloorDrawingRequest } from '../types/floorDrawing.types'
import { FileMetadata } from '../types/common.types'
import { workplaceSiteApi } from '../api/workplaceSiteApi'
import type { WorkplaceSite } from '../types/workplaceSite.types'
import WorkplaceSiteFormDialog from '../components/workplaceSite/WorkplaceSiteFormDialog'
import FlowChartButton from '../components/common/FlowChartButton'

// 컴포넌트 내부용 디바이스 인터페이스 (x, y 좌표 사용)
interface DisplayDevice {
  id: number
  type: SafetyDeviceType
  name: string
  x: number
  y: number
  imageFileId?: number
}

interface FloorData {
  id: number
  name: string
  site: string
  floor?: string
  imagePath?: string
  devices: DisplayDevice[]
}

// 안전장치 아이콘 매핑
const deviceIcons: Record<SafetyDeviceType, React.ElementType> = {
  extinguisher: LocalFireDepartmentIcon,
  exit: ExitToAppIcon,
  aed: FavoriteIcon,
  cctv: VideocamIcon,
  hazard: WarningIcon,
}

// Device label keys for i18n
const deviceLabelKeys: Record<SafetyDeviceType, string> = {
  extinguisher: 'workplaceDrawing.fireExtinguisher',
  exit: 'workplaceDrawing.emergencyExit',
  aed: 'workplaceDrawing.aed',
  cctv: 'workplaceDrawing.cctv',
  hazard: 'workplaceDrawing.hazardZone',
}

const deviceColors: Record<SafetyDeviceType, string> = {
  extinguisher: '#f44336',
  exit: '#4caf50',
  aed: '#e91e63',
  cctv: '#2196f3',
  hazard: '#ff9800',
}

// API 응답을 컴포넌트용 FloorData로 변환
const mapToFloorData = (drawings: FloorDrawing[]): FloorData[] => {
  return drawings.map((drawing) => ({
    id: drawing.id,
    name: drawing.name,
    site: drawing.site,
    floor: drawing.floor,
    imagePath: drawing.imagePath,
    devices: (drawing.devices || []).map((device) => ({
      id: device.id,
      type: device.deviceType,
      name: device.name,
      x: device.positionX,
      y: device.positionY,
      imageFileId: device.imageFileId,
    })),
  }))
}

// 이미지의 실제 표시 영역 계산 (object-fit: contain 기준)
interface ImageBounds {
  offsetX: number
  offsetY: number
  renderWidth: number
  renderHeight: number
}

const calculateImageBounds = (
  img: HTMLImageElement,
  containerWidth: number,
  containerHeight: number
): ImageBounds => {
  const imageNaturalWidth = img.naturalWidth
  const imageNaturalHeight = img.naturalHeight

  if (imageNaturalWidth === 0 || imageNaturalHeight === 0) {
    return { offsetX: 0, offsetY: 0, renderWidth: containerWidth, renderHeight: containerHeight }
  }

  const containerAspect = containerWidth / containerHeight
  const imageAspect = imageNaturalWidth / imageNaturalHeight

  let renderWidth: number, renderHeight: number, offsetX: number, offsetY: number

  if (imageAspect > containerAspect) {
    // 이미지가 더 넓음 - 좌우에 맞춤, 상하 여백
    renderWidth = containerWidth
    renderHeight = containerWidth / imageAspect
    offsetX = 0
    offsetY = (containerHeight - renderHeight) / 2
  } else {
    // 이미지가 더 높음 - 상하에 맞춤, 좌우 여백
    renderHeight = containerHeight
    renderWidth = containerHeight * imageAspect
    offsetX = (containerWidth - renderWidth) / 2
    offsetY = 0
  }

  return { offsetX, offsetY, renderWidth, renderHeight }
}

// 드래그 확인 대기 정보 인터페이스
interface DragConfirmInfo {
  device: DisplayDevice
  newX: number
  newY: number
}

// 평면도 컴포넌트 (이미지 또는 기본 SVG)
const FloorPlanView: React.FC<{
  imagePath?: string
  devices: DisplayDevice[]
  showDevices: boolean
  visibleTypes: SafetyDeviceType[]
  onImageClick?: (x: number, y: number) => void
  onDeviceDragEnd?: (info: DragConfirmInfo) => void
  isEditMode?: boolean
  pendingDevice?: { x: number; y: number; type: SafetyDeviceType } | null
  pendingDragConfirm?: DragConfirmInfo | null
  imageFiles?: FileMetadata[]
  selectedImageIndex?: number
  t: (key: string) => string
}> = ({ devices, showDevices, visibleTypes, onImageClick, onDeviceDragEnd, isEditMode, pendingDevice, pendingDragConfirm, imageFiles, selectedImageIndex, t }) => {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null)

  // 줌 상태
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const panOffsetStartRef = useRef({ x: 0, y: 0 })

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleZoomReset = () => { setZoom(1); setPanOffset({ x: 0, y: 0 }) }

  // 두 손가락 터치 (핀치 줌 + 두 손가락 팬)
  const lastTouchDistRef = useRef<number | null>(null)
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null)
  const touchPanOffsetStartRef = useRef({ x: 0, y: 0 })

  // 줌 변경 시 pan 범위 보정
  useEffect(() => {
    if (zoom <= 1) setPanOffset({ x: 0, y: 0 })
  }, [zoom])

  // 패닝 (줌 > 1일 때 드래그로 이동)
  const handlePanStart = useCallback((clientX: number, clientY: number) => {
    if (zoom <= 1 || isEditMode) return
    isPanningRef.current = true
    panStartRef.current = { x: clientX, y: clientY }
    panOffsetStartRef.current = { ...panOffset }
  }, [zoom, isEditMode, panOffset])

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!isPanningRef.current) return
    const dx = clientX - panStartRef.current.x
    const dy = clientY - panStartRef.current.y
    setPanOffset({
      x: panOffsetStartRef.current.x + dx,
      y: panOffsetStartRef.current.y + dy,
    })
  }, [])

  const handlePanEnd = useCallback(() => {
    isPanningRef.current = false
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePanMove(e.clientX, e.clientY)
    const onMouseUp = () => handlePanEnd()
    if (zoom > 1 && !isEditMode) {
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      return () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }
    }
  }, [zoom, isEditMode, handlePanMove, handlePanEnd])

  // 두 손가락 터치 이벤트 (핀치 줌 + 팬)
  useEffect(() => {
    const el = containerRef.current?.parentElement
    if (!el || isEditMode) return

    const getTouchDistance = (t1: Touch, t2: Touch) =>
      Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2)
    const getTouchCenter = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    })

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        lastTouchDistRef.current = getTouchDistance(e.touches[0], e.touches[1])
        lastTouchCenterRef.current = getTouchCenter(e.touches[0], e.touches[1])
        touchPanOffsetStartRef.current = { ...panOffset }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistRef.current !== null && lastTouchCenterRef.current !== null) {
        e.preventDefault()
        const dist = getTouchDistance(e.touches[0], e.touches[1])
        const center = getTouchCenter(e.touches[0], e.touches[1])

        // 핀치 줌
        const scaleDelta = dist / lastTouchDistRef.current
        setZoom((z) => Math.min(Math.max(z * scaleDelta, 0.5), 3))
        lastTouchDistRef.current = dist

        // 두 손가락 팬
        const dx = center.x - lastTouchCenterRef.current.x
        const dy = center.y - lastTouchCenterRef.current.y
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
        lastTouchCenterRef.current = center
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastTouchDistRef.current = null
        lastTouchCenterRef.current = null
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [isEditMode, panOffset])

  // 드래그 상태 관리
  const [draggingDevice, setDraggingDevice] = useState<DisplayDevice | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)

  // 드래그 여부 추적 (클릭 이벤트 방지용)
  const wasDraggingRef = useRef(false)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)

  // 선택된 이미지 사용 (기본: 첫 번째)
  const imageIdx = selectedImageIndex ?? 0
  const currentImageFile = imageFiles && imageFiles.length > imageIdx ? imageFiles[imageIdx] : null

  const filteredDevices = showDevices
    ? devices.filter((d) => visibleTypes.includes(d.type) && (!d.imageFileId || d.imageFileId === currentImageFile?.id))
    : []

  const imageUrl = imageFiles && imageFiles.length > imageIdx
    ? `/api/files/${imageFiles[imageIdx].id}`
    : null

  // 이미지 변경 시 bounds 초기화 (새 이미지 로드 후 재계산됨)
  useEffect(() => {
    setImageBounds(null)
  }, [imageUrl])

  // 이미지 로드 시 및 리사이즈 시 bounds 재계산
  const updateImageBounds = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const bounds = calculateImageBounds(
        imageRef.current,
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      )
      setImageBounds(bounds)
    }
  }, [])

  // ResizeObserver로 컨테이너 크기 변경 감지
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(() => {
      updateImageBounds()
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [updateImageBounds])

  // 컨테이너 클릭 핸들러 - 이미지 영역 기준으로 좌표 계산
  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 드래그 직후면 클릭 무시
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false
      return
    }

    if (!isEditMode || !onImageClick || !containerRef.current || !imageBounds) return

    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // 클릭이 이미지 영역 내인지 확인
    if (
      clickX < imageBounds.offsetX ||
      clickX > imageBounds.offsetX + imageBounds.renderWidth ||
      clickY < imageBounds.offsetY ||
      clickY > imageBounds.offsetY + imageBounds.renderHeight
    ) {
      return // 이미지 영역 밖 클릭은 무시
    }

    // 이미지 영역 기준 상대 좌표 (0-1)
    const relativeX = (clickX - imageBounds.offsetX) / imageBounds.renderWidth
    const relativeY = (clickY - imageBounds.offsetY) / imageBounds.renderHeight

    // 0-600, 0-400 좌표계로 변환
    const x = Math.round(relativeX * 600)
    const y = Math.round(relativeY * 400)

    onImageClick(x, y)
  }, [isEditMode, onImageClick, imageBounds])

  // 마커 위치 계산 (이미지 영역 기준)
  const getMarkerPosition = useCallback((deviceX: number, deviceY: number) => {
    if (!imageBounds || !containerRef.current) {
      return null // imageBounds 없으면 마커 표시하지 않음
    }

    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight

    // 0-600, 0-400 좌표를 이미지 영역 내 픽셀 위치로 변환
    const pixelX = imageBounds.offsetX + (deviceX / 600) * imageBounds.renderWidth
    const pixelY = imageBounds.offsetY + (deviceY / 400) * imageBounds.renderHeight

    // 컨테이너 기준 퍼센트로 변환
    return {
      left: `${(pixelX / containerWidth) * 100}%`,
      top: `${(pixelY / containerHeight) * 100}%`,
    }
  }, [imageBounds])

  // 드래그 시작 핸들러 (마우스)
  const handleDragStart = useCallback((e: React.MouseEvent, device: DisplayDevice) => {
    if (!isEditMode || !onDeviceDragEnd) return
    e.stopPropagation()
    e.preventDefault()
    setDraggingDevice(device)
    setDragPosition({ x: device.x, y: device.y })
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    wasDraggingRef.current = false
  }, [isEditMode, onDeviceDragEnd])

  // 드래그 시작 핸들러 (터치)
  const handleTouchStart = useCallback((e: React.TouchEvent, device: DisplayDevice) => {
    if (!isEditMode || !onDeviceDragEnd) return
    e.stopPropagation()
    const touch = e.touches[0]
    setDraggingDevice(device)
    setDragPosition({ x: device.x, y: device.y })
    dragStartPosRef.current = { x: touch.clientX, y: touch.clientY }
    wasDraggingRef.current = false
  }, [isEditMode, onDeviceDragEnd])

  // 공통 드래그 이동 처리 함수
  const processDragMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingDevice || !containerRef.current || !imageBounds) return

    // 드래그 시작 위치에서 일정 거리 이상 이동했는지 체크
    if (dragStartPosRef.current) {
      const dx = Math.abs(clientX - dragStartPosRef.current.x)
      const dy = Math.abs(clientY - dragStartPosRef.current.y)
      if (dx > 5 || dy > 5) {
        wasDraggingRef.current = true
      }
    }

    const rect = containerRef.current.getBoundingClientRect()
    const clickX = clientX - rect.left
    const clickY = clientY - rect.top

    // 이미지 영역 내로 제한
    const clampedX = Math.max(imageBounds.offsetX, Math.min(clickX, imageBounds.offsetX + imageBounds.renderWidth))
    const clampedY = Math.max(imageBounds.offsetY, Math.min(clickY, imageBounds.offsetY + imageBounds.renderHeight))

    // 이미지 영역 기준 상대 좌표 (0-1)
    const relativeX = (clampedX - imageBounds.offsetX) / imageBounds.renderWidth
    const relativeY = (clampedY - imageBounds.offsetY) / imageBounds.renderHeight

    // 0-600, 0-400 좌표계로 변환
    const x = Math.round(relativeX * 600)
    const y = Math.round(relativeY * 400)

    setDragPosition({ x, y })
  }, [draggingDevice, imageBounds])

  // 마우스 이동 핸들러 (드래그 중)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    processDragMove(e.clientX, e.clientY)
  }, [processDragMove])

  // 터치 이동 핸들러 (드래그 중)
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!draggingDevice) return
    e.preventDefault() // 스크롤 방지
    const touch = e.touches[0]
    processDragMove(touch.clientX, touch.clientY)
  }, [draggingDevice, processDragMove])

  // 드래그 종료 공통 처리
  const processDragEnd = useCallback(() => {
    if (draggingDevice && dragPosition && onDeviceDragEnd && wasDraggingRef.current) {
      // 위치가 변경되었을 때만 확인 다이얼로그 표시
      if (draggingDevice.x !== dragPosition.x || draggingDevice.y !== dragPosition.y) {
        onDeviceDragEnd({
          device: draggingDevice,
          newX: dragPosition.x,
          newY: dragPosition.y,
        })
      }
    }
    setDraggingDevice(null)
    setDragPosition(null)
    dragStartPosRef.current = null
  }, [draggingDevice, dragPosition, onDeviceDragEnd])

  // 마우스 업 핸들러 (드래그 종료)
  const handleMouseUp = useCallback(() => {
    processDragEnd()
  }, [processDragEnd])

  // 터치 종료 핸들러 (드래그 종료)
  const handleTouchEnd = useCallback(() => {
    processDragEnd()
  }, [processDragEnd])

  // 드래그 이벤트 리스너 등록/해제 (마우스 + 터치)
  useEffect(() => {
    if (draggingDevice) {
      // 마우스 이벤트
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      // 터치 이벤트
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      document.addEventListener('touchcancel', handleTouchEnd)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
        document.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  }, [draggingDevice, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 1, width: '100%', touchAction: 'pan-x pan-y' }}>
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: 500,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.grey[100],
        borderRadius: 1,
        overflow: 'hidden',
        cursor: isEditMode ? 'crosshair' : zoom > 1 ? 'grab' : 'default',
        transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
        transformOrigin: 'center center',
        transition: isPanningRef.current ? 'none' : 'transform 0.2s',
      }}
      onClick={handleContainerClick}
      onMouseDown={(e) => { if (!isEditMode && zoom > 1) handlePanStart(e.clientX, e.clientY) }}
    >
      {imageUrl ? (
        <Box
          component="img"
          ref={imageRef}
          src={imageUrl}
          alt="도면 이미지"
          onLoad={updateImageBounds}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      ) : (
        // 맵 미등록 안내
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100',
          }}
        >
          <PlaceIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {t('workplaceDrawing.noImage')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('workplaceDrawing.editToRegisterImage')}
          </Typography>
        </Box>
      )}

      {/* 안전장치 마커 */}
      {filteredDevices.map((device) => {
        const Icon = deviceIcons[device.type]
        const color = deviceColors[device.type]
        const isDragging = draggingDevice?.id === device.id
        const isPendingConfirm = pendingDragConfirm?.device.id === device.id
        // 드래그 중이거나 확인 대기 중인 장치는 새 위치로 표시
        const displayX = isDragging && dragPosition
          ? dragPosition.x
          : isPendingConfirm
            ? pendingDragConfirm.newX
            : device.x
        const displayY = isDragging && dragPosition
          ? dragPosition.y
          : isPendingConfirm
            ? pendingDragConfirm.newY
            : device.y
        const position = getMarkerPosition(displayX, displayY)
        if (!position) return null
        return (
          <Tooltip key={device.id} title={`${t(deviceLabelKeys[device.type])}: ${device.name}`}>
            <Box
              onMouseDown={(e) => handleDragStart(e, device)}
              onTouchStart={(e) => handleTouchStart(e, device)}
              sx={{
                position: 'absolute',
                left: position.left,
                top: position.top,
                transform: 'translate(-50%, -50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none', // 터치 드래그 시 스크롤 방지
                boxShadow: isDragging || isPendingConfirm ? 4 : 2,
                cursor: isEditMode && onDeviceDragEnd ? 'grab' : 'pointer',
                '&:hover': {
                  transform: 'translate(-50%, -50%) scale(1.2)',
                },
                '&:active': {
                  cursor: isEditMode && onDeviceDragEnd ? 'grabbing' : 'pointer',
                },
                transition: isDragging ? 'none' : 'transform 0.2s',
                zIndex: isDragging || isPendingConfirm ? 1000 : 1,
                opacity: isDragging ? 0.9 : 1,
                border: isDragging || isPendingConfirm ? '2px solid white' : 'none',
                animation: isPendingConfirm ? 'pulse 1s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.6 },
                  '100%': { opacity: 1 },
                },
              }}
            >
              <Icon sx={{ fontSize: 16, color: '#fff' }} />
            </Box>
          </Tooltip>
        )
      })}

      {/* 대기 중인 장치 마커 (편집 모드) */}
      {pendingDevice && (() => {
        const position = getMarkerPosition(pendingDevice.x, pendingDevice.y)
        if (!position) return null
        return (
          <Box
            sx={{
              position: 'absolute',
              left: position.left,
              top: position.top,
              transform: 'translate(-50%, -50%)',
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: deviceColors[pendingDevice.type],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 2,
              border: '2px dashed white',
              animation: 'pulse 1s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              },
            }}
          >
            {(() => {
              const Icon = deviceIcons[pendingDevice.type]
              return <Icon sx={{ fontSize: 16, color: '#fff' }} />
            })()}
          </Box>
        )
      })()}

      {/* 편집 모드 안내 */}
      {isEditMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'primary.main',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
          }}
        >
          {t('workplaceDrawing.clickToDesignate')}
        </Box>
      )}
    </Box>
    {/* Zoom Controls */}
    <Box
      sx={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        zIndex: 10,
      }}
    >
      <IconButton
        size="small"
        onClick={handleZoomIn}
        sx={{
          bgcolor: 'background.paper',
          boxShadow: 2,
          '&:hover': { bgcolor: 'grey.200' },
          width: 32,
          height: 32,
        }}
      >
        <ZoomInIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={handleZoomOut}
        sx={{
          bgcolor: 'background.paper',
          boxShadow: 2,
          '&:hover': { bgcolor: 'grey.200' },
          width: 32,
          height: 32,
        }}
      >
        <ZoomOutIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={handleZoomReset}
        sx={{
          bgcolor: 'background.paper',
          boxShadow: 2,
          '&:hover': { bgcolor: 'grey.200' },
          width: 32,
          height: 32,
        }}
      >
        <RestartAltIcon fontSize="small" />
      </IconButton>
    </Box>
    </Box>
  )
}

interface WorkplaceDrawingsPageProps {
  readOnly?: boolean
}

const WorkplaceDrawingsPage: React.FC<WorkplaceDrawingsPageProps> = ({ readOnly = false }) => {
  useTheme()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const { showConfirm, showSuccess, showError } = useAlert()

  // 상태
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showDevices, setShowDevices] = useState(true)
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)
  const [visibleTypes, setVisibleTypes] = useState<SafetyDeviceType[]>([
    'extinguisher',
    'exit',
    'aed',
    'cctv',
    'hazard',
  ])

  // 도면 등록/수정 다이얼로그 상태
  const [drawingDialogOpen, setDrawingDialogOpen] = useState(false)
  const [editingDrawing, setEditingDrawing] = useState<FloorData | null>(null)
  const [drawingForm, setDrawingForm] = useState<FloorDrawingRequest>({
    name: '',
    site: '',
    floor: '',
    description: '',
  })
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([])

  // 안전장치 위치 지정 상태
  const [deviceEditMode, setDeviceEditMode] = useState(false)
  const [selectedDeviceType, setSelectedDeviceType] = useState<SafetyDeviceType>('extinguisher')
  const [pendingDevice, setPendingDevice] = useState<{ x: number; y: number; type: SafetyDeviceType } | null>(null)
  const [deviceNameDialogOpen, setDeviceNameDialogOpen] = useState(false)
  const [newDeviceName, setNewDeviceName] = useState('')
  const [deviceTypeMenuAnchor, setDeviceTypeMenuAnchor] = useState<null | HTMLElement>(null)

  // 드래그 확인 다이얼로그 상태
  const [pendingDragConfirm, setPendingDragConfirm] = useState<DragConfirmInfo | null>(null)
  const [dragConfirmDialogOpen, setDragConfirmDialogOpen] = useState(false)
  const [dragEditName, setDragEditName] = useState('')

  // 이미지 프리뷰 상태
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  // 사업장 다이얼로그 상태
  const [siteDialogOpen, setSiteDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<WorkplaceSite | null>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)

  // 사업장 목록 조회 (도면관리 트리 루트)
  const { data: workplaceSites = [] } = useQuery({
    queryKey: ['workplaceSites'],
    queryFn: () => workplaceSiteApi.list(),
  })

  // API에서 도면 데이터 조회
  const { data: floorDrawings, isLoading, isError, error } = useQuery({
    queryKey: ['floorDrawings'],
    queryFn: () => floorDrawingApi.getAll(),
  })

  // 선택된 도면의 이미지 파일 조회
  const effectiveSelectedId = selectedFloorId ?? (floorDrawings && floorDrawings.length > 0 ? floorDrawings[0].id : null)
  const { data: imageFiles } = useQuery({
    queryKey: ['floorDrawingImages', effectiveSelectedId],
    queryFn: () => floorDrawingApi.getImages(effectiveSelectedId!),
    enabled: !!effectiveSelectedId,
  })

  // API 응답을 컴포넌트용 데이터로 변환
  const floorData = useMemo(() => {
    if (!floorDrawings) return []
    return mapToFloorData(floorDrawings)
  }, [floorDrawings])

  const selectedFloor = floorData.find((f) => f.id === effectiveSelectedId) || floorData[0]

  // 사업장 → 도면 트리 데이터
  // 사업장이 등록되어 있으면 사업장 트리, 사업장에 매칭되지 않는 도면은 "(미지정)" 그룹으로
  // 한 도면은 반드시 한 그룹에만 속해야 함 (TreeItem id 중복 방지)
  const groupedBySite = useMemo(() => {
    const parseFloorNum = (s: string | undefined) => parseInt(String(s || '').replace(/[^\d-]/g, '')) || 0
    const result: Array<{ site: WorkplaceSite | null; drawings: FloorData[] }> = []
    const assigned = new Set<number>()

    // 등록된 사업장별 그룹 — site 컬럼 우선 매칭, 비어있을 때만 name 폴백
    for (const site of workplaceSites) {
      const drawings = floorData
        .filter(f => {
          if (assigned.has(f.id)) return false
          if (f.site) return f.site === site.siteName
          return f.name === site.siteName
        })
        .sort((a, b) => {
          const na = parseFloorNum(a.floor); const nb = parseFloorNum(b.floor)
          if (na !== nb) return nb - na
          return (a.floor || '').localeCompare(b.floor || '')
        })
      drawings.forEach(d => assigned.add(d.id))
      result.push({ site, drawings })
    }

    // 어떤 사업장에도 할당되지 않은 도면 (legacy)
    const unmatched = floorData
      .filter(f => !assigned.has(f.id))
      .sort((a, b) => {
        const na = parseFloorNum(a.floor); const nb = parseFloorNum(b.floor)
        if (na !== nb) return nb - na
        return (a.floor || '').localeCompare(b.floor || '')
      })
    if (unmatched.length > 0) {
      result.push({ site: null, drawings: unmatched })
    }
    return result
  }, [workplaceSites, floorData])

  // 트리 확장 상태 — 기본은 모든 사업장 펼침
  const [expandedSites, setExpandedSites] = useState<string[]>([])
  // site.id 가 누락된 데이터에 대해서도 trees node id 가 충돌하지 않도록 index 폴백
  const siteNodeIdOf = (site: WorkplaceSite | null, idx: number): string => {
    if (!site) return 's-_none_'
    return site.id != null ? `s-${site.id}` : `s-_missing_${idx}`
  }
  useEffect(() => {
    setExpandedSites(groupedBySite.map((g, idx) => siteNodeIdOf(g.site, idx)))
  }, [groupedBySite])

  // 사업장 삭제 mutation
  const deleteSiteMutation = useMutation({
    mutationFn: (id: number) => workplaceSiteApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workplaceSites'] })
      setSelectedSiteId(null)
      showSuccess(t('common.deleted'))
    },
  })

  const handleDeleteSite = async (id: number) => {
    if (await showConfirm(t('workplaceDrawingsPage.msg1', '이 사업장을 삭제하시겠습니까?'))) {
      deleteSiteMutation.mutate(id)
    }
  }

  // 사업장 → 도면 트리 — PC/모바일 공통 렌더링
  const renderBuildingTree = () => (
    <SimpleTreeView
      slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
      expandedItems={expandedSites}
      onExpandedItemsChange={(_, ids) => setExpandedSites(ids)}
      selectedItems={
        effectiveSelectedId ? `f-${effectiveSelectedId}`
        : selectedSiteId   ? `s-${selectedSiteId}`
        : ''
      }
      onSelectedItemsChange={(_, id) => {
        if (typeof id !== 'string') return
        if (id.startsWith('f-')) {
          setSelectedFloorId(Number(id.slice(2)))
          setSelectedImageIndex(0)
          setShowDevices(true)
          setDeviceEditMode(false)
        } else if (id.startsWith('s-') && id !== 's-_none_') {
          setSelectedSiteId(Number(id.slice(2)))
          setSelectedFloorId(null)
        }
      }}
    >
      {groupedBySite.map(({ site, drawings }, idx) => {
        const siteNodeId = siteNodeIdOf(site, idx)
        const siteLabel = site
          ? `[${site.buildingNumber}] ${site.siteName}`
          : '(사업장 미지정)'
        return (
          <TreeItem
            key={siteNodeId}
            itemId={siteNodeId}
            sx={{
              '& > .MuiTreeItem-content': {
                py: 0.25,
                '&:hover .site-actions, &.Mui-selected .site-actions, &.Mui-focused .site-actions': {
                  opacity: 1,
                },
              },
            }}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, width: '100%', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <BusinessIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main', flexShrink: 0 }} />
                  <Typography fontWeight="bold" sx={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {siteLabel}
                  </Typography>
                </Box>
                {!readOnly && (
                  <Box
                    className="site-actions"
                    sx={{
                      display: 'flex',
                      gap: 0.25,
                      flexShrink: 0,
                      opacity: { xs: 1, md: 0.4 },     // 모바일: 항상 / PC: 호버/선택 시 강조
                      transition: 'opacity .15s',
                      '& .MuiIconButton-root': {
                        p: 0.5,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 0.75,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  >
                    {site ? (
                      <>
                        <Tooltip title="이 사업장에 도면 추가" arrow>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDrawingDialog(undefined, site) }}>
                            <AddIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="사업장 수정" arrow>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingSite(site); setSiteDialogOpen(true) }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="사업장 삭제" arrow>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteSite(site.id) }}>
                            <DeleteIcon sx={{ fontSize: 16, color: 'error.main' }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      // 미지정 그룹: 새 사업장 등록 다이얼로그로 안내
                      <Tooltip title="사업장 등록 — 등록 후 도면 수정에서 사업장으로 이동" arrow>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingSite(null); setSiteDialogOpen(true) }}>
                          <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>
            }
          >
            {drawings.length === 0 ? (
              <TreeItem
                itemId={`${siteNodeId}-empty`}
                disabled
                label={
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', py: 0.5, pl: 1 }}>
                    등록된 도면 없음
                  </Typography>
                }
              />
            ) : drawings.map((d) => (
              <TreeItem
                key={`f-${d.id}`}
                itemId={`f-${d.id}`}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography sx={{
                      fontSize: '0.85rem',
                      fontWeight: effectiveSelectedId === d.id ? 'bold' : 'normal',
                      color: 'text.primary',
                    }}>
                      {d.floor || '-'}
                    </Typography>
                    {!readOnly && (
                      <Box sx={{ display: 'flex', gap: 0.25 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDrawingDialog(d) }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteDrawing(d.id) }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                }
              />
            ))}
          </TreeItem>
        )
      })}
    </SimpleTreeView>
  )

  // 현재 선택된 이미지에 해당하는 장치만 필터링
  const currentImageFileId = imageFiles && imageFiles.length > selectedImageIndex ? imageFiles[selectedImageIndex]?.id : undefined
  const currentImageDevices = selectedFloor
    ? selectedFloor.devices.filter(d => !d.imageFileId || d.imageFileId === currentImageFileId)
    : []

  // 터치 스와이프로 이미지 전환
  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || !imageFiles || imageFiles.length <= 1) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setSelectedImageIndex(prev => Math.min(imageFiles.length - 1, prev + 1))
      } else {
        setSelectedImageIndex(prev => Math.max(0, prev - 1))
      }
    }
    touchStartX.current = null
  }, [imageFiles])

  // 이미지 목록 변경 시 selectedImageIndex 범위 보정
  useEffect(() => {
    if (imageFiles && selectedImageIndex >= imageFiles.length) {
      setSelectedImageIndex(Math.max(0, imageFiles.length - 1))
    }
  }, [imageFiles, selectedImageIndex])

  // 데이터가 갱신되면 pendingDragConfirm 자동 초기화 (위치가 실제로 변경된 후)
  useEffect(() => {
    if (pendingDragConfirm && floorData.length > 0) {
      // 해당 장치의 새 위치 확인
      const floor = floorData.find((f) => f.devices.some((d) => d.id === pendingDragConfirm.device.id))
      if (floor) {
        const device = floor.devices.find((d) => d.id === pendingDragConfirm.device.id)
        // 서버 데이터가 새 위치로 업데이트되었으면 pendingDragConfirm 초기화
        if (device && device.x === pendingDragConfirm.newX && device.y === pendingDragConfirm.newY) {
          setPendingDragConfirm(null)
        }
      }
    }
  }, [floorData, pendingDragConfirm])

  // 도면 생성 mutation
  const createDrawingMutation = useMutation({
    mutationFn: floorDrawingApi.create,
    onSuccess: async (created) => {
      // 이미지 파일들 업로드
      for (const file of pendingImageFiles) {
        await floorDrawingApi.uploadImage(file, created.id)
      }
      queryClient.invalidateQueries({ queryKey: ['floorDrawings'] })
      handleCloseDrawingDialog()
      showSuccess(t('common.saved'))
    },
  })

  // 도면 수정 mutation
  const updateDrawingMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: FloorDrawingRequest }) =>
      floorDrawingApi.update(id, request),
    onSuccess: async (updated) => {
      // 새 이미지 파일들 업로드
      for (const file of pendingImageFiles) {
        await floorDrawingApi.uploadImage(file, updated.id)
      }
      queryClient.invalidateQueries({ queryKey: ['floorDrawings'] })
      queryClient.invalidateQueries({ queryKey: ['floorDrawingImages', updated.id] })
      handleCloseDrawingDialog()
      showSuccess(t('common.saved'))
    },
  })

  // 도면 삭제 mutation
  const deleteDrawingMutation = useMutation({
    mutationFn: floorDrawingApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorDrawings'] })
      setSelectedFloorId(null)
      showSuccess(t('common.deleted'))
    },
  })

  // 이미지 삭제 mutation
  const deleteImageMutation = useMutation({
    mutationFn: floorDrawingApi.deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorDrawingImages', effectiveSelectedId] })
    },
  })

  // 안전장치 추가 mutation
  const addDeviceMutation = useMutation({
    mutationFn: ({ floorDrawingId, request }: { floorDrawingId: number; request: SafetyDeviceRequest }) =>
      floorDrawingApi.addDevice(floorDrawingId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorDrawings'] })
      setPendingDevice(null)
      setDeviceNameDialogOpen(false)
      setNewDeviceName('')
      showSuccess(t('common.saved'))
    },
  })

  // 안전장치 삭제 mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: floorDrawingApi.deleteDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorDrawings'] })
      showSuccess(t('common.deleted'))
    },
  })

  // 안전장치 위치 업데이트 mutation (드래그용)
  const updateDeviceMutation = useMutation({
    mutationFn: ({ deviceId, request }: { deviceId: number; request: SafetyDeviceRequest }) =>
      floorDrawingApi.updateDevice(deviceId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorDrawings'] })
      showSuccess(t('common.saved'))
    },
  })

  // 핸들러
  const handleToggleDeviceType = (type: SafetyDeviceType) => {
    setVisibleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleShowDevices = () => {
    setShowDevices(true)
    setDeviceDialogOpen(true)
  }

  // 도면 등록 다이얼로그 열기
  // prefilledSite: 트리에서 사업장 노드의 + 버튼 클릭 시 사업장 정보 자동 채움
  const handleOpenDrawingDialog = (drawing?: FloorData, prefilledSite?: WorkplaceSite) => {
    if (drawing) {
      setEditingDrawing(drawing)
      setDrawingForm({
        name: drawing.name,
        site: drawing.site,
        floor: drawing.floor || '',
        description: '',
      })
    } else if (prefilledSite) {
      setEditingDrawing(null)
      setDrawingForm({
        name: prefilledSite.siteName,
        site: prefilledSite.siteName,
        floor: '',
        description: '',
      })
    } else {
      setEditingDrawing(null)
      setDrawingForm({ name: '', site: '', floor: '', description: '' })
    }
    setPendingImageFiles([])
    setDrawingDialogOpen(true)
  }

  const handleCloseDrawingDialog = () => {
    setDrawingDialogOpen(false)
    setEditingDrawing(null)
    setDrawingForm({ name: '', site: '', floor: '', description: '' })
    setPendingImageFiles([])
  }

  const handleSaveDrawing = () => {
    if (editingDrawing) {
      updateDrawingMutation.mutate({ id: editingDrawing.id, request: drawingForm })
    } else {
      // 신규 등록 시 이미지 1개 이상 필수
      if (pendingImageFiles.length === 0) {
        showError(t('workplaceDrawing.imageRequired', '도면 이미지를 1개 이상 등록하세요'))
        return
      }
      createDrawingMutation.mutate(drawingForm)
    }
  }

  const handleDeleteDrawing = async (id: number) => {
    const confirmed = await showConfirm(t('workplaceDrawing.confirmDeleteDrawing'))
    if (confirmed) {
      deleteDrawingMutation.mutate(id)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPendingImageFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
    if (e.target) e.target.value = ''
  }

  const handleDeleteImage = async (fileId: number) => {
    const confirmed = await showConfirm(t('workplaceDrawing.confirmDeleteImage'))
    if (confirmed) {
      deleteImageMutation.mutate(fileId)
    }
  }

  // 안전장치 위치 지정 모드
  const handleStartDeviceEdit = () => {
    setDeviceEditMode(true)
    setShowDevices(true)
  }

  const handleEndDeviceEdit = () => {
    setDeviceEditMode(false)
    setPendingDevice(null)
  }

  const handleFloorPlanClick = (x: number, y: number) => {
    if (!deviceEditMode || !selectedFloor) return

    setPendingDevice({ x, y, type: selectedDeviceType })
    setDeviceNameDialogOpen(true)
  }

  const handleSaveDevice = () => {
    if (!pendingDevice || !selectedFloor || !newDeviceName.trim()) return

    // 현재 선택된 이미지의 파일 ID
    const currentImageFileId = imageFiles && imageFiles.length > selectedImageIndex
      ? imageFiles[selectedImageIndex].id
      : undefined

    addDeviceMutation.mutate({
      floorDrawingId: selectedFloor.id,
      request: {
        deviceType: pendingDevice.type,
        name: newDeviceName.trim(),
        positionX: pendingDevice.x,
        positionY: pendingDevice.y,
        imageFileId: currentImageFileId,
      },
    })
  }

  const handleDeleteDevice = async (deviceId: number) => {
    const confirmed = await showConfirm(t('workplaceDrawing.confirmDeleteDevice'))
    if (confirmed) {
      deleteDeviceMutation.mutate(deviceId)
    }
  }

  // 안전장치 드래그 완료 - 확인 다이얼로그 표시
  const handleDeviceDragEnd = (info: DragConfirmInfo) => {
    setPendingDragConfirm(info)
    setDragEditName(info.device.name)
    setDragConfirmDialogOpen(true)
  }

  // 드래그 위치 변경 확인
  const handleConfirmDrag = () => {
    if (!pendingDragConfirm || !dragEditName.trim()) return

    updateDeviceMutation.mutate({
      deviceId: pendingDragConfirm.device.id,
      request: {
        deviceType: pendingDragConfirm.device.type,
        name: dragEditName.trim(),
        positionX: pendingDragConfirm.newX,
        positionY: pendingDragConfirm.newY,
        imageFileId: pendingDragConfirm.device.imageFileId,
      },
    })
    // pendingDragConfirm은 useEffect에서 데이터 갱신 후 자동 초기화됨
    setDragConfirmDialogOpen(false)
  }

  // 드래그 위치 변경 취소
  const handleCancelDrag = () => {
    setDragConfirmDialogOpen(false)
    setPendingDragConfirm(null)
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      </Box>
    )
  }

  // 에러 상태
  if (isError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('workplaceDrawing.loadFailed')} {error instanceof Error ? error.message : ''}
        </Alert>
      </Box>
    )
  }

  // 사업장 추가 버튼 (모든 패널 헤더에서 재사용)
  const renderSiteAddButton = () => !readOnly && (
    <Button
      variant="contained"
      size="small"
      onClick={() => { setEditingSite(null); setSiteDialogOpen(true) }}
      sx={{ whiteSpace: 'nowrap', flexShrink: 0, py: 0.25 }}
    >
      사업장 추가
    </Button>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <FlowChartButton flowKey="workplaceDrawings" />
      </Box>
      {/* 사업장만 있고 도면 미등록 — 트리 표시하되 우측 안내 */}
      {!selectedFloor && workplaceSites.length > 0 && (
        <>
          {/* PC Layout */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
            <Paper sx={(theme: any) => ({ width: 320, flexShrink: 0, overflow: 'auto', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">{t('factory.selectWorkplace')}</Typography>
                {renderSiteAddButton()}
              </Box>
              <Box sx={{ p: 1 }}>{renderBuildingTree()}</Box>
            </Paper>
            <Paper sx={(theme: any) => ({ flex: 1, p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
              <Alert severity="info" sx={{ width: '100%' }}>
                트리에서 사업장을 선택하고 사업장 노드의 <strong>+</strong> 버튼을 눌러 도면을 추가하세요.
              </Alert>
            </Paper>
          </Box>
          {/* Mobile */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Paper sx={{ mb: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">{t('factory.selectWorkplace')}</Typography>
                {renderSiteAddButton()}
              </Box>
              <Box sx={{ p: 1 }}>{renderBuildingTree()}</Box>
            </Paper>
            <Alert severity="info">사업장을 선택하고 도면을 등록하세요</Alert>
          </Box>
        </>
      )}

      {/* 사업장도 없고 도면도 없음 */}
      {!selectedFloor && workplaceSites.length === 0 ? (
        <Box>
          {!readOnly && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              {renderSiteAddButton()}
            </Box>
          )}
          <Alert severity="info">
            등록된 사업장이 없습니다. <strong>사업장 추가</strong> 버튼을 눌러 사업장을 먼저 등록해주세요.
          </Alert>
        </Box>
      ) : !selectedFloor ? null : (
        <>
          {/* PC Layout */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
            {/* Left Panel - 사업장/층 선택 */}
            <Paper sx={(theme: any) => ({ width: 320, flexShrink: 0, overflow: 'auto', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {t('factory.selectWorkplace')}
                </Typography>
                {renderSiteAddButton()}
              </Box>
              <Box sx={{ p: 1 }}>
                {renderBuildingTree()}
              </Box>
            </Paper>

            {/* Right Panel - 도면 표시 */}
            <Paper sx={(theme: any) => ({ flex: 1, p: 3, display: 'flex', flexDirection: 'column', ...(theme.isYesco && { border: 1, borderColor: '#0F2147' }) })}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedFloor.name}{selectedFloor.floor ? ` ${selectedFloor.floor}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('workplaceDrawing.safetyDevices', { count: currentImageDevices.length })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {deviceEditMode && !readOnly ? (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => setDeviceTypeMenuAnchor(e.currentTarget)}
                        startIcon={(() => {
                          const Icon = deviceIcons[selectedDeviceType]
                          return <Icon sx={{ color: deviceColors[selectedDeviceType] }} />
                        })()}
                      >
                        {t(deviceLabelKeys[selectedDeviceType])}
                      </Button>
                      <Menu
                        anchorEl={deviceTypeMenuAnchor}
                        open={Boolean(deviceTypeMenuAnchor)}
                        onClose={() => setDeviceTypeMenuAnchor(null)}
                      >
                        {(Object.keys(deviceIcons) as SafetyDeviceType[]).map((type) => {
                          const Icon = deviceIcons[type]
                          return (
                            <MenuItem
                              key={type}
                              onClick={() => {
                                setSelectedDeviceType(type)
                                setDeviceTypeMenuAnchor(null)
                              }}
                              selected={selectedDeviceType === type}
                            >
                              <ListItemIcon>
                                <Icon sx={{ color: deviceColors[type] }} />
                              </ListItemIcon>
                              <ListItemText>{t(deviceLabelKeys[type])}</ListItemText>
                            </MenuItem>
                          )
                        })}
                      </Menu>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={handleEndDeviceEdit}
                      >
                        {t('workplaceDrawing.endDesignation')}
                      </Button>
                    </>
                  ) : (
                    <>
                      {!readOnly && (
                        <Button
                          variant="outlined"
                          onClick={handleStartDeviceEdit}
                          disabled={!imageFiles || imageFiles.length === 0}
                        >
                          {t('workplaceDrawing.designateLocation')}
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        onClick={handleShowDevices}
                        disabled={!imageFiles || imageFiles.length === 0}
                      >
                        {t('workplaceDrawing.viewLocation')}
                      </Button>
                    </>
                  )}
                </Box>
              </Box>

              {/* 이미지 네비게이션 */}
              {imageFiles && imageFiles.length > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                  <IconButton size="small" onClick={() => setSelectedImageIndex(prev => Math.max(0, prev - 1))} disabled={selectedImageIndex === 0}>
                    <NavigateBeforeIcon />
                  </IconButton>
                  {imageFiles.map((_, idx) => (
                    <Box
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      sx={{
                        width: 10, height: 10, borderRadius: '50%', cursor: 'pointer',
                        bgcolor: idx === selectedImageIndex ? 'primary.main' : 'grey.400',
                        transition: 'background-color 0.2s',
                      }}
                    />
                  ))}
                  <IconButton size="small" onClick={() => setSelectedImageIndex(prev => Math.min((imageFiles?.length || 1) - 1, prev + 1))} disabled={selectedImageIndex >= imageFiles.length - 1}>
                    <NavigateNextIcon />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary">
                    ({selectedImageIndex + 1}/{imageFiles.length})
                  </Typography>
                </Box>
              )}

              {/* 도면 영역 */}
              <Box
                sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <FloorPlanView
                  imagePath={selectedFloor.imagePath}
                  devices={currentImageDevices}
                  showDevices={showDevices}
                  visibleTypes={visibleTypes}
                  onImageClick={handleFloorPlanClick}
                  onDeviceDragEnd={handleDeviceDragEnd}
                  isEditMode={deviceEditMode}
                  pendingDevice={pendingDevice}
                  pendingDragConfirm={pendingDragConfirm}
                  imageFiles={imageFiles}
                  selectedImageIndex={selectedImageIndex}
                  t={t}
                />
              </Box>

              {/* 범례 - 안전장치 표시 중일 때만 */}
              {showDevices && (
                <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {(Object.keys(deviceIcons) as SafetyDeviceType[]).map((type) => {
                    const Icon = deviceIcons[type]
                    const count = currentImageDevices.filter((d) => d.type === type).length
                    if (count === 0) return null
                    return (
                      <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Icon sx={{ color: deviceColors[type], fontSize: 18 }} />
                        <Typography variant="body2">
                          {t(deviceLabelKeys[type])}: {count}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              )}

              {/* 안전장치 목록 (편집 모드일 때) */}
              {deviceEditMode && currentImageDevices.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    {t('workplaceDrawing.registeredDevices')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {currentImageDevices.map((device) => (
                      <Chip
                        key={device.id}
                        icon={(() => {
                          const Icon = deviceIcons[device.type]
                          return <Icon sx={{ color: `${deviceColors[device.type]} !important` }} />
                        })()}
                        label={device.name}
                        onDelete={() => handleDeleteDevice(device.id)}
                        size="small"
                        sx={{ bgcolor: 'grey.100' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>

          {/* Mobile Layout */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {/* 사업장/층 선택 드롭다운 */}
            <Paper variant="outlined">
              <Box sx={{ px: 1.5, py: 0.75, bgcolor: 'grey.100', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                  {t('factory.selectWorkplace')}
                </Typography>
                {renderSiteAddButton()}
              </Box>
              <Box sx={{ p: 1, maxHeight: 320, overflowY: 'auto' }}>
                {renderBuildingTree()}
              </Box>
            </Paper>

            {/* 도면 표시 */}
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedFloor.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedFloor.site}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('workplaceDrawing.safetyDevices', { count: currentImageDevices.length })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {!readOnly && (
                    <IconButton size="small" onClick={() => handleOpenDrawingDialog(selectedFloor)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleShowDevices}
                    disabled={!imageFiles || imageFiles.length === 0}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {t('workplaceDrawing.viewLocation')}
                  </Button>
                </Box>
              </Box>

              {/* 이미지 네비게이션 */}
              {imageFiles && imageFiles.length > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                  <IconButton size="small" onClick={() => setSelectedImageIndex(prev => Math.max(0, prev - 1))} disabled={selectedImageIndex === 0}>
                    <NavigateBeforeIcon fontSize="small" />
                  </IconButton>
                  {imageFiles.map((_, idx) => (
                    <Box
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      sx={{
                        width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                        bgcolor: idx === selectedImageIndex ? 'primary.main' : 'grey.400',
                      }}
                    />
                  ))}
                  <IconButton size="small" onClick={() => setSelectedImageIndex(prev => Math.min((imageFiles?.length || 1) - 1, prev + 1))} disabled={selectedImageIndex >= imageFiles.length - 1}>
                    <NavigateNextIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary">
                    ({selectedImageIndex + 1}/{imageFiles.length})
                  </Typography>
                </Box>
              )}

              {/* 도면 영역 */}
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <FloorPlanView
                  imagePath={selectedFloor.imagePath}
                  devices={currentImageDevices}
                  showDevices={showDevices}
                  visibleTypes={visibleTypes}
                  onImageClick={handleFloorPlanClick}
                  onDeviceDragEnd={handleDeviceDragEnd}
                  isEditMode={deviceEditMode}
                  pendingDevice={pendingDevice}
                  pendingDragConfirm={pendingDragConfirm}
                  imageFiles={imageFiles}
                  selectedImageIndex={selectedImageIndex}
                  t={t}
                />
              </Box>

              {/* 범례 - 안전장치 표시 중일 때만 */}
              {showDevices && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {(Object.keys(deviceIcons) as SafetyDeviceType[]).map((type) => {
                    const Icon = deviceIcons[type]
                    const count = currentImageDevices.filter((d) => d.type === type).length
                    if (count === 0) return null
                    return (
                      <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Icon sx={{ color: deviceColors[type], fontSize: 16 }} />
                        <Typography variant="caption">
                          {t(deviceLabelKeys[type])}: {count}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </Paper>

            {/* 모바일 안전장치 위치 지정 버튼 / 편집 모드 UI */}
            {readOnly ? null : deviceEditMode ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => setDeviceTypeMenuAnchor(e.currentTarget)}
                    startIcon={(() => {
                      const Icon = deviceIcons[selectedDeviceType]
                      return <Icon sx={{ color: deviceColors[selectedDeviceType] }} />
                    })()}
                    sx={{ flex: 1 }}
                  >
                    {t(deviceLabelKeys[selectedDeviceType])}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleEndDeviceEdit}
                    sx={{ flex: 1 }}
                  >
                    {t('workplaceDrawing.endDesignation')}
                  </Button>
                </Box>
                {/* 등록된 안전장치 목록 */}
                {currentImageDevices.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5, display: 'block' }}>
                      {t('workplaceDrawing.registeredDevices')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {currentImageDevices.map((device) => (
                        <Chip
                          key={device.id}
                          icon={(() => {
                            const Icon = deviceIcons[device.type]
                            return <Icon sx={{ color: `${deviceColors[device.type]} !important`, fontSize: '14px !important' }} />
                          })()}
                          label={device.name}
                          onDelete={() => handleDeleteDevice(device.id)}
                          size="small"
                          sx={{ bgcolor: 'grey.100', fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                onClick={handleStartDeviceEdit}
                disabled={!imageFiles || imageFiles.length === 0}
              >
                {t('workplaceDrawing.designateLocation')}
              </Button>
            )}
          </Box>
        </>
      )}

      {/* 안전장치 필터 Dialog */}
      <Dialog open={deviceDialogOpen} onClose={() => setDeviceDialogOpen(false)} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle>{t('workplaceDrawing.safetyDeviceFilter')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('workplaceDrawing.selectDeviceTypes')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {(Object.keys(deviceIcons) as SafetyDeviceType[]).map((type) => {
              const Icon = deviceIcons[type]
              const count = currentImageDevices.filter((d) => d.type === type).length
              return (
                <ListItemButton
                  key={type}
                  onClick={() => handleToggleDeviceType(type)}
                  dense
                >
                  <Checkbox
                    checked={visibleTypes.includes(type)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon sx={{ color: deviceColors[type] }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={t(deviceLabelKeys[type])}
                    secondary={count}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 1 } }}>
          <Button variant="outlined" onClick={() => setDeviceDialogOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* 도면 등록/수정 Dialog */}
      <Dialog open={drawingDialogOpen} onClose={handleCloseDrawingDialog} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle>{editingDrawing ? t('workplaceDrawing.editDrawing') : t('workplaceDrawing.registerDrawing')}</DialogTitle>
        <DialogContent>
          {/* PC용 테이블 레이아웃 */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden', mt: 2 }}>
            {/* Row 1: 도면명 | 사업장 — 사업장은 항상 readOnly (사업장 수정에서만 변경) */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('workplaceDrawing.drawingName')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  value={drawingForm.name}
                  helperText="사업장명은 [사업장 수정]에서 변경 가능"
                />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('workplace.title')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <TextField
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  value={drawingForm.site}
                />
              </Box>
            </Box>
            {/* Row 2: 층 | 설명 */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('common.floor')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('workplaceDrawing.floorExample')}
                  value={drawingForm.floor}
                  onChange={(e) => setDrawingForm({ ...drawingForm, floor: e.target.value })}
                />
              </Box>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('common.description')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('workplaceDrawing.drawingDescription')}
                  value={drawingForm.description}
                  onChange={(e) => setDrawingForm({ ...drawingForm, description: e.target.value })}
                />
              </Box>
            </Box>
            {/* Row 3: 도면 이미지 */}
            <Box sx={{ display: 'flex' }}>
              <Typography sx={{ width: 100, minWidth: 100, fontWeight: 'bold', bgcolor: 'grey.100', px: 2, py: 1.5, borderRight: 1, borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'divider', display: 'flex', alignItems: 'center', fontSize: '0.875rem', justifyContent: 'center', wordBreak: 'keep-all', textAlign: 'center' }}>
                {t('workplaceDrawing.drawingImage')}
              </Typography>
              <Box sx={{ flex: 1, px: 2, py: 1, bgcolor: 'background.paper' }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  size="small"
                >
                  {t('workplaceDrawing.selectImage')}
                </Button>
                {/* 기존 업로드된 이미지들 */}
                {editingDrawing && imageFiles && imageFiles.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {imageFiles.map((file) => (
                      <Box key={file.id} sx={{ position: 'relative', width: 80, height: 80 }}>
                        <Box
                          component="img"
                          src={`/api/files/${file.id}`}
                          alt={file.originalFilename}
                          onClick={() => setPreviewImageUrl(`/api/files/${file.id}`)}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                        />
                        <Box
                          onClick={() => setPreviewImageUrl(`/api/files/${file.id}`)}
                          sx={{ position: 'absolute', bottom: 2, right: 2, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <ZoomInIcon sx={{ fontSize: 14, color: 'white' }} />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteImage(file.id)}
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', width: 20, height: 20, '&:hover': { bgcolor: 'error.dark' } }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
                {/* 새로 추가할 이미지들 */}
                {pendingImageFiles.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {pendingImageFiles.map((file, idx) => (
                      <Box key={idx} sx={{ position: 'relative', width: 80, height: 80 }}>
                        <Box
                          component="img"
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          onClick={() => setPreviewImageUrl(URL.createObjectURL(file))}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1, border: '2px dashed', borderColor: 'primary.main', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                        />
                        <Box
                          onClick={() => setPreviewImageUrl(URL.createObjectURL(file))}
                          sx={{ position: 'absolute', bottom: 2, right: 2, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <ZoomInIcon sx={{ fontSize: 14, color: 'white' }} />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => setPendingImageFiles(prev => prev.filter((_, i) => i !== idx))}
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', width: 20, height: 20, '&:hover': { bgcolor: 'error.dark' } }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* 모바일용 레이아웃 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('workplaceDrawing.drawingName')}</Typography>
              <TextField
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                value={drawingForm.name}
                helperText="사업장명은 [사업장 수정]에서 변경"
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('workplace.title')}</Typography>
              <TextField
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                value={drawingForm.site}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.floor')}</Typography>
              <TextField
                fullWidth
                size="small"
                placeholder={t('workplaceDrawing.floorExample')}
                value={drawingForm.floor}
                onChange={(e) => setDrawingForm({ ...drawingForm, floor: e.target.value })}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('common.description')}</Typography>
              <TextField
                fullWidth
                size="small"
                placeholder={t('workplaceDrawing.drawingDescription')}
                value={drawingForm.description}
                onChange={(e) => setDrawingForm({ ...drawingForm, description: e.target.value })}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, bgcolor: 'grey.200', px: 1.5, py: 0.75, borderRadius: 0.5 }}>{t('workplaceDrawing.drawingImage')}</Typography>
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                size="small"
              >
                {t('workplaceDrawing.selectImage')}
              </Button>
              {/* 기존 업로드된 이미지들 */}
              {editingDrawing && imageFiles && imageFiles.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {imageFiles.map((file) => (
                    <Box key={file.id} sx={{ position: 'relative', width: 70, height: 70 }}>
                      <Box
                        component="img"
                        src={`/api/files/${file.id}`}
                        alt={file.originalFilename}
                        onClick={() => setPreviewImageUrl(`/api/files/${file.id}`)}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1, border: 1, borderColor: 'divider', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                      />
                      <Box
                        onClick={() => setPreviewImageUrl(`/api/files/${file.id}`)}
                        sx={{ position: 'absolute', bottom: 2, right: 2, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <ZoomInIcon sx={{ fontSize: 12, color: 'white' }} />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteImage(file.id)}
                        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', width: 20, height: 20, '&:hover': { bgcolor: 'error.dark' } }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
              {/* 새로 추가할 이미지들 */}
              {pendingImageFiles.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {pendingImageFiles.map((file, idx) => (
                    <Box key={idx} sx={{ position: 'relative', width: 70, height: 70 }}>
                      <Box
                        component="img"
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        onClick={() => setPreviewImageUrl(URL.createObjectURL(file))}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1, border: '2px dashed', borderColor: 'primary.main', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                      />
                      <Box
                        onClick={() => setPreviewImageUrl(URL.createObjectURL(file))}
                        sx={{ position: 'absolute', bottom: 2, right: 2, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <ZoomInIcon sx={{ fontSize: 12, color: 'white' }} />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => setPendingImageFiles(prev => prev.filter((_, i) => i !== idx))}
                        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', width: 20, height: 20, '&:hover': { bgcolor: 'error.dark' } }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 1 }, gap: 1 }}>
          <Button variant="outlined" onClick={handleCloseDrawingDialog} sx={{ flex: { xs: 1, sm: 'none' } }}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSaveDrawing}
            disabled={!drawingForm.name || !drawingForm.site || (!editingDrawing && pendingImageFiles.length === 0) || createDrawingMutation.isPending || updateDrawingMutation.isPending}
            sx={{ flex: { xs: 1, sm: 'none' } }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 안전장치 이름 입력 Dialog */}
      <Dialog open={deviceNameDialogOpen} onClose={() => { setDeviceNameDialogOpen(false); setPendingDevice(null) }} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle>{t('workplaceDrawing.registerDevice')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
            {pendingDevice && (() => {
              const Icon = deviceIcons[pendingDevice.type]
              return (
                <>
                  <Icon sx={{ color: deviceColors[pendingDevice.type], fontSize: 24 }} />
                  <Typography variant="body1" fontWeight="bold">
                    {t(deviceLabelKeys[pendingDevice.type])}
                  </Typography>
                </>
              )
            })()}
          </Box>
          <TextField
            label={t('workplaceDrawing.deviceName')}
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            fullWidth
            autoFocus
            placeholder={t('workplaceDrawing.deviceNameExample')}
          />
          {pendingDevice && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('workplaceDrawing.position')}: X={pendingDevice.x}, Y={pendingDevice.y}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { setDeviceNameDialogOpen(false); setPendingDevice(null) }}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSaveDevice}
            disabled={!newDeviceName.trim() || addDeviceMutation.isPending}
          >
            {addDeviceMutation.isPending ? t('common.loading') : t('common.save', '저장')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 드래그 위치 변경 확인 Dialog */}
      <Dialog open={dragConfirmDialogOpen} onClose={handleCancelDrag} maxWidth="xs" fullWidth sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 } } }}>
        <DialogTitle>{t('workplaceDrawing.moveDevice')}</DialogTitle>
        <DialogContent>
          {pendingDragConfirm && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {(() => {
                  const Icon = deviceIcons[pendingDragConfirm.device.type]
                  return (
                    <>
                      <Icon sx={{ color: deviceColors[pendingDragConfirm.device.type], fontSize: 24 }} />
                      <Typography variant="body1" fontWeight="bold">
                        {t(deviceLabelKeys[pendingDragConfirm.device.type])}
                      </Typography>
                    </>
                  )
                })()}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('workplaceDrawing.confirmMoveDevice')}
              </Typography>
              <TextField
                label={t('workplaceDrawing.deviceName')}
                value={dragEditName}
                onChange={(e) => setDragEditName(e.target.value)}
                fullWidth
                autoFocus
                size="small"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleCancelDrag}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleConfirmDrag}
            disabled={!dragEditName.trim() || updateDeviceMutation.isPending}
          >
            {updateDeviceMutation.isPending ? t('common.loading') : t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 이미지 프리뷰 Dialog */}
      <Dialog
        open={!!previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
        maxWidth="lg"
        fullWidth
        sx={{ '& .MuiDialog-paper': { mx: { xs: 1, sm: 2 }, bgcolor: 'grey.900' } }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewImageUrl(null)}
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', zIndex: 1, '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
          >
            <CloseIcon />
          </IconButton>
          {previewImageUrl && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, minHeight: 300 }}>
              <Box
                component="img"
                src={previewImageUrl}
                alt="preview"
                sx={{ maxWidth: '100%', maxHeight: 'calc(90vh - 64px)', objectFit: 'contain' }}
              />
            </Box>
          )}
        </Box>
      </Dialog>

      {/* 사업장 등록/수정 다이얼로그 */}
      <WorkplaceSiteFormDialog
        open={siteDialogOpen}
        editing={editingSite}
        onClose={() => { setSiteDialogOpen(false); setEditingSite(null) }}
      />
    </Box>
  )
}

export default WorkplaceDrawingsPage
