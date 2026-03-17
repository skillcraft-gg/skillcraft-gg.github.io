import AppShell from '../components/AppShell'

export default function NotFoundPage() {
  return (
    <AppShell
      title="Not Found"
      activePath="/"
      copyClassName="copy--wide"
    >
      <section className="section">
        <p className="eyebrow">Not found</p>
        <h1>Page not found</h1>
        <p>This route is not available yet. The homepage is the current focal experience.</p>
        <a className="btn btn-secondary" href="/">Return home</a>
      </section>
    </AppShell>
  )
}
