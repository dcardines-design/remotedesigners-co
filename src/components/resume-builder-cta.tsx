import Link from 'next/link'

export function ResumeBuilderCTA({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/resume-builder"
      onClick={onClick}
      className="block border border-neutral-200 rounded-xl px-5 py-7 hover:border-neutral-300 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all duration-200 relative overflow-hidden group"
      style={{ background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 40%, #fafbff 70%, #faf9ff 100%)' }}
    >
      <div className="absolute -bottom-6 left-0 right-0 h-12 opacity-[0.07] group-hover:opacity-[0.18] blur-2xl rounded-full pointer-events-none transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #0D9488 0%, #2563EB 35%, #7C3AED 65%, #EC4899 100%)' }} />
      <div className="flex items-center gap-4 pl-3 relative">
        <div className="w-12 h-[64px] bg-white rounded-md border border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.06)] p-2 shrink-0 flex flex-col gap-[4px] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)]">
          <div className="w-4 h-[2.5px] bg-neutral-400 mx-auto rounded-full" />
          <div className="w-full h-[1.5px] bg-neutral-200" />
          <div className="w-full h-[2px] bg-neutral-300 rounded-full" />
          <div className="w-3/4 h-[2px] bg-neutral-200 rounded-full" />
          <div className="w-full h-[1.5px] bg-neutral-200" />
          <div className="w-full h-[2px] bg-neutral-300 rounded-full" />
          <div className="w-1/2 h-[2px] bg-neutral-200 rounded-full" />
        </div>
        <div className="min-w-0">
          <span className="block text-[10px] text-neutral-400 uppercase tracking-widest mb-1">Free Resume Builder</span>
          <p className="text-base font-semibold text-neutral-900">Land more interviews</p>
          <p className="text-xs text-neutral-500 mt-1.5">Build an ATS-optimized resume in minutes.</p>
        </div>
        <svg className="w-4 h-4 text-neutral-400 shrink-0 ml-auto transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </div>
    </Link>
  )
}
