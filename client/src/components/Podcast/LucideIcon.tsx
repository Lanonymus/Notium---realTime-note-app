import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function LucideIcon({ name, ...props }: DynamicIconProps) {
  // Pobieramy komponent z paczki Lucide. Jeśli AI poda nieznaną nazwę, używamy domyślnej ikony HelpCircle.
  const IconComponent =
    ((Icons as unknown) as Record<string, React.ComponentType<LucideProps>>)[name] ||
    Icons.HelpCircle;

  return <IconComponent {...props} />;
}