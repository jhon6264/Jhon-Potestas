import { animate, stagger } from 'animejs'
import { useEffect, useRef } from 'react'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useStaggeredReveal() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || prefersReducedMotion()) return undefined

    const items = container.querySelectorAll('[data-stagger-item]')
    if (!items.length) return undefined

    items.forEach((item) => {
      item.style.opacity = '0'
      item.style.transform = 'translateY(18px) scale(0.985)'
    })

    const animation = animate(items, {
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.985, 1],
      duration: 620,
      delay: stagger(70),
      ease: 'outCubic',
    })

    return () => {
      animation.revert()
    }
  }, [])

  return containerRef
}
