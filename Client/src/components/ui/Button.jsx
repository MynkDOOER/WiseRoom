export default function Button({
  variant = "secondary",
  className = "",
  type = "button",
  children,
  ...props
}) {
  return (
    <button type={type} className={`button ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
