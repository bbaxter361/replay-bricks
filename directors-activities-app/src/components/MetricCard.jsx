import { Link } from 'react-router-dom';

export default function MetricCard({ icon: Icon, label, value, detail, to }) {
  const CardTag = to ? Link : 'div';

  return (
    <CardTag className={`app-card block p-4 ${to ? 'hover:border-[#6d4cc2] focus:outline-none focus:ring-4 focus:ring-[#6d4cc2]/20' : ''}`} to={to}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efe4ff] text-[#6d4cc2]">
            <Icon size={20} />
          </div>
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a6fc4]">{label}</p>
          <p className="text-2xl font-black text-[#25183f]">{value}</p>
        </div>
      </div>
      {detail && <p className="mt-3 text-sm text-[#74638d]">{detail}</p>}
    </CardTag>
  );
}
