function Card({ className = '', children }) {
  const classes = ['card', className].filter(Boolean).join(' ')
  return <article className={classes}>{children}</article>
}

export default Card
