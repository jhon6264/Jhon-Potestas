import { useReveal } from '../../hooks/useReveal'

function Section({ id, title, description, action, children }) {
  const { ref, isVisible } = useReveal()

  return (
    <section
      id={id}
      ref={ref}
      className={`section-block ${isVisible ? 'section-visible' : ''}`}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <header className="section-header">
        <div>
          <h2 id={id ? `${id}-title` : undefined}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="section-action">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}

export default Section
