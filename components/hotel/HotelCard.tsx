"use client";

import { usePathname, useRouter } from "next/navigation";
import { HotelWithRooms } from "./AddHotelForm";
import { cn } from "@/lib/utils";
import Image from "next/image";
import AmenityItem from "../AmenityItem";
import { Dumbbell, MapPin, Waves } from "lucide-react";
import useLocation from "@/hooks/useLocation";
import { Button } from "../ui/button";

// Hàm chuyển đổi VND sang USD (tỷ giá có thể cập nhật từ API)
const convertVNDtoUSD = (vndAmount: number) => {
  const exchangeRate = 0.0000417; // 1 VND ≈ 0.0000417 USD
  return (vndAmount * exchangeRate).toFixed(2); // Làm tròn 2 số thập phân
};

const HotelCard = ({ hotel }: { hotel: HotelWithRooms }) => {
  const pathname = usePathname();
  const isMyHotels = pathname.includes("my-hotels");
  const router = useRouter();
  const { getCountryByCode } = useLocation();
  const country = getCountryByCode(hotel.country);

  return (
    <div
      onClick={() => !isMyHotels && router.push(`/hotel-details/${hotel.id}`)}
      className={cn(
        "col-span-1 cursor-pointer transition hover:scale-105",
        isMyHotels && "cursor-default"
      )}
    >
      <div className="flex gap-2 bg-background/50 border border-primary/10 rounded-lg">
        <div className="flex-1 aspect-square overflow-hidden relative w-full h-[210px] rounded-s-lg">
          <Image
            fill
            src={hotel.image}
            alt={hotel.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 flex flex-col justify-between h-[210px] gap-1 px-4 py-4 text-sm">
          <h3 className="font-semibold text-[15px]">{hotel.title}</h3>
          <div className="text-primary/90 text-[13px]">
            {hotel.description.substring(0, 45)}...
          </div>
          <div className="text-primary/90">
            <AmenityItem>
              <MapPin className="w-4 h-4" />{" "}
              <span className="text-[12px]">
                {country?.name} / {hotel.city}
              </span>
            </AmenityItem>
            {hotel.swimmingPool && (
              <AmenityItem>
                <Waves className="w-4 h-4" />{" "}
                <span className="text-[12px]">Pool</span>
              </AmenityItem>
            )}
            {hotel.gym && (
              <AmenityItem>
                <Dumbbell className="w-4 h-4" />{" "}
                <span className="text-[12px]">Gym</span>
              </AmenityItem>
            )}

            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                {hotel?.rooms[0]?.roomPrice && (
                  <>
                    <div className="font-semibold text-base">
                      ${convertVNDtoUSD(hotel?.rooms[0].roomPrice)}
                      <span className="text-xs font-normal ml-1">/ 24hrs</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {hotel?.rooms[0].roomPrice.toLocaleString()} VND
                    </div>
                  </>
                )}
              </div>

              {isMyHotels && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn sự kiện click lan ra thẻ cha
                    router.push(`/hotel/${hotel.id}`);
                  }}
                  variant="outline"
                  size="sm"
                  className="ml-4 self-end cursor-pointer" // Thêm margin left và căn dưới
                >
                  Sửa
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
