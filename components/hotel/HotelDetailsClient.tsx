import Image from "next/image";
import AmenityItem from "../AmenityItem";
import {
  Bike,
  Car,
  Coffee,
  Dumbbell,
  Film,
  MapPin,
  ParkingCircle,
  Shirt,
  ShoppingBag,
  Sparkles,
  Utensils,
  Waves,
  Wifi,
  Wine,
} from "lucide-react";
import { HotelWithRooms } from "./AddHotelForm";
import { Booking } from "@prisma/client";
import useLocation from "@/hooks/useLocation";
import RoomCard from "../room/RoomCard";

const HotelDetailsClient = ({
  hotel,
  bookings,
}: {
  hotel: HotelWithRooms;
  bookings?: Booking[];
}) => {
  if (!hotel) {
    return (
      <div className="text-center py-8">Không tìm thấy thông tin khách sạn</div>
    );
  }

  const { getCountryByCode, getStateByCode } = useLocation();
  const country = getCountryByCode(hotel.country);
  const state = getStateByCode(hotel.country, hotel.state);

  return (
    <div className="flex flex-col gap-6 pb-2">
      <div className="aspect-square overflow-hidden relative w-full h-[200px] md:h-[400px] rounded-lg">
        <Image
          fill
          src={hotel.image}
          alt={hotel.title}
          className="object-cover"
        />
      </div>
      <div>
        <h3 className="font-semibold text-xl md:text-3xl">{hotel.title}</h3>
        <div className="font-semibold mt-4">
          <AmenityItem>
            <MapPin className="h-4 w-4" /> {country?.name}, {state?.name},{" "}
            {hotel.city}
          </AmenityItem>
        </div>
        <h3 className="font-semibold text-lg mt-4 mb-2">Mô tả vị trí</h3>
        <p className="text-primary/90 mb-2">{hotel.locationDescription}</p>
        <h3 className="font-semibold text-lg mt-4 mb-2">Về khách sạn</h3>
        <p className="text-primary/90 mb-2">{hotel.description}</p>
        <h3 className="font-semibold text-lg mt-4 mb-2">Dịch vụ phổ biến</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 content-start text-sm">
          {hotel.swimmingPool && (
            <AmenityItem>
              <Waves className="w-4 h-4" />
              Pool
            </AmenityItem>
          )}
          {hotel.gym && (
            <AmenityItem>
              <Dumbbell className="w-4 h-4" />
              Gym
            </AmenityItem>
          )}
          {hotel.spa && (
            <AmenityItem>
              <Sparkles className="w-4 h-4" />
              Spa
            </AmenityItem>
          )}
          {hotel.bar && (
            <AmenityItem>
              <Wine className="w-4 h-4" />
              Bar
            </AmenityItem>
          )}
          {hotel.laundry && (
            <AmenityItem>
              <Shirt className="w-4 h-4" />
              Laundry
            </AmenityItem>
          )}
          {hotel.restaurant && (
            <AmenityItem>
              <Utensils className="w-4 h-4" />
              Restaurant
            </AmenityItem>
          )}
          {hotel.shopping && (
            <AmenityItem>
              <ShoppingBag className="w-4 h-4" />
              Shopping
            </AmenityItem>
          )}
          {hotel.freeParking && (
            <AmenityItem>
              <Car className="w-4 h-4" />
              Free Parking
            </AmenityItem>
          )}
          {hotel.bikeRental && (
            <AmenityItem>
              <Bike className="w-4 h-4" />
              Bike Rental
            </AmenityItem>
          )}
          {hotel.freeWifi && (
            <AmenityItem>
              <Wifi className="w-4 h-4" />
              Free Wifi
            </AmenityItem>
          )}
          {hotel.movieNights && (
            <AmenityItem>
              <Film className="w-4 h-4" />
              Movie Nights
            </AmenityItem>
          )}
          {hotel.coffeShop && (
            <AmenityItem>
              <Coffee className="w-4 h-4" />
              Coffee Shop
            </AmenityItem>
          )}
        </div>
      </div>
      {hotel?.rooms && hotel.rooms.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold my-4">Hotel Rooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {hotel.rooms.map((room) => {
              if (!room) return null; // Bỏ qua nếu room null/undefined
              return (
                <RoomCard
                  hotel={hotel}
                  room={room}
                  key={room.id}
                  bookings={bookings}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          Khách sạn hiện chưa có phòng nào
        </div>
      )}
    </div>
  );
};

export default HotelDetailsClient;
