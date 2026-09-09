import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

export default function AdminPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Add auth check before fetching
    async function fetchData() {
      try {
        const res = await apiClient.get("/api/admin/teams");
        setTeams(res.data?.teams || []);
        setTranscripts(res.data?.transcripts || []);
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>
        {teams.length === 0 && <p className="text-gray-600 mb-4">No teams found</p>}
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="p-4 rounded border bg-gray-50">
              <h3 className="font-medium text-gray-700">{team.name}</h3>
              <p className="text-sm text-gray-500">Progress: {team.progress || 0}%</p>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-semibold text-gray-700 mt-6">Transcripts</h3>
          {transcripts.map((t) => (
            <div key={t.id} className="p-3 mb-2 rounded bg-gray-100 text-sm">
              <strong>{t.teamName}:</strong> {t.excerpt || "No transcript"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}