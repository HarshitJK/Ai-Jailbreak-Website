import { useEffect, useRef } from 'react'

export default function NeuralCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let mouse = { x: -9999, y: -9999 }

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    })
    canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999 })

    const COUNT = 60
    const nodes = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
    }))

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Mouse attraction
      nodes.forEach(n => {
        const dx = mouse.x - n.x, dy = mouse.y - n.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < 150) {
          n.vx += dx / dist * 0.02
          n.vy += dy / dist * 0.02
        }
        n.vx *= 0.99; n.vy *= 0.99
        n.x += n.vx; n.y += n.vy
        if (n.x < 0) n.x = canvas.width
        if (n.x > canvas.width) n.x = 0
        if (n.y < 0) n.y = canvas.height
        if (n.y > canvas.height) n.y = 0
      })

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx*dx + dy*dy)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            const alpha = (1 - d/120) * 0.25
            ctx.strokeStyle = `rgba(147,51,234,${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(168,85,247,0.6)'
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'auto' }}
    />
  )
}
