// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-glitch" data-text="404">404</div>
        <div className="error-message">
          <span className="error-label">ERROR:</span> FILE_NOT_FOUND
        </div>
        <p className="error-desc">
          The requested resource could not be located in this dimension.
        </p>
        <Link href="/" className="error-link">
          RETURN TO MONOLITH
        </Link>
      </div>
      <div className="error-scanlines" />
    </div>
  );
}
