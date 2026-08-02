import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function FavoriteToggle({
  checked = false,
  onChange,
  disabled = false,
  isLoading = false,
  size = 'md',
  label,
  className,
}) {
  const handleClick = () => {
    if (!disabled && !isLoading && onChange) {
      onChange(!checked);
    }
  };

  const buttonSize = label ? 'sm' : 'icon';

  return (
    <Button
      type="button"
      variant="ghost"
      size={buttonSize}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center gap-2',
        (disabled || isLoading) && 'cursor-not-allowed opacity-50',
        label && 'px-3',
        className
      )}
      aria-pressed={checked}
      aria-label={
        label || (checked ? 'remove_from_favorites' : 'mark_as_favorite')
      }
    >
      {isLoading ? (
        <Loader2
          className={cn(
            iconSizeClasses[size],
            'animate-spin text-muted-foreground'
          )}
        />
      ) : (
        <Star
          className={cn(
            iconSizeClasses[size],
            'transition-colors duration-200',
            checked
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-transparent text-muted-foreground hover:text-muted-foreground/80'
          )}
        />
      )}
      {label && (
        <span
          className={cn(
            'text-sm font-medium',
            checked ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {label}
        </span>
      )}
    </Button>
  );
}

FavoriteToggle.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  label: PropTypes.string,
  className: PropTypes.string,
};
