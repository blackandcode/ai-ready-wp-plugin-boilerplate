interface StatusBadgeProps {
  status: 'success' | 'warning' | 'neutral';
  children: React.ReactNode;
}

export function StatusBadge( { status, children }: StatusBadgeProps ) {
  return (
    <span className={ `airwp-status-badge status-${ status }` }>
      { children }
    </span>
  );
}
