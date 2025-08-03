import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-background border border-transparent hover:bg-primary/80',
        destructive:
          'bg-error text-background border border-transparent hover:bg-error/80 active:bg-error/90',
        outline:
          'border border-secondary bg-transparent text-foreground hover:bg-secondary/10 hover:border-secondary/80 active:bg-secondary/20',
        secondary:
          'px-8 py-6 bg-background text-primary font-semibold hover:bg-primary/10 transition-colors text-center',
        ghost:
          'bg-transparent text-primary hover:bg-secondary/10 hover:text-foreground active:bg-secondary/20',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80 active:text-primary/90 p-0 h-auto shadow-none',
        primaryOutline:
          'border border-primary bg-transparent text-primary hover:bg-primary/10 hover:border-primary/80 hover:text-primary/90 active:bg-primary/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 py-1.5 text-xs',
        lg: 'h-12 px-6 py-3 text-base',
        icon: 'h-10 w-10 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
