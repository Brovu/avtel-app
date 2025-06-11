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
        "col-span-1 cursor-pointer transition hover:scale-105 rounded-lg overflow-hidden border border-primary/10",
        isMyHotels && "cursor-default"
      )}
    >
      <div className="relative flex flex-col h-[320px] bg-background/50">
        {/* Icon trái tim */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFavoriteClick();
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white z-10"
        >
          <Heart
            className={cn(
              "w-5 h-5",
              isFavorited ? "fill-red-500 text-red-500" : "text-gray-500"
            )}
          />
        </button>

        {/* Hình ảnh */}
        <div className="relative w-full h-[180px] overflow-hidden">
          <Image
            fill
            src={hotel.image}
            alt={hotel.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Nội dung */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-[14px] line-clamp-1">
              {hotel.title}
            </h3>
            <p className="text-primary/90 text-[12px] line-clamp-1">
              {hotel.description.substring(0, 45)}...
            </p>
            <div className="text-primary/90 mt-1 flex flex-wrap gap-1">
              <AmenityItem>
                <MapPin className="w-4 h-4" />
                <span className="text-[11px]">
                  {country?.name} / {hotel.city}
                </span>
              </AmenityItem>
              {hotel.swimmingPool && (
                <AmenityItem>
                  <Waves className="w-4 h-4" />
                  <span className="text-[11px]">Pool</span>
                </AmenityItem>
              )}
              {hotel.gym && (
                <AmenityItem>
                  <Dumbbell className="w-4 h-4" />
                  <span className="text-[11px]">Gym</span>
                </AmenityItem>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1">
              {averageRating > 0 ? (
                <>
                  <span className="font-semibold text-[12px]">
                    {averageRating}
                  </span>
                  <span className="text-yellow-500">
                    {"★".repeat(Math.round(averageRating))}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                  </span>
                </>
              ) : (
                <span className="text-gray-500 text-[11px]">
                  Chưa có đánh giá
                </span>
              )}
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div className="flex flex-col">
              {hotel?.rooms[0]?.roomPrice && (
                <>
                  <div className="font-semibold text-[14px]">
                    ${convertVNDtoUSD(hotel.rooms[0].roomPrice)}
                    <span className="text-[10px] font-normal ml-1">
                      / 24hrs
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
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
                className="ml-2 self-end cursor-pointer text-[12px] py-1 px-2"
              >
                Sửa
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
