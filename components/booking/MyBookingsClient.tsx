"use client";

import { Booking, Hotel, Room } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Image from "next/image";
import {
  Bed,
  User,
  Bath,
  BedDouble,
  UtensilsCrossed,
  Wifi,
  Building,
  Waves,
  Trees,
  Mountain,
  AirVent,
  VolumeX,
} from "lucide-react";
import { Separator } from "../ui/separator";
import moment from "moment";
import useLocation from "@/hooks/useLocation";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import useBookRoom from "@/hooks/useBookRoom";
import { toast } from "sonner";

// Định nghĩa kiểu props
interface MyBookingsClientProps {
  booking: Booking & { Room: Room } & { Hotel: Hotel };
}

const AmenityItem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-sm">{children}</div>
);

// Hàm định dạng giá tiền theo VND với dấu chấm ngăn cách
const formatPrice = (price: number) => {
  // Định dạng số với dấu chấm ngăn cách
  const formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedPrice} VND`;
};

const MyBookingsClient: React.FC<MyBookingsClientProps> = ({ booking }) => {
  const { Room, Hotel } = booking; // Sử dụng Room và Hotel từ booking

  // Định dạng ngày tháng theo DD/MM/YYYY
  const startDate = moment(booking.startDate).format("DD/MM/YYYY");
  const endDate = moment(booking.endDate).format("DD/MM/YYYY");

  // Lấy thông tin vị trí
  const { getCountryByCode, getStateByCode } = useLocation();
  const country = getCountryByCode(Hotel?.country || "");
  const state = getStateByCode(Hotel?.country || "", Hotel?.state || "");
  const location =
    state && country
      ? `${state.name}, ${country.name}`
      : country?.name || "Không xác định";

  // Sử dụng router để điều hướng
  const router = useRouter();

  // Sử dụng useBookRoom để lưu dữ liệu booking
  const { setRoomData, setClientSecret, setPaymentIntentId } = useBookRoom();

  // Hàm xử lý thanh toán
  const handlePayNow = async () => {
    try {
      // Lưu dữ liệu booking vào useBookRoom
      const bookingRoomData = {
        room: {
          id: Room.id,
          title: Room.title,
          roomPrice: Room.roomPrice,
          breakFastPrice: Room.breakFastPrice,
          image: Room.image,
        },
        totalPrice: booking.totalPrice,
        breakFastIncluded: booking.breakFastIncluded,
        startDate: booking.startDate,
        endDate: booking.endDate,
      };

      setRoomData(bookingRoomData);

      // Gọi API để tạo paymentIntent
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking: {
            hotelOwnerId: Hotel.userId,
            hotelId: Hotel.id,
            roomId: Room.id,
            startDate: booking.startDate,
            endDate: booking.endDate,
            breakFastIncluded: booking.breakFastIncluded,
            totalPrice: booking.totalPrice,
          },
          payment_intent_id: booking.paymentIntentId || "", // Sử dụng paymentIntentId hiện có nếu có
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Lỗi từ server: ${response.status} - ${
            errorText || "Không có thông tin chi tiết"
          }`
        );
      }

      const data = await response.json();

      if (data.message) {
        toast.error(data.message);
        return;
      }

      if (!data.paymentIntent) {
        toast.error("Không nhận được thông tin thanh toán từ server");
        return;
      }

      // Lưu clientSecret và paymentIntentId
      setClientSecret(data.paymentIntent.client_secret);
      setPaymentIntentId(data.paymentIntent.id);

      // Thông báo thành công và điều hướng
      toast.success("Chuẩn bị thanh toán... Đang chuyển hướng!");
      router.push("/book-room");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Có lỗi: ${error.message}`);
    }
  };

  // Danh sách tiện ích
  const amenities = [
    {
      condition: true,
      icon: <Bed className="h-4 w-4" />,
      label: `${Room.bedCount} Giường`,
    },
    {
      condition: true,
      icon: <User className="h-4 w-4" />,
      label: `${Room.guestCount} Khách`,
    },
    {
      condition: true,
      icon: <Bath className="h-4 w-4" />,
      label: `${Room.bathroomCount} Phòng tắm`,
    },
    {
      condition: !!Room.kingBed,
      icon: <BedDouble className="h-4 w-4" />,
      label: `${Room.kingBed} Giường King`,
    },
    {
      condition: !!Room.queenBed,
      icon: <BedDouble className="h-4 w-4" />,
      label: `${Room.queenBed} Giường Queen`,
    },
    {
      condition: !!Room.roomService,
      icon: <UtensilsCrossed className="h-4 w-4" />,
      label: "Dịch vụ phòng",
    },
    {
      condition: !!Room.freeWifi,
      icon: <Wifi className="h-4 w-4" />,
      label: "Wifi miễn phí",
    },
    {
      condition: !!Room.cityView,
      icon: <Building className="h-4 w-4" />,
      label: "View thành phố",
    },
    {
      condition: !!Room.oceanView,
      icon: <Waves className="h-4 w-4" />,
      label: "View biển",
    },
    {
      condition: !!Room.forestView,
      icon: <Trees className="h-4 w-4" />,
      label: "View rừng",
    },
    {
      condition: !!Room.mountainView,
      icon: <Mountain className="h-4 w-4" />,
      label: "View núi",
    },
    {
      condition: !!Room.airCondition,
      icon: <AirVent className="h-4 w-4" />,
      label: "Máy lạnh",
    },
    {
      condition: !!Room.soundProofed,
      icon: <VolumeX className="h-4 w-4" />,
      label: "Cách âm",
    },
  ];

  const visibleAmenities = amenities
    .filter((item) => item.condition)
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{Room.title}</CardTitle>
        <CardDescription>
          {Hotel.title} - {Room.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="aspect-square overflow-hidden relative h-[200px] rounded-lg">
          <Image
            fill
            src={Room.image}
            alt={Room.title}
            className="object-cover"
          />
        </div>
        <div className="text-sm">
          Nhận phòng: {startDate} <br />
          Trả phòng: {endDate}
        </div>
        <div className="text-sm">
          Trạng thái thanh toán:{" "}
          <span
            className={
              booking.paymentStatus ? "text-green-600" : "text-red-600"
            }
          >
            {booking.paymentStatus ? "Đã thanh toán" : "Chưa thanh toán"}
          </span>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4 content-start text-sm">
          {visibleAmenities.length > 0 ? (
            visibleAmenities.map((amenity, index) => (
              <AmenityItem key={index}>
                {amenity.icon}
                {amenity.label}
              </AmenityItem>
            ))
          ) : (
            <div className="col-span-2 text-center text-gray-500">
              Không có tiện ích nào
            </div>
          )}
        </div>
        <Separator />
        <div className="flex justify-between text-sm">
          <div>
            Giá phòng:{" "}
            <span className="font-bold">{formatPrice(Room.roomPrice)}</span> /
            24h
          </div>
          {!!Room.breakFastPrice && (
            <div>
              Giá bữa sáng:{" "}
              <span className="font-bold">
                {formatPrice(Room.breakFastPrice)}
              </span>
            </div>
          )}
        </div>
        <div className="text-sm">
          Tổng giá:{" "}
          <span className="font-bold">{formatPrice(booking.totalPrice)}</span>
        </div>
        <div className="text-sm">Vị trí: {location}</div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          className="cursor-pointer"
          variant="outline"
          onClick={() => router.push(`/hotel-details/${Hotel.id}`)}
        >
          Xem chi tiết khách sạn
        </Button>
        {!booking.paymentStatus && (
          <Button className="cursor-pointer" onClick={handlePayNow}>
            Thanh toán ngay
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MyBookingsClient;
