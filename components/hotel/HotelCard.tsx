"use client";

import { usePathname, useRouter } from "next/navigation";
import { HotelWithRooms } from "./AddHotelForm";
import { cn } from "@/lib/utils";
import Image from "next/image";
import AmenityItem from "../AmenityItem";
import { Dumbbell, MapPin, Waves, Heart } from "lucide-react";
import useLocation from "@/hooks/useLocation";
import { Button } from "../ui/button";
import { useState } from "react";
import { toast } from "sonner";

const convertVNDtoUSD = (vndAmount: number) => {
  const exchangeRate = 0.0000417;
  return (vndAmount * exchangeRate).toFixed(2);
};

const calculateRatingStats = (reviews: { rating: number }[]) => {
  if (!reviews || reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = (totalRating / reviews.length).toFixed(1);
  const totalReviews = reviews.length;

  return { averageRating: parseFloat(averageRating), totalReviews };
};

const HotelCard = ({
  hotel,
}: {
  hotel: HotelWithRooms & { isFavorited: boolean };
}) => {
  const pathname = usePathname();
  const isMyHotels = pathname.includes("my-hotels");
  const router = useRouter();
  const { getCountryByCode } = useLocation();
  const country = getCountryByCode(hotel.country);

  const [isFavorited, setIsFavorited] = useState(hotel.isFavorited);

  const handleFavoriteClick = async () => {
    try {
      const response = await fetch("/api/favorite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hotelId: hotel.id }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsFavorited(data.isFavorited);
        toast.success(
          data.isFavorited
            ? "Đã thêm vào danh sách yêu thích"
            : "Đã xóa khỏi danh sách yêu thích"
        );
      } else {
        throw new Error(data.message || "Something went wrong");
      }
    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const formattedPrice = hotel?.rooms[0]?.roomPrice
    ? hotel.rooms[0].roomPrice.toLocaleString("vi-VN", { currency: "VND" })
    : "0";

  const { averageRating, totalReviews } = calculateRatingStats(hotel.reviews);

  return (
    <div
      onClick={() => !isMyHotels && router.push(`/hotel-details/${hotel.id}`)}
      className={cn(
        "col-span-1 cursor-pointer transition hover:scale-105",
        isMyHotels && "cursor-default"
      )}
    >
      <div className="relative flex gap-2 bg-background/50 border border-primary/10 rounded-lg">
        {/* Icon trái tim */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Ngăn sự kiện click lan ra thẻ cha
            handleFavoriteClick();
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white"
        >
          <Heart
            className={cn(
              "w-5 h-5",
              isFavorited ? "fill-red-500 text-red-500" : "text-gray-500"
            )}
          />
        </button>

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

            <div className="mt-2 flex items-center gap-1">
              {averageRating > 0 ? (
                <>
                  <span className="font-semibold text-[13px]">
                    {averageRating}
                  </span>
                  <span className="text-yellow-500">
                    {"★".repeat(Math.round(averageRating))}
                  </span>
                  <span className="text-gray-500 text-[12px]">
                    ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                  </span>
                </>
              ) : (
                <span className="text-gray-500 text-[12px]">
                  Chưa có đánh giá
                </span>
              )}
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                {hotel?.rooms[0]?.roomPrice && (
                  <>
                    <div className="font-semibold text-base">
                      ${convertVNDtoUSD(hotel.rooms[0].roomPrice)}
                      <span className="text-xs font-normal ml-1">/ 24hrs</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formattedPrice} VND
                    </div>
                  </>
                )}
              </div>

              {isMyHotels && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/hotel/${hotel.id}`);
                  }}
                  variant="outline"
                  size="sm"
                  className="ml-4 self-end cursor-pointer"
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
