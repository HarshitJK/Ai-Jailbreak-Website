import { useState } from "react";

export default function LoginPage() {
  const [teamId, setTeamId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId.trim()) return;
    localStorage.setItem("teamId", teamId);
    // TODO: Add actual login logic / redirect
    window.location.href = "/round1";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Jailbreak Competition</h2>
        <p className="text-gray-600 mb-8">Enter your team ID to begin</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team ID</label>
            <input
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Competition
          </button>
        </form>
      </div>
    </div>
  );
}