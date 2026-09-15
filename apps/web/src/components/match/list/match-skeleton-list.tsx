import { memo } from "react";

import { cn } from "@/lib/utils";

import MatchCardSkeleton from "./match-card-skeleton";

const SKELETON_INDICES = Array.from({ length: 6 }, (_, i) => i);

interface Props {
  className?: string;
}

const MatchSkeletonList = memo(function MatchSkeletonList({
  className,
}: Readonly<Props>) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4", className)}>
      {SKELETON_INDICES.map((i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
});

export default MatchSkeletonList;
