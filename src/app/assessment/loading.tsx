export default function AssessmentLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-md bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-300" />
          <div className="h-3 w-3 rounded-full bg-gray-200" />
          <div className="h-3 w-3 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="mx-auto h-10 w-72 rounded-md bg-gray-200" />

      {/* Identity card skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="h-5 w-32 rounded bg-gray-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>

      {/* Role cards skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="h-5 w-5 rounded bg-gray-200" />
              <div className="h-5 w-36 rounded bg-gray-200" />
            </div>
            <div className="mb-4 space-y-2">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-4/5 rounded bg-gray-100" />
              <div className="h-3 w-3/5 rounded bg-gray-100" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
