import Link from "next/link";

const media = {
  heroVideo: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
  heroPoster:
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1400&q=80",
  cardOne:
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1400&q=80",
  cardTwo:
    "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1400&q=80",
  gifOne:
    "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif",
  gifTwo:
    "https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif"
};

export default function RootPage() {
  return (
    <main className="landing-wrap">
      <section className="landing-nav">
        <p className="brand-mark">
          <span className="brand-script">Temvy</span>
          <span className="brand-sans">Wallet</span>
        </p>
        <div className="landing-nav-right">
          <a href="#features" className="landing-link">
            Features
          </a>
        </div>
      </section>

      <section className="landing-hero panel">
        <div className="landing-copy">
          <p className="chip">Tempo + Privy</p>
          <h1>Payments that feel like chat, settle like rails.</h1>
          <p className="meta-text">
            Send by email or phone. No seed phrases, no gas confusion, no wallet addresses in the UX.
            Just money movement that feels instant and human.
          </p>
          <div className="landing-actions">
            <Link href="/login" className="btn btn-primary landing-btn">
              Test App
            </Link>
            <a href="#features" className="btn btn-secondary landing-btn">
              See Product Story
            </a>
          </div>
          <div className="landing-stats">
            <article className="landing-stat-card">
              <p>Auth + wallet link</p>
              <strong>&lt; 60s</strong>
            </article>
            <article className="landing-stat-card">
              <p>Identity route</p>
              <strong>Email / Phone</strong>
            </article>
            <article className="landing-stat-card">
              <p>Status model</p>
              <strong>Pending / Settled</strong>
            </article>
          </div>
        </div>

        <div className="landing-visual">
          <video className="landing-video" autoPlay muted loop playsInline poster={media.heroPoster}>
            <source src={media.heroVideo} type="video/mp4" />
          </video>
          <div className="landing-orb landing-orb-a" />
          <div className="landing-orb landing-orb-b" />
          <article className="landing-float landing-float-top">
            <p>Now</p>
            <strong>Payment prepared</strong>
          </article>
          <article className="landing-float landing-float-bottom">
            <p>Recipient</p>
            <strong>Claim pending invite</strong>
          </article>
        </div>
      </section>

      <section id="features" className="landing-grid">
        <article className="landing-feature panel">
          <img src={media.cardOne} alt="Card payment flow" loading="lazy" />
          <h3>Identity-first send flow</h3>
          <p className="meta-text">
            Send to contacts by handle while backend resolves wallet rails behind the scenes.
          </p>
        </article>
        <article className="landing-feature panel">
          <img src={media.cardTwo} alt="Mobile wallet experience" loading="lazy" />
          <h3>Social money dashboard</h3>
          <p className="meta-text">
            Balance context per person: who owes, who is settled, and what changed this week.
          </p>
        </article>
        <article className="landing-feature panel">
          <img src={media.gifOne} alt="Animated trading chart" loading="lazy" />
          <h3>Live motion feedback</h3>
          <p className="meta-text">Animated micro-screens make the product feel alive during demos.</p>
        </article>
        <article className="landing-feature panel">
          <img src={media.gifTwo} alt="Animated finance scene" loading="lazy" />
          <h3>Sponsor-ready narrative</h3>
          <p className="meta-text">
            Product story is clear from first glance: consumer UX on top of robust rails.
          </p>
        </article>
      </section>

      <section className="landing-footer panel">
        <h2>Ready to try Temvy?</h2>
        <p className="meta-text">Authenticate once, then enter the app workspace.</p>
        <Link href="/login" className="btn btn-primary landing-btn">
          Test App
        </Link>
      </section>
    </main>
  );
}
