import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Box, Button, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface SignaturePadProps {
  value?: string
  onChange: (dataUrl: string) => void
  height?: number
}

const CANVAS_HEIGHT = 80

const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange, height = CANVAS_HEIGHT }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [canvasWidth, setCanvasWidth] = useState(300)

  const isDark = theme.palette.mode === 'dark'
  const bgColor = isDark ? theme.palette.background.paper : '#fff'
  const strokeColor = isDark ? '#fff' : '#000'
  const borderColor = isDark ? theme.palette.grey[600] : theme.palette.grey[400]

  // 컨테이너 크기에 맞춰 캔버스 해상도 설정
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasWidth(Math.floor(entry.contentRect.width))
      }
    })
    observer.observe(container)
    setCanvasWidth(Math.floor(container.clientWidth))
    return () => observer.disconnect()
  }, [])

  const clearCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasWidth, height)
  }, [bgColor, canvasWidth, height])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasWidth <= 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    clearCanvas(ctx)

    if (value) {
      const img = new Image()
      img.onload = () => { ctx.drawImage(img, 0, 0, canvasWidth, height) }
      img.src = value
    }
  }, [value, clearCanvas, canvasWidth, height])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = strokeColor
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const endDraw = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) onChange(canvas.toDataURL('image/png'))
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    clearCanvas(ctx)
    onChange('')
  }

  return (
    <Box sx={{ display: 'flex', width: '100%', gap: 0 }}>
      <Box ref={containerRef} sx={{ flex: 1, minWidth: 0 }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={height}
          style={{ border: `1px solid ${borderColor}`, borderRadius: '4px 0 0 4px', cursor: 'crosshair', touchAction: 'none', display: 'block', width: '100%', height }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </Box>
      <Button variant="contained" onClick={handleClear}
        sx={{ minWidth: 50, height, borderRadius: '0 4px 4px 0', bgcolor: 'error.main', color: '#fff', '&:hover': { bgcolor: 'error.dark' }, fontSize: '0.75rem', px: 1 }}>
        {t('common.clear', '지우기')}
      </Button>
    </Box>
  )
}

export default SignaturePad
