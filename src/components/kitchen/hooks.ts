import { useState } from "react";
import type { Order } from "../../types";

export const useKitchenState = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  return {
    activeTab,
    setActiveTab,
    selectedOrderDetails,
    setSelectedOrderDetails
  };
};
// export const useActiveTab = () => {
//   const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
//   return {
//     activeTab;
//   }
// }
//
// export const useSelectedOrderDetails = () => {
//
// }
