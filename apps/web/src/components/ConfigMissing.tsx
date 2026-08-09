export function ConfigMissing() {
  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">MediaForge</p>
        <h1>API key required</h1>
        <p>
          Set <code>VITE_PEXELS_API_KEY</code> in <code>apps/web/.env</code> (copy from{' '}
          <code>.env.example</code>), then restart the dev server.
        </p>
        <p className="muted">
          Get a free key from the Pexels API dashboard. Do not commit real keys.
        </p>
      </section>
    </main>
  );
}
