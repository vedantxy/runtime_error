import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const ChatSkeleton: React.FC = () => (
  <div className="flex flex-col gap-5 p-4 w-full" role="status" aria-label="Loading conversation">
    {/* Assistant skeleton */}
    <div className="flex gap-2 items-start max-w-[88%]">
      <Skeleton className="w-6 h-6 rounded-lg flex-shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <Skeleton className="h-2.5 w-14 rounded-full" />
        <Skeleton className="h-20 w-full rounded-2xl rounded-tl-none" />
        <Skeleton className="h-2.5 w-8 rounded-full" />
      </div>
    </div>

    {/* User skeleton */}
    <div className="flex flex-col items-end gap-1.5 max-w-[70%] ml-auto">
      <Skeleton className="h-2.5 w-10 rounded-full" />
      <Skeleton className="h-10 w-full rounded-2xl rounded-tr-none" />
    </div>

    {/* Another assistant skeleton */}
    <div className="flex gap-2 items-start max-w-[88%]">
      <Skeleton className="w-6 h-6 rounded-lg flex-shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <Skeleton className="h-2.5 w-14 rounded-full" />
        <Skeleton className="h-14 w-full rounded-2xl rounded-tl-none" />
        <Skeleton className="h-2.5 w-8 rounded-full" />
      </div>
    </div>

    <div className="flex items-center justify-center mt-2 gap-2">
      <div
        className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  </div>
);
