import { useState, useEffect, useCallback } from "react";
import { fetchPrioritizedNeeds, fetchNeeds, updateNeedStatus as apiUpdateStatus, createNeed as apiCreateNeed, deleteNeed as apiDelete } from "../utils/api";

export function useNeeds(filters = {}) {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPrioritizedNeeds();
      let data = res.data.data || [];
      if (filters.category) data = data.filter((n) => n.category === filters.category);
      if (filters.urgency) data = data.filter((n) => n.urgency === filters.urgency);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        data = data.filter((n) => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
      }
      setNeeds(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.urgency, filters.search]);

  useEffect(() => { load(); }, [load]);

  const addNeed = async (data) => {
    const res = await apiCreateNeed(data);
    await load();
    return res.data.data;
  };

  const updateStatus = async (id, status) => {
    await apiUpdateStatus(id, status);
    setNeeds((prev) => prev.map((n) => n.id === id ? { ...n, status } : n));
  };

  const removeNeed = async (id) => {
    await apiDelete(id);
    setNeeds((prev) => prev.filter((n) => n.id !== id));
  };

  return { needs, loading, error, reload: load, addNeed, updateStatus, removeNeed };
}
