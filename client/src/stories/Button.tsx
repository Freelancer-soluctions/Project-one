import React from 'react'
import PropTypes, { string } from 'prop-types'
import './button.css'

/**
 * Primary UI component for user interaction
 */
interface PropsButton {
  primary?: boolean
  backgroundColor?: string
  size?: 'small' | 'medium' | 'large'
  label: string
  onClick?: () => void
}

export const Button = React.forwardRef<HTMLButtonElement, PropsButton>(
  ({ primary = false, backgroundColor, size = 'medium', label, ...props }, ref) => {
    const mode = primary
      ? 'storybook-button--primary'
      : 'storybook-button--secondary'
    
    return (
      <button
        type='button'
        className={['storybook-button', `storybook-button--${size}`, mode].join(' ')}
        style={backgroundColor ? { backgroundColor } : undefined}
        ref={ref}
        {...props}
      >
        {label}
      </button>
    )
  }
)

Button.propTypes = {
  primary: PropTypes.bool,
  backgroundColor: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func
}

Button.defaultProps = {
  primary: false,
  backgroundColor: "blue",
  size: 'medium',
  onClick: undefined
}
