export function LoadingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1 w-1 rounded-full bg-current"
          style={{ animation: `dotPulse 0.8s ${delay}ms ease-out infinite` }}
        />
      ))}
    </span>
  );
}
