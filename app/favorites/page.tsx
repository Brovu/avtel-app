import { HotelWithRooms } from "@/components/hotel/AddHotelForm";
import HotelList from "@/components/hotel/HotelList";
import { auth } from "@clerk/nextjs/server";

interface HotelWithFavorites extends HotelWithRooms {
  avgRating?: string | null;
  isFavorited?: boolean;
}

const FavoritesPage = async () => {
  // Lấy session token từ auth()
  const { getToken } = auth();
  const sessionToken = await getToken();

  if (!sessionToken) {
    console.error("No session token found in FavoritesPage");
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Khách sạn yêu thích</h1>
        <p className="text-gray-500">
          Bạn cần đăng nhập để xem danh sách yêu thích.
        </p>
      </div>
    );
  }

  // Sử dụng base URL đầy đủ
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/favorites`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // Gửi session token thủ công qua header Authorization
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Error fetching favorites:", response.status, errorData);
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Khách sạn yêu thích</h1>
        <p className="text-gray-500">
          Đã có lỗi xảy ra khi tải danh sách yêu thích: {errorData}
        </p>
      </div>
    );
  }

  const hotels: HotelWithFavorites[] = await response.json();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Khách sạn yêu thích</h1>
      {hotels.length > 0 ? (
        <HotelList hotels={hotels} />
      ) : (
        <p className="text-gray-500">
          Bạn chưa có khách sạn nào trong danh sách yêu thích.
        </p>
      )}
    </div>
  );
};

export default FavoritesPage;
