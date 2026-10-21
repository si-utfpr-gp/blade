import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "../../../lib/utils"
import { buttonVariants } from "./button"

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

function DialogHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  )
}

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

/**
 * Asks before something that cannot be undone or recovered: discarding
 * unsaved work, or overwriting a stored diagram. Built on alertdialog so a
 * screen reader announces it as a warning rather than ordinary content, and
 * so focus is trapped and Esc resolves it while it is open.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onCancel,
  className,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
  className?: string
}) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        // Radix reports the close here for Esc, the overlay and the close
        // button alike, so every dismissal goes through the same handler.
        if (!next) onCancel()
      }}
    >
      <DialogPrimitive.Content role="alertdialog" asChild>
        <DialogContent className={className}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className={buttonVariants({ variant: "outline" })}
              >
                {cancelLabel}
              </button>
            </DialogPrimitive.Close>
            <button
              type="button"
              className={buttonVariants({
                variant: destructive ? "destructive" : "default",
              })}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </DialogFooter>
        </DialogContent>
      </DialogPrimitive.Content>
    </DialogPrimitive.Root>
  )
}
export interface IDialogChoice {
  label: string
  description: string
  icon?: React.ReactNode
  onSelect: () => void
}

/**
 * Asks the student to pick one of a few ways to go on, each explained in a
 * line, such as where to save. Cancelling picks none of them.
 */
export function ChoiceDialog({
  open,
  title,
  description,
  choices,
  cancelLabel = "Cancelar",
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  choices: IDialogChoice[]
  cancelLabel?: string
  onCancel: () => void
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      {/* A margin on a phone, where the full width touched the screen edges. */}
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : (
            // Radix warns without a description; an empty one says nothing.
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </DialogHeader>
        <div className="grid gap-2">
          {choices.map((choice) => (
            <button
              key={choice.label}
              type="button"
              aria-label={choice.label}
              onClick={choice.onSelect}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {choice.icon && <span className="mt-0.5 shrink-0 text-primary">{choice.icon}</span>}
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{choice.label}</span>
                <span className="block text-xs text-muted-foreground">{choice.description}</span>
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <DialogPrimitive.Close asChild>
            <button type="button" className={buttonVariants({ variant: "outline" })}>
              {cancelLabel}
            </button>
          </DialogPrimitive.Close>
        </DialogFooter>
      </DialogContent>
    </DialogPrimitive.Root>
  )
}
