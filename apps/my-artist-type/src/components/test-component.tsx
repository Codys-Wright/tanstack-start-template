export function TestComponent() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h1 className="text-2xl font-bold text-blue-900">Test Component</h1>
      <p className="text-blue-700">This is a test component to verify live updates work.</p>
      <p className="text-sm text-blue-600 mt-2">
        If you see this, the app is running correctly! 🔥 LIVE UPDATE TEST
      </p>
    </div>
  );
}