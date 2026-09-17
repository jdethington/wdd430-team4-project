import Button from '@/components/ui/Button';

export default function Signup() {
  

  return (
    <main className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Subtle Decorative Geometric Divider */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-[1px] w-12 bg-[#f5c518]" />
          <span className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold">
            Create an Account
          </span>
          <div className="h-[1px] w-12 bg-[#f5c518]" />
        </div>
      </section>
    </main>
  );
}