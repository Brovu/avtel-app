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
  booking: Booking & { room: Room | null; hotel: Hotel | null };
}

const AmenityItem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-sm">{children}</div>
);

// Hàm định dạng giá tiền theo VND với dấu chấm ngăn cách
const formatPrice = (price: number) => {
  const formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedPrice} VND`;
};

const MyBookingsClient: React.FC<MyBookingsClientProps> = ({ booking }) => {
  const { room, hotel } = booking;

  // Định dạng ngày tháng theo DD/MM/YYYY
  const startDate = moment(booking.startDate).format("DD/MM/YYYY");
  const endDate = moment(booking.endDate).format("DD/MM/YYYY");

  // Lấy thông tin vị trí
  const { getCountryByCode, getStateByCode } = useLocation();
  const country = getCountryByCode(hotel?.country || "");
  const state = getStateByCode(hotel?.country || "", hotel?.state || "");
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
    if (!room || !hotel) {
      toast.error("Không thể thanh toán: Thiếu thông tin phòng hoặc khách sạn");
      return;
    }

    try {
      const bookingRoomData = {
        room: {
          id: room.id,
          title: room.title,
          roomPrice: room.roomPrice,
          breakFastPrice: room.breakFastPrice,
          image: room.image,
        },
        totalPrice: booking.totalPrice,
        breakFastIncluded: booking.breakFastIncluded,
        startDate: booking.startDate,
        endDate: booking.endDate,
      };

      setRoomData(bookingRoomData);

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking: {
            hotelOwnerId: hotel.userId,
            hotelId: hotel.id,
            roomId: room.id,
            startDate: booking.startDate,
            endDate: booking.endDate,
            breakFastIncluded: booking.breakFastIncluded,
            totalPrice: booking.totalPrice,
          },
          payment_intent_id: booking.paymentIntentId || "",
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

      setClientSecret(data.paymentIntent.client_secret);
      setPaymentIntentId(data.paymentIntent.id);

      toast.success("Chuẩn bị thanh toán... Đang chuyển hướng!");
      router.push("/book-room");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Có lỗi: ${error.message}`);
    }
  };

  // Hàm xử lý hủy đặt phòng
  const handleCancelBooking = async () => {
    if (!booking.paymentIntentId) {
      toast.error("Không tìm thấy thông tin đặt phòng để hủy");
      return;
    }

    try {
      const response = await fetch(`/api/booking/${booking.paymentIntentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Lỗi khi hủy đặt phòng: ${response.status} - ${
            errorText || "Không có thông tin chi tiết"
          }`
        );
      }

      toast.success("Đặt phòng đã được hủy thành công!");
      router.refresh(); // Làm mới trang để cập nhật danh sách đặt phòng
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast.error(`Có lỗi khi hủy: ${error.message}`);
    }
  };

  // Danh sách tiện ích
  const amenities = [
    {
      condition: room && typeof room.bedCount === "number",
      icon: <Bed className="h-4 w-4" />,
      label: room ? `${room.bedCount} Giường` : "Không có thông tin",
    },
    {
      condition: room && typeof room.guestCount === "number",
      icon: <User className="h-4 w-4" />,
      label: room ? `${room.guestCount} Khách` : "Không có thông tin",
    },
    {
      condition: room && typeof room.bathroomCount === "number",
      icon: <Bath className="h-4 w-4" />,
      label: room ? `${room.bathroomCount} Phòng tắm` : "Không có thông tin",
    },
    {
      condition: room && typeof room.kingBed === "number" && room.kingBed > 0,
      icon: <BedDouble className="h-4 w-4" />,
      label: room ? `${room.kingBed} Giường King` : "Không có thông tin",
    },
    {
      condition: room && typeof room.queenBen === "number" && room.queenBen > 0,
      icon: <BedDouble className="h-4 w-4" />,
      label: room ? `${room.queenBen} Giường Queen` : "Không có thông tin",
    },
    {
      condition: room && room.roomService === true,
      icon: <UtensilsCrossed className="h-4 w-4" />,
      label: "Dịch vụ phòng",
    },
    {
      condition: room && room.freeWiFi === true,
      icon: <Wifi className="h-4 w-4" />,
      label: "Wifi miễn phí",
    },
    {
      condition: room && room.cityView === true,
      icon: <Building className="h-4 w-4" />,
      label: "View thành phố",
    },
    {
      condition: room && room.oceanView === true,
      icon: <Waves className="h-4 w-4" />,
      label: "View biển",
    },
    {
      condition: room && room.forestView === true,
      icon: <Trees className="h-4 w-4" />,
      label: "View rừng",
    },
    {
      condition: room && room.mountainView === true,
      icon: <Mountain className="h-4 w-4" />,
      label: "View núi",
    },
    {
      condition: room && room.airCondition === true,
      icon: <AirVent className="h-4 w-4" />,
      label: "Máy lạnh",
    },
    {
      condition: room && room.soundProofed === true,
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
        <CardTitle>{room?.title || "Phòng không xác định"}</CardTitle>
        <CardDescription>
          {hotel?.title || "Khách sạn không xác định"} -{" "}
          {room?.description || "Không có mô tả"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="aspect-square overflow-hidden relative h-[200px] rounded-lg">
          <Image
            fill
            src={
              room?.image || "https://via.placeholder.com/200x200?text=No+Image"
            }
            alt={room?.title || "Phòng không xác định"}
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
            <span className="font-bold">
              {room && typeof room.roomPrice === "number"
                ? formatPrice(room.roomPrice)
                : "Không có thông tin"}{" "}
              / 24h
            </span>
          </div>
          {room &&
            typeof room.breakFastPrice === "number" &&
            room.breakFastPrice > 0 && (
              <div>
                Giá bữa sáng:{" "}
                <span className="font-bold">
                  {formatPrice(room.breakFastPrice)}
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
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <Button
          className="cursor-pointer"
          variant="outline"
          onClick={() => router.push(`/hotel-details/${hotel?.id || ""}`)}
        >
          Xem chi tiết khách sạn
        </Button>
        {!booking.paymentStatus && (
          <>
            <Button className="cursor-pointer" onClick={handlePayNow}>
              Thanh toán ngay
            </Button>
            <Button
              className="cursor-pointer"
              variant="destructive"
              onClick={handleCancelBooking}
            >
              Hủy đặt phòng
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default MyBookingsClient;
