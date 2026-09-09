import { useState } from "react";
import apiClient from "@/lib/apiClient";

export default function Round2Page() {
  const [teamId, setTeamId] = useState(() => {
    const stored = localStorage.getItem("teamId");
    return stored || "";
  });
  const [stage, setStage] = useState(1);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, input]);
    setInput("");
    try {
      const res = await apiClient.post("/api/chat", {
        team_id: teamId,
        round: 2,
        stage,
        message: input,
      });
      // TODO: Handle chained bot response
      setMessages((prev) => [...prev, res.data?.response || ""]);
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Round 2 - Stage {stage}</h2>
          <button
            onClick={() => setStage((s) => s + 1 > 5 ? 1 : s + 1)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Next Stage
          </button>
        </div>
        <div className="h-96 overflow-y-auto mb-6 border rounded-md border-gray-200">
          {messages.map((msg, i) => (
            <div key={i} className="p-3 mb-2 rounded bg-gray-100">
              {msg}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Send message..."
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}