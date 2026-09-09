import { useState } from "react";
import apiClient from "@/lib/apiClient";

interface ChatWindowProps {
  teamId: string;
  round: number;
  stage: number;
}

export function ChatWindow({ teamId, round, stage }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setMessages((prev) => [...prev, message]);
    setMessage("");
    setLoading(true);
    try {
      const res = await apiClient.post("/api/chat", {
        team_id: teamId,
        round,
        stage,
        message,
      });
      // TODO: Handle backend response
      setMessages((prev) => [...prev, res.data?.response || ""]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="h-64 overflow-y-auto border rounded-md border-gray-200 p-4">
        {messages.map((msg, i) => (
          <div key={i} className="p-2 mb-2 rounded bg-gray-100">
            {msg}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={sendMessage} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}