import { getHotelById } from "@/actions/getHotelById";
import AddHotelForm from "@/components/hotel/AddHotelForm";
import { auth } from "@clerk/nextjs";

// Định nghĩa type cho params
interface HotelPageProps {
  params: { hotelId: string }; // ✅ Không cần Promise
}

const Hotel = async ({ params }: HotelPageProps) => {
  const hotelId = params.hotelId;
  const hotel = await getHotelById(hotelId);
  const { userId } = auth();

  if (!userId) return <div>Chưa đăng nhập...</div>;
  if (hotel && hotel.userId !== userId)
    return <div>Không có quyền truy cập...</div>;

  return (
    <div>
      <AddHotelForm hotel={hotel} />
    </div>
  );
};

export default Hotel;
