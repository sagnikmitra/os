import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: Props) {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className={cn("page-enter", className)}>
      {children}
    </div>
  );
}
