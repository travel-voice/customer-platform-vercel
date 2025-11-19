import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] relative overflow-hidden cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#20b7f1] to-[#f23e7b] text-white font-bold rounded-full shadow-sm hover:shadow-md focus-visible:ring-[#1AADF0]/50 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        destructive:
          "bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 hover:scale-105 focus-visible:ring-red-500/20",
        outline:
          "border border-[#1AADF0] bg-transparent text-[#1AADF0] rounded-lg shadow-none hover:bg-[#1AADF0] hover:text-white transition-colors duration-200",
        secondary:
          "bg-gray-100 text-gray-900 rounded-lg shadow-none hover:bg-gray-200",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-[#1AADF0] rounded-lg transition-colors duration-300",
        link: "text-[#1AADF0] underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 py-1.5 text-sm",
        lg: "h-12 px-8 py-3 text-base",
        icon: "size-10",
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
