"use client";

import Image from "next/image";
import AmenityItem from "../AmenityItem";
import {
  Bike,
  Car,
  Coffee,
  Dumbbell,
  Film,
  MapPin,
  Shirt,
  ShoppingBag,
  Sparkles,
  Utensils,
  Waves,
  Wifi,
  Wine,
  Heart, // Thêm Heart icon
} from "lucide-react";
import { HotelWithRooms } from "./AddHotelForm";
import { Booking, Review } from "@prisma/client";
import useLocation from "@/hooks/useLocation";
import RoomCard from "../room/RoomCard";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner"; // Thêm toast
import { cn } from "@/lib/utils"; // Thêm cn để xử lý className

// Dynamic imports for map components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center bg-gray-100">
        Loading map...
      </div>
    ),
  }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  {
    ssr: false,
    loading: () => <div className="w-6 h-6 bg-blue-500 rounded-full"></div>,
  }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

// Amenities list
const amenities = [
  { key: "swimmingPool", label: "Pool", icon: <Waves className="w-4 h-4" /> },
  { key: "gym", label: "Gym", icon: <Dumbbell className="w-4 h-4" /> },
  { key: "spa", label: "Spa", icon: <Sparkles className="w-4 h-4" /> },
  { key: "bar", label: "Bar", icon: <Wine className="w-4 h-4" /> },
  { key: "laundry", label: "Laundry", icon: <Shirt className="w-4 h-4" /> },
  {
    key: "restaurant",
    label: "Restaurant",
    icon: <Utensils className="w-4 h-4" />,
  },
  {
    key: "shopping",
    label: "Shopping",
    icon: <ShoppingBag className="w-4 h-4" />,
  },
  {
    key: "freeParking",
    label: "Free Parking",
    icon: <Car className="w-4 h-4" />,
  },
  {
    key: "bikeRental",
    label: "Bike Rental",
    icon: <Bike className="w-4 h-4" />,
  },
  { key: "freeWifi", label: "Free Wifi", icon: <Wifi className="w-4 h-4" /> },
  {
    key: "movieNights",
    label: "Movie Nights",
    icon: <Film className="w-4 h-4" />,
  },
  {
    key: "coffeShop",
    label: "Coffee Shop",
    icon: <Coffee className="w-4 h-4" />,
  },
];

interface HotelWithReviews extends HotelWithRooms {
  reviews?: (Review & { user: { name: string } })[];
  isFavorited?: boolean; // Thêm trường isFavorited
}

const HotelDetailsClient = ({
  hotel,
  bookings,
}: {
  hotel: HotelWithReviews;
  bookings?: Booking[];
}) => {
  const { getCountryByCode, getStateByCode } = useLocation();
  const country = getCountryByCode(hotel.country);
  const state = getStateByCode(hotel.country, hotel.state);
  const { user } = useUser();

  const [reviews, setReviews] = useState<
    (Review & { user: { name: string } })[]
  >([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isUserSynced, setIsUserSynced] = useState(false);
  const [isFavorited, setIsFavorited] = useState(hotel.isFavorited || false); // State cho yêu thích

  // Xử lý yêu thích
  const handleFavoriteClick = async () => {
    if (!user) {
      toast.error("Bạn cần đăng nhập để thêm vào danh sách yêu thích!");
      return;
    }

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

  // Đồng bộ người dùng khi đăng nhập
  useEffect(() => {
    const syncUser = async () => {
      if (!user || isUserSynced) return;

      try {
        const response = await fetch("/api/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to sync user");
        }

        const result = await response.json();
        console.log("Client-side user sync result:", result);
        setIsUserSynced(true);
      } catch (error: any) {
        console.error("Error syncing user on client:", error);
        setError("Failed to sync user. Please try again.");
      }
    };

    syncUser();
  }, [user, isUserSynced]);

  // Lấy danh sách đánh giá và kiểm tra đã đánh giá chưa
  useEffect(() => {
    const fetchReviewsAndCheck = async () => {
      try {
        const response = await fetch(`/api/review?hotelId=${hotel.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const data = await response.json();
        setReviews(data);

        if (user) {
          const userReview = data.find(
            (review: Review & { user: { name: string } }) =>
              review.userId === user.id
          );
          setHasReviewed(!!userReview);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchReviewsAndCheck();
  }, [hotel.id, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("You need to login to write a review!");
      return;
    }

    if (!isUserSynced) {
      setError("User not synced yet. Please wait or try again.");
      return;
    }

    if (hasReviewed) {
      setError("You have already reviewed this hotel!");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1-5 stars!");
      return;
    }

    if (!comment.trim()) {
      setError("Please enter your review comment!");
      return;
    }

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          hotelId: hotel.id,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit review");
      }

      const newReview = await response.json();
      setReviews([
        { ...newReview, user: { name: user.fullName || "Anonymous" } },
        ...reviews,
      ]);
      setHasReviewed(true);
      setRating(0);
      setComment("");
    } catch (error: any) {
      console.error("Error submitting review:", error);
      setError(error.message || "An error occurred while submitting review!");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Hotel Image */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
        <Image
          src={hotel.image}
          alt={hotel.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Hotel Info */}
      <div className="flex justify-between items-center mt-6">
        <h1 className="text-3xl font-bold">{hotel.title}</h1>
        <button
          onClick={handleFavoriteClick}
          className="p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
        >
          <Heart
            className={cn(
              "w-6 h-6",
              isFavorited ? "fill-red-500 text-red-500" : "text-gray-500"
            )}
          />
        </button>
      </div>
      <p className="text-gray-600 mt-2 flex items-center">
        <MapPin className="w-5 h-5 mr-1" />
        {hotel.city}, {state?.name}, {country?.name}
      </p>
      <p className="text-gray-700 mt-4">{hotel.description}</p>

      {/* Location Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Vị trí</h2>
        <p className="text-gray-700 mt-2">{hotel.locationDescription}</p>

        {/* Map */}
        {hotel.latitude && hotel.longitude ? (
          <div className="mt-4 w-full h-[300px] rounded-lg overflow-hidden relative z-0 border">
            <style jsx global>{`
              .leaflet-container {
                height: 100%;
                width: 100%;
              }
              .leaflet-control-attribution {
                font-size: 9px;
              }
              .leaflet-popup-content {
                margin: 12px;
              }
            `}</style>

            <MapContainer
              center={[hotel.latitude, hotel.longitude]}
              zoom={15}
              scrollWheelZoom={false}
              className="z-0"
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[hotel.latitude, hotel.longitude]}>
                <Popup className="text-sm font-medium">{hotel.title}</Popup>
              </Marker>
            </MapContainer>
          </div>
        ) : (
          <div className="mt-4 h-[300px] bg-gray-100 flex items-center justify-center rounded-lg">
            <p className="text-gray-500">Bản đồ không có sẵn</p>
          </div>
        )}
      </div>

      {/* Amenities Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Tiện ích</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {amenities.map(
            (amenity) =>
              hotel[amenity.key as keyof typeof hotel] && (
                <AmenityItem key={amenity.key} icon={amenity.icon}>
                  {amenity.label}
                </AmenityItem>
              )
          )}
        </div>
      </div>

      {/* Rooms Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Phòng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {hotel.rooms?.map((room) => (
            <RoomCard
              key={room.id}
              hotel={hotel}
              room={room}
              bookings={bookings}
            />
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold">Đánh giá</h2>

        {/* Review Form */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-medium mb-4">Viết đánh giá của bạn</h3>
          {hasReviewed ? (
            <p className="text-gray-600">Bạn đã đánh giá khách sạn này rồi!</p>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Đánh giá sao:
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl ${
                        star <= rating ? "text-yellow-500" : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Bình luận của bạn:
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Share your experience..."
                  disabled={hasReviewed || !isUserSynced}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!user || hasReviewed || !isUserSynced}
              >
                {user
                  ? hasReviewed
                    ? "Đã đánh giá"
                    : isUserSynced
                    ? "Gửi"
                    : "Đang đồng bộ..."
                  : "Login to Review"}
              </button>
            </form>
          )}
        </div>

        {/* Reviews List */}
        <div className="mt-8 space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="border-b pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">
                      {review.user.name || "Anonymous"}
                    </p>
                    <p className="text-yellow-500 text-lg">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </p>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-gray-700 mt-2">{review.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">
              Chưa có đánh giá nào
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsClient;
