import api from "../api/axios";
import type { Dish } from "../types";

export async function getDishes(): Promise<Dish[]> {
  const response = await api.get<Dish[]>('/dish');
  return response.data;
};

export async function deleteDish(idDish: number) {
  const response = await api.delete(`/dish/${idDish}`);
  return response.data;
};

export async function editDish(
  idDish: number,
  name: string,
  price: number,
  description: string
): Promise<Dish> {
  const response = await api.patch(`/dish/${idDish}`, {
    name,
    price,
    description
  });
  return response.data;
}

export async function availableDish(idDish: number, availability: boolean): Promise<Dish> {
  const response = await api.patch(`/dish/${idDish}`, {
    availability
  });

  return response.data;
}

export async function saveDish(
  name: string,
  price: number,
  description: string
): Promise<Dish> {
  const response = await api.post<Dish>('/dish', {
    name,
    price,
    description
  });
  return response.data;
};
