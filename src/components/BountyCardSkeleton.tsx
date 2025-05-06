// components/BountyCardSkeleton.tsx
export function BountyCardSkeleton() {
    return (
        <div className="card animate-pulse space-y-4">
            <div className="flex justify-between items-center">
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
                <div className="h-6 w-24 bg-gray-200 rounded-full" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="flex gap-2 mt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-5 w-16 bg-gray-200 rounded-full" />
                ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
        </div>
    );
}
