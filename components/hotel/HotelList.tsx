import { HotelWithRooms } from "./AddHotelForm";
import HotelCard from "./HotelCard";

interface HotelListProps {
  hotels: HotelWithRooms & { avgRating?: string | null }[];
}

const HotelList = ({ hotels }: HotelListProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mt-4">
      {hotels.map((hotel) => (
        <div key={hotel.id}>
          <HotelCard
            hotel={hotel}
            rating={hotel.avgRating}
            reviewCount={hotel.reviews?.length || 0}
          />
        </div>
      ))}
    </div>
  );
};

export default HotelList;
