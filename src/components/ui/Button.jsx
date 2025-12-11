import { memo } from 'react'

function Button({ variant = '', active = false, disabled = false, onClick, children }) {
  const classes = ['btn']
  if (variant) classes.push(...variant.split(' ').map(v => 'btn-' + v))
  if (active) classes.push('active')
  return <button className={classes.join(' ')} onClick={onClick} disabled={disabled}>{children}</button>
}

export default memo(Button)
