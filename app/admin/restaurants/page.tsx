import AdminGate from "../AdminGate";
import AdminRestaurantManagement from "../add-restaurant/AdminRestaurantManagement";

export const metadata = { title: "إدارة المطاعم | MenU" };

export default function AdminRestaurantsPage() {
  return (
    <AdminGate>
      <AdminRestaurantManagement />
    </AdminGate>
  );
}
