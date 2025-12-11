import { memo } from 'react'

/**
 * Reusable button component with variants
 */
const Button = memo(function Button({
  children,
  onClick,
  disabled = false,
  active = false,
  variant = 'default',
  className = '',
}) {
  const variantClasses = variant.split(' ').map(v => `btn-${v}`)
  const classes = [
    'btn',
    ...variantClasses,
    active ? 'active' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
})

export default Button
