import { getHotels } from "@/actions/getHotels";
import HotelList from "@/components/hotel/HotelList";
import { HotelWithRooms } from "@/components/hotel/AddHotelForm"; // Import type từ AddHotelForm

interface HomeProps {
  searchParams: {
    title: string;
    country: string;
    state: string;
    city: string;
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const hotels = (await getHotels(searchParams)) as HotelWithRooms[]; // Thêm type assertion

  if (!hotels || hotels.length === 0) {
    return <div>Không tìm thấy Khách Sạn bạn cần...</div>;
  }

  return (
    <div>
      <HotelList hotels={hotels} />
    </div>
  );
}
