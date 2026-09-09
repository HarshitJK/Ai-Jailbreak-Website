const apiClient = {
  async get(endpoint: string) {
    const res = await fetch(`${import.meta.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
  async post(endpoint: string, body: any) {
    const res = await fetch(`${import.meta.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
};

export default apiClient;