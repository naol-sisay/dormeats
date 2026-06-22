// A simple reusable card container
export default function Card({ children, className = "" }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}
