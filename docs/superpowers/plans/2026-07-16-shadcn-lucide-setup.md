# shadcn/ui + lucide-react Setup Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install lucide-react and set up shadcn/ui Button component.

**Architecture:** Manual setup — install npm packages, create a utility helper, and copy the shadcn Button component. No CLI needed.

**Tech Stack:** React 19, TypeScript, Tailwind v4, esbuild

## Global Constraints

- All files go under `app/javascript/`
- Follow existing React/TypeScript conventions in the project

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`
- Lockfile: `yarn.lock`

- [ ] **Step 1: Install packages**

```bash
yarn add lucide-react clsx tailwind-merge class-variance-authority
```

Expected: packages added to `package.json` dependencies and `yarn.lock` updated.

- [ ] **Step 2: Verify installation**

```bash
node -e "require('lucide-react'); require('clsx'); require('tailwind-merge'); require('class-variance-authority'); console.log('OK')"
```

Expected: prints "OK" with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: add lucide-react, clsx, tailwind-merge, cva"
```

---

### Task 2: Create cn() utility

**Files:**
- Create: `app/javascript/lib/utils.ts`

- [ ] **Step 1: Create lib/utils.ts**

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Commit**

```bash
git add app/javascript/lib/utils.ts
git commit -m "feat: add cn() utility for Tailwind class merging"
```

---

### Task 3: Add shadcn Button component

**Files:**
- Create: `app/javascript/components/ui/button.tsx`

- [ ] **Step 1: Create components/ui/ directory and button.tsx**

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

- [ ] **Step 2: Install @radix-ui/react-slot**

```bash
yarn add @radix-ui/react-slot
```

- [ ] **Step 3: Commit**

```bash
git add app/javascript/components/ui/button.tsx package.json yarn.lock
git commit -m "feat: add shadcn Button component"
```

---

### Task 4: Verify build

- [ ] **Step 1: Run build to check for errors**

```bash
yarn build
```

Expected: esbuild completes with no errors.

- [ ] **Step 2: Run lint**

```bash
yarn lint
```

Expected: no lint errors.
