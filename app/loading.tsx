export default function Loading() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[var(--app-bg)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}
