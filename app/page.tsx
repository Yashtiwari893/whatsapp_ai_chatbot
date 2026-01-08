export default function Home() {
  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>11za AI</div>
        <div style={styles.navLinks}>
          <a href="#" style={styles.navLink}>Docs</a>
          <a href="#" style={styles.navLink}>APIs</a>
          <a href="#" style={styles.navLink}>Status</a>
          <a href="#" style={styles.navLink}>GitHub</a>
        </div>
      </nav>

      {/* Main Dashboard */}
      <main style={styles.main}>
        <h1 style={styles.heading}>11za AI Dashboard</h1>
        <p style={styles.subheading}>
          AI APIs for automation & data extraction
        </p>

        {/* API Cards */}
        <div style={styles.grid}>
          <ApiCard
            title="Image Upload API"
            desc="Upload images securely for AI processing and analysis."
          />

          <ApiCard
            title="Image Read & Data Extraction API"
            desc="Extract structured data from images using real AI models."
          />

          <ApiCard
            title="More APIs Coming Soon"
            desc="OCR, document parsing, automation & more."
            disabled
          />
        </div>
      </main>
    </div>
  );
}

/* ---------------- COMPONENT ---------------- */

function ApiCard({
  title,
  desc,
  disabled = false,
}: {
  title: string;
  desc: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ 
      ...styles.card, 
      opacity: disabled ? 0.5 : 1 
    }}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardDesc}>{desc}</p>
      <button style={styles.button} disabled={disabled}>
        {disabled ? 'Coming Soon' : 'View API'}
      </button>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0b0b0f',
    color: '#ffffff',
    fontFamily: 'Inter, system-ui, sans-serif',
  },

  nav: {
    position: 'sticky',
    top: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#111118',
    borderBottom: '1px solid #1f1f2e',
    zIndex: 10,
  },

  logo: {
    fontSize: 18,
    fontWeight: 600,
  },

  navLinks: {
    display: 'flex',
    gap: 24,
  },

  navLink: {
    color: '#a1a1aa',
    textDecoration: 'none',
    fontSize: 14,
  },

  main: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '64px 24px',
    textAlign: 'center',
  },

  heading: {
    fontSize: 36,
    fontWeight: 700,
    marginBottom: 8,
  },

  subheading: {
    fontSize: 16,
    color: '#a1a1aa',
    marginBottom: 48,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 24,
  },

  card: {
    backgroundColor: '#111118',
    border: '1px solid #1f1f2e',
    borderRadius: 12,
    padding: 24,
    textAlign: 'left',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
  },

  cardDesc: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 20,
  },

  button: {
    padding: '10px 16px',
    backgroundColor: '#4f46e5',
    border: 'none',
    borderRadius: 8,
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 14,
  },
};
