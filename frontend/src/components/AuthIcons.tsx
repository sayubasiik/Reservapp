interface IconProps {
  className?: string;
  size?: number;
}

function IconBase({
  className,
  size = 24,
  children,
}: IconProps & {
  children: React.ReactNode;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </IconBase>
  );
}

export function BuildingIcon(
  props: IconProps,
) {
  return (
    <IconBase {...props}>
      <path d="M4 21V3h11v18" />
      <path d="M15 9h5v12" />
      <path d="M8 7h3" />
      <path d="M8 11h3" />
      <path d="M8 15h3" />
      <path d="M2 21h20" />
    </IconBase>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </IconBase>
  );
}