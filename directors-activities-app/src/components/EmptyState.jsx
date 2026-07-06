export default function EmptyState({ title, children }) {
  return (
    <div className="rounded-lg border border-dashed border-[#ded0f2] bg-white/60 p-5 text-center">
      <p className="font-bold text-[#25183f]">{title}</p>
      {children && <p className="mt-1 text-sm text-[#74638d]">{children}</p>}
    </div>
  );
}
