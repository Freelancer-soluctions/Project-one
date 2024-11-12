import React from 'react';
import { cn } from '@/lib/utils';

interface PropsInput {
  className?: string;
  type?: string;
  children?: React.ReactNode;
  value?:string;
  min?:string;
  max?: number;
  defaultValue?:number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = React.forwardRef<HTMLInputElement, PropsInput>(
  ({ className, type, ...props }, ref: React.Ref<HTMLInputElement>) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
