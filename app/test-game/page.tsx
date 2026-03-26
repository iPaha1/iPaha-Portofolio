// app/test-game/page.tsx
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { GameDebugButton } from "@/components/(gamification)/game-debug-button";

export default function TestGamePage() {
  const { user, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerGame = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log("🎮 Manually triggering game...");
      const response = await fetch("/api/game/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      console.log("🎮 Game trigger response:", data);
      
      if (response.ok && data.game) {
        setResult(data.game);
        // Dispatch a custom event that the GameProvider listens for
        window.dispatchEvent(new CustomEvent("game-requested", { detail: data.game }));
      } else {
        setError(data.error || "No game available");
      }
    } catch (err) {
      console.error("Error triggering game:", err);
      setError("Failed to trigger game");
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Test Game Page</h1>
        <p className="text-red-500">Please sign in to test games</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Game System Test</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <p className="font-semibold">Current User:</p>
        <p>{user?.emailAddresses[0]?.emailAddress}</p>
        <p className="text-sm text-gray-600 mt-1">User ID: {user?.id}</p>
      </div>
      
      <button
        onClick={triggerGame}
        disabled={loading}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Triggering..." : "🎮 Trigger Game"}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-lg">
          <strong className="text-green-700">Game Triggered!</strong>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          <p className="text-sm text-green-600 mt-2">
            A floating game window should appear. If not, check the browser console for errors.
          </p>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Instructions:</h3>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li>Open browser console (F12)</li>
          <li>Look for logs starting with "🎮"</li>
          <li>Check for any red error messages</li>
          <li>Verify GameProvider is mounted (check React DevTools)</li>
        </ol>
      </div>
      {/* ADD TEST BUTTONS HERE */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">Additional Tests:</h3>
        <p className="text-sm text-blue-600">You can add more buttons here to test specific game scenarios, like forcing a win, testing rewards, etc.</p>
        <GameDebugButton />
      </div>
    </div>
  );
}