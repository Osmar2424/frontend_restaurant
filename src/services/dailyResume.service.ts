import api from "../api/axios";
import type { DailyResume } from "../types";

export async function getDailyResume(): Promise<DailyResume[]> {
  const response = await api.get<DailyResume[]>('/daily-resume');
  const sortedData = (response.data || []).sort((a: DailyResume, b: DailyResume) =>
    new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  return sortedData;
}
