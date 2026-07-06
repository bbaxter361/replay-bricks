export default function StatusPill({ children, tone = 'purple' }) {
  const tones = {
    purple: 'bg-[#efe4ff] text-[#4d3195] border-[#ded0f2]',
    green: 'bg-[#e4f5f2] text-[#2e6f68] border-[#bfe0da]',
    gold: 'bg-[#fff2d9] text-[#8a5a12] border-[#f6d49a]',
    gray: 'bg-white text-[#74638d] border-[#ded0f2]',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}
