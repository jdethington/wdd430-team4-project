export default function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#2c2c2c] border border-[#f5c518]/10 rounded-md p-5 animate-pulse"
        >
          <div className="w-full aspect-[2/3] max-h-48 bg-[#1a1a1a] rounded-md mb-3" />
          <div className="h-5 bg-[#1a1a1a] rounded w-3/4 mb-2" />
          <div className="h-3 bg-[#1a1a1a] rounded w-1/3 mb-3" />
          <div className="h-8 bg-[#1a1a1a] rounded w-full mt-4" />
        </div>
      ))}
    </div>
  );
}
