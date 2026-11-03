import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const bigPrimary = cn(buttonVariants(), "h-12 w-full px-4 text-base font-semibold");
export const bigOutline = cn(
  buttonVariants({ variant: "outline" }),
  "h-12 w-full bg-card px-4 text-base font-semibold",
);
export const bigGhost = cn(
  buttonVariants({ variant: "ghost" }),
  "h-12 w-full px-4 text-base font-semibold",
);
export const fieldClass = "h-12 bg-card px-3.5 text-base md:text-base";
