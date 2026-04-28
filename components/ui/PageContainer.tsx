interface PageContainerProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "7xl";
}

const maxWidthClasses = {
  sm: "max-w-4xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-6xl",
  "7xl": "max-w-7xl",
};

export function PageContainer({
  children,
  title,
  subtitle,
  actions,
  maxWidth = "7xl",
}: PageContainerProps) {
  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto p-4 md:p-6 space-y-4 md:space-y-6`}>
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
        <div className="pt-1">
          <h1 className="text-xl md:text-2xl font-black text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 font-medium mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      {children}
    </div>
  );
}