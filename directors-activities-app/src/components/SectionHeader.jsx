export default function SectionHeader({ eyebrow, title, children, actions }) {
  return (
    <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6d4cc2] md:text-base">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-black text-[#25183f] md:text-3xl">{title}</h1>
        {children && <p className="mt-2 max-w-3xl text-sm leading-6 text-[#74638d]">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
