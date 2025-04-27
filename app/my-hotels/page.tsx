import { getHotelsByUserId } from "@/actions/getHotelsByUserId";
import HotelList from "@/components/hotel/HotelList";

const MyHotels = async () => {
  const hotels = await getHotelsByUserId();

  if (!hotels) return <div>Không tìm thấy khách sạn!</div>;
  return (
    <div>
      <h2 className="text-2xl font-semibold my-4 mb-4">
        Khách sạn của bạn ở đây!
      </h2>
      <HotelList hotels={hotels} />
    </div>
  );
};

export default MyHotels;
