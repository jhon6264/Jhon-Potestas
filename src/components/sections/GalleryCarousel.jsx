import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function GalleryCarousel({ items }) {
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryVisibleCount, setGalleryVisibleCount] = useState(5)
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(null)
  const galleryViewportRef = useRef(null)
  const galleryLength = items.length
  const maxGalleryIndex = Math.max(galleryLength - galleryVisibleCount, 0)
  const activeGalleryIndex = Math.min(galleryIndex, maxGalleryIndex)
  const selectedGalleryItem = selectedGalleryIndex === null ? null : items[selectedGalleryIndex]

  useEffect(() => {
    const updateVisibleCount = () => {
      let nextVisibleCount = 5

      if (window.innerWidth < 640) {
        nextVisibleCount = 1
      } else if (window.innerWidth < 768) {
        nextVisibleCount = 3
      } else if (window.innerWidth < 1024) {
        nextVisibleCount = 4
      }

      setGalleryVisibleCount(nextVisibleCount)
    }

    updateVisibleCount()
    window.addEventListener('resize', updateVisibleCount)

    return () => window.removeEventListener('resize', updateVisibleCount)
  }, [])

  useEffect(() => {
    const viewport = galleryViewportRef.current
    if (!viewport) return

    const track = viewport.querySelector('.gallery-track')
    const firstItem = track?.querySelector('.gallery-item')
    if (!track || !firstItem) return

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap || '0')
    const itemWidth = firstItem.getBoundingClientRect().width

    viewport.scrollTo({
      left: activeGalleryIndex * (itemWidth + gap),
      behavior: 'smooth',
    })
  }, [activeGalleryIndex, galleryVisibleCount])

  useEffect(() => {
    if (selectedGalleryIndex === null) return undefined

    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedGalleryIndex(null)
      }

      if (event.key === 'ArrowLeft') {
        setSelectedGalleryIndex((currentIndex) =>
          currentIndex === null ? currentIndex : (currentIndex - 1 + galleryLength) % galleryLength,
        )
      }

      if (event.key === 'ArrowRight') {
        setSelectedGalleryIndex((currentIndex) =>
          currentIndex === null ? currentIndex : (currentIndex + 1) % galleryLength,
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [galleryLength, selectedGalleryIndex])

  const goToPreviousGalleryImage = () => {
    setGalleryIndex((currentIndex) => {
      const currentClampedIndex = Math.min(currentIndex, maxGalleryIndex)
      return currentClampedIndex === 0 ? maxGalleryIndex : currentClampedIndex - 1
    })
  }

  const goToNextGalleryImage = () => {
    setGalleryIndex((currentIndex) => {
      const currentClampedIndex = Math.min(currentIndex, maxGalleryIndex)
      return currentClampedIndex >= maxGalleryIndex ? 0 : currentClampedIndex + 1
    })
  }

  const showPreviousSelectedGalleryImage = (event) => {
    event.stopPropagation()
    setSelectedGalleryIndex((currentIndex) =>
      currentIndex === null ? currentIndex : (currentIndex - 1 + galleryLength) % galleryLength,
    )
  }

  const showNextSelectedGalleryImage = (event) => {
    event.stopPropagation()
    setSelectedGalleryIndex((currentIndex) => (currentIndex === null ? currentIndex : (currentIndex + 1) % galleryLength))
  }

  return (
    <section className="bento-card gallery-card animate-fade-in animation-delay-600">
      <h2>Gallery</h2>
      <div className={`gallery-carousel gallery-visible-${galleryVisibleCount}`}>
        <div className="gallery-viewport" ref={galleryViewportRef}>
          <div className="gallery-track">
            {items.map((item, index) => (
              <button
                key={item.src}
                type="button"
                className="gallery-item"
                onClick={() => setSelectedGalleryIndex(index)}
                aria-label={`Open ${item.alt}`}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.remove()
                  }}
                />
              </button>
            ))}
          </div>
        </div>
        {items.length > galleryVisibleCount ? (
          <>
            <button
              type="button"
              className="gallery-nav gallery-nav-prev"
              onClick={goToPreviousGalleryImage}
              aria-label="Previous gallery image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="gallery-nav gallery-nav-next"
              onClick={goToNextGalleryImage}
              aria-label="Next gallery image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        ) : null}
      </div>
      {selectedGalleryItem && typeof document !== 'undefined'
        ? createPortal(
            <div className="gallery-lightbox" role="dialog" aria-modal="true" onClick={() => setSelectedGalleryIndex(null)}>
              <button
                type="button"
                className="gallery-lightbox-close"
                onClick={() => setSelectedGalleryIndex(null)}
                aria-label="Close gallery image"
              >
                <X size={22} />
              </button>
              <div className="gallery-lightbox-counter">
                {selectedGalleryIndex + 1} / {items.length}
              </div>
              {items.length > 1 ? (
                <button
                  type="button"
                  className="gallery-lightbox-nav gallery-lightbox-prev"
                  onClick={showPreviousSelectedGalleryImage}
                  aria-label="Previous gallery image"
                >
                  <ChevronLeft size={24} />
                </button>
              ) : null}
              {items.length > 1 ? (
                <button
                  type="button"
                  className="gallery-lightbox-nav gallery-lightbox-next"
                  onClick={showNextSelectedGalleryImage}
                  aria-label="Next gallery image"
                >
                  <ChevronRight size={24} />
                </button>
              ) : null}
              <div className="gallery-lightbox-frame" onClick={(event) => event.stopPropagation()}>
                <img src={selectedGalleryItem.src} alt={selectedGalleryItem.alt} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}

export default GalleryCarousel
