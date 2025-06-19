import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-callout font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-ring-apple active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-apple-md hover:shadow-apple-lg hover:bg-primary/90 hover-lift",
        destructive:
          "bg-destructive text-white shadow-apple-md hover:shadow-apple-lg hover:bg-destructive/90 hover-lift",
        outline:
          "border border-border/60 bg-card/50 glass hover:bg-card/80 hover:border-border shadow-apple-sm hover:shadow-apple-md",
        secondary:
          "bg-secondary text-secondary-foreground shadow-apple-sm hover:bg-secondary/80 hover:shadow-apple-md",
        ghost:
          "hover:bg-muted/50 hover:text-foreground transition-colors duration-200",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        default: "h-11 px-6 py-3 has-[>svg]:px-5",
        sm: "h-9 rounded-lg gap-1.5 px-4 text-subheadline has-[>svg]:px-3",
        lg: "h-12 rounded-xl px-8 text-headline has-[>svg]:px-6",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
