/** Page heading. Every title is centred at the top of the page content. */
export default function PageTitle({ title, subtitle }) {
  return (
    <header className="page-title">
      <h1>{title}</h1>
      <span className="title-rule" aria-hidden="true" />
      {subtitle && <p>{subtitle}</p>}
    </header>
  )
}
