"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileHeaderMenuProps {
  children: React.ReactNode
}

export function MobileHeaderMenu({ children }: MobileHeaderMenuProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  if (!isMobile) return <>{children}</>

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-3 mt-6 [&_button]:min-h-[44px] [&_button]:min-w-[44px]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
