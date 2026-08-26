/** Fit canvas to viewport; keep large desktop mins only on wide screens. */
export function getFitCanvasSize({
  minDesktopWidth = 800,
  minDesktopHeight = 600,
  chrome = 160,
  breakpoint = 900,
} = {}) {
  const availW = Math.max(280, window.innerWidth - 16)
  const availH = Math.max(280, window.innerHeight - chrome)

  if (window.innerWidth >= breakpoint) {
    return {
      width: Math.max(minDesktopWidth, availW),
      height: Math.max(minDesktopHeight, availH),
      narrow: false,
    }
  }

  return {
    width: availW,
    height: availH,
    narrow: true,
  }
}

/** Scale circle radius so objects stay inside the canvas. */
export function getFitCircleRadius(baseRadius, canvasWidth, canvasHeight, cardWidth = 70) {
  const minSide = Math.min(canvasWidth, canvasHeight)
  const padding = Math.min(cardWidth + 24, minSide * 0.32)
  const maxRadius = minSide / 2 - padding
  if (maxRadius < 48) {
    return Math.max(28, minSide * 0.28)
  }
  return Math.min(baseRadius, maxRadius)
}

/** Map pointer coords from CSS box to canvas bitmap space. */
export function canvasPointer(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
    scaleX,
    scaleY,
    rect,
  }
}
