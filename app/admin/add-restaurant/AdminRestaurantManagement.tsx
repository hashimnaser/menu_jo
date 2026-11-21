"use client";

import { useState } from "react";
import AdminRestaurantList from "./AdminRestaurantList";
import RestaurantEditor from "./RestaurantEditor";

type RestaurantSummary = {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
};

export default function AdminRestaurantManagement() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSummary | null>(null);
  const [listVersion, setListVersion] = useState(0);

  function finishEditing() {
    setSelectedRestaurant(null);
    setListVersion((version) => version + 1);
  }

  return (
    <>
      <AdminRestaurantList key={listVersion} onEdit={setSelectedRestaurant} />
      {selectedRestaurant && (
        <RestaurantEditor
          key={selectedRestaurant.id}
          restaurantId={selectedRestaurant.id}
          onCancel={() => setSelectedRestaurant(null)}
          onSaved={finishEditing}
        />
      )}
    </>
  );
}
