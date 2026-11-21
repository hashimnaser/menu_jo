import AdminGate from "../AdminGate";
import RestaurantEditor from "./RestaurantEditor";

export const metadata = { title: "لوحة الإدارة | MenU" };

export default function AddRestaurantPage() {
  return (
    <AdminGate>
      <RestaurantEditor />
    </AdminGate>
  );
}
