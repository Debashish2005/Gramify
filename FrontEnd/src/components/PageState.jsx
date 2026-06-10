export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="surface flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#e23d58]/10 text-[#e23d58]">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h2 className="text-base font-bold">{title}</h2>
      {description && <p className="subtle-text mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="surface p-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-32" />
              <div className="skeleton h-3 w-20" />
            </div>
          </div>
          <div className="skeleton mt-4 aspect-[16/9] w-full" />
        </div>
      ))}
    </div>
  );
}
