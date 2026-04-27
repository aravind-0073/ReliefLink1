import { useState, useEffect, useCallback } from "react";
import { fetchVolunteers, createVolunteer as apiCreate, updateVolunteer as apiUpdate, deleteVolunteer as apiDelete } from "../utils/api";

export function useVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchVolunteers();
      setVolunteers(res.data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addVolunteer = async (data) => {
    const res = await apiCreate(data);
    await load();
    return res.data.data;
  };

  const update = async (id, data) => {
    await apiUpdate(id, data);
    await load();
  };

  const remove = async (id) => {
    await apiDelete(id);
    setVolunteers((prev) => prev.filter((v) => v.id !== id));
  };

  return { volunteers, loading, error, reload: load, addVolunteer, update, remove };
}
