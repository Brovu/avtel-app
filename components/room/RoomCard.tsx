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
  Tv,
  DoorOpen,
  Wifi,
  Building,
  Waves,
  Trees,
  Mountain,
  AirVent,
  VolumeX,
  Loader2,
  Trash,
  Edit,
  Wand2,
  MapPin,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddRoomForm from "../room/AddRoomForm";
import axios from "axios";
import { toast } from "sonner";
import DateRangePicker from "./DateRangePicker";
import { DateRange } from "react-day-picker";
import { differenceInCalendarDays, eachDayOfInterval } from "date-fns";
import { Checkbox } from "../ui/checkbox";
import { useAuth } from "@clerk/nextjs";
import useBookRoom from "@/hooks/useBookRoom";
import attractionsData from "@/data/attractions.json"; // Import dữ liệu điểm tham quan

interface RoomCardProps {
  hotel?: Hotel & {
    rooms: Room[];
  };
  room: Room;
  bookings?: Booking[];
}

interface Attraction {
  name: string;
  description: string;
  type: string;
}

interface AttractionsData {
  [city: string]: Attraction[];
}

const AmenityItem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2">{children}</div>
);

// Hàm định dạng giá tiền theo VND
const formatPrice = (price: number) => {
  return price.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

// Hàm chuẩn hóa tên thành phố
const normalizeCityName = (city: string | undefined): string => {
  if (!city) return "";
  // Loại bỏ "Thành Phố " và chuẩn hóa về chữ thường để so sánh
  return city
    .replace(/^Thành Phố\s+/i, "")
    .trim()
    .toLowerCase();
};

// Hàm ánh xạ loại điểm tham quan sang icon
const getAttractionIcon = (type: string) => {
  switch (type) {
    case "sightseeing":
      return <MapPin className="h-4 w-4 text-blue-600" />;
    case "beach":
      return <Waves className="h-4 w-4 text-blue-600" />;
    case "shopping":
      return <Building className="h-4 w-4 text-blue-600" />;
    case "dining":
      return <UtensilsCrossed className="h-4 w-4 text-blue-600" />;
    default:
      return <MapPin className="h-4 w-4 text-blue-600" />;
  }
};

// UI NEEEEEE
const RoomCard = ({ hotel, room, bookings = [] }: RoomCardProps) => {
  const { setRoomData, paymentIntentId, setClientSecret, setPaymentIntentId } =
    useBookRoom();

  const [isLoading, setIsLoading] = useState(false);
  const [bookingIsLoading, setBookingIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false); // State để mở dialog đề xuất
  const pathName = usePathname();
  const router = useRouter();
  const isHotelDetailsPage = pathName.includes("hotel-details");
  const [date, setDate] = useState<DateRange | undefined>();
  const [totalPrice, setTotalPrice] = useState<number>(room.roomPrice);
  const [includeBreakFast, setIncludeBreakFast] = useState(false);
  const [days, setDays] = useState(1);
  const isBookRoom = pathName.includes("book-room");

  const { userId } = useAuth();

  // Chuẩn hóa tên thành phố từ hotel.city
  const normalizedCity = normalizeCityName(hotel?.city);

  // Tìm key khớp với normalizedCity trong attractionsData (không phân biệt hoa/thường)
  const cityKey = Object.keys(attractionsData as AttractionsData).find(
    (key) => normalizeCityName(key) === normalizedCity
  );

  // Lấy danh sách điểm tham quan dựa trên thành phố đã chuẩn hóa
  const cityAttractions = cityKey
    ? (attractionsData as AttractionsData)[cityKey] || []
    : [];

  const disabledDates = useMemo(() => {
    let dates: Date[] = [];

    const roomBookings = bookings.filter(
      (booking) => booking.roomId === room.id && booking.paymentStatus
    );

    roomBookings.forEach((booking) => {
      const range = eachDayOfInterval({
        start: new Date(booking.startDate),
        end: new Date(booking.endDate),
      });

      dates = [...dates, ...range];
    });

    return dates;
  }, [bookings]);

  const handleRoomDelete = async (room: Room) => {
    setIsLoading(true);

    try {
      if (room.image) {
        const imageKey = room.image.split("/").pop();
        await axios.post("/api/uploadthing/delete", { fileKey: imageKey });
      }

      const response = await axios.delete(`/api/room/${room.id}`);

      if (response.status === 200 || response.status === 204) {
        toast.success("Phòng đã được xóa thành công!");
        router.refresh();
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      console.error("Delete room error:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error("Dữ liệu không hợp lệ");
        } else if (error.response?.status === 401) {
          toast.error("Bạn cần đăng nhập");
        } else if (error.response?.status === 403) {
          toast.error("Bạn không có quyền xóa phòng này");
        } else if (error.response?.status === 404) {
          toast.error("Không tìm thấy phòng để xóa");
        } else {
          toast.error("Lỗi server: " + error.response?.data?.message);
        }
      } else {
        toast.error("Lỗi không xác định khi xóa phòng");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogueOpen = () => {
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (date && date.from && date.to) {
      const dayCount = differenceInCalendarDays(date.to, date.from);
      setDays(dayCount > 0 ? dayCount : 1); // Đảm bảo ít nhất 1 ngày

      if (dayCount > 0 && room.roomPrice) {
        let price = dayCount * room.roomPrice;
        if (includeBreakFast && room.breakFastPrice) {
          price += dayCount * room.breakFastPrice;
        }
        // Làm tròn totalPrice để đảm bảo là số nguyên (vì schema Booking yêu cầu totalPrice là Int)
        const roundedPrice = Math.floor(price);
        setTotalPrice(roundedPrice);

        // Kiểm tra giới hạn của Stripe
        const maxAmountInVND = 999999999; // Giới hạn của Stripe cho VND
        if (roundedPrice > maxAmountInVND) {
          toast.error(
            `Tổng số tiền không được vượt quá ${maxAmountInVND.toLocaleString()} VND`
          );
        }
      } else {
        setTotalPrice(room.roomPrice);
      }
    }
  }, [date, room.roomPrice, includeBreakFast]);

  const amenities = [
    {
      condition: true,
      icon: <Bed className="h-4 w-4" />,
      label: `${room.bedCount} Giường`,
    },
    {
      condition: true,
      icon: <User className="h-4 w-4" />,
      label: `${room.guestCount} Người`,
    },
    {
      condition: true,
      icon: <Bath className="h-4 w-4" />,
      label: `${room.bathroomCount} Phòng`,
    },
    {
      condition: !!room.kingBed,
      icon: <BedDouble className="h-4 w-4" />,
      label: `${room.kingBed} King`,
    },
    {
      condition: !!room.queenBen,
      icon: <BedDouble className="h-4 w-4" />,
      label: `${room.queenBen} Queen`,
    },
    {
      condition: !!room.roomService,
      icon: <UtensilsCrossed className="h-4 w-4" />,
      label: "Dịch vụ phòng",
    },
    { condition: !!room.TV, icon: <Tv className="h-4 w-4" />, label: "TV" },
    {
      condition: !!room.balcony,
      icon: <DoorOpen className="h-4 w-4" />,
      label: "Ban công",
    },
    {
      condition: !!room.freeWiFi,
      icon: <Wifi className="h-4 w-4" />,
      label: "WiFi miễn phí",
    },
    {
      condition: !!room.cityView,
      icon: <Building className="h-4 w-4" />,
      label: "View thành phố",
    },
    {
      condition: !!room.oceanView,
      icon: <Waves className="h-4 w-4" />,
      label: "View biển",
    },
    {
      condition: !!room.forestView,
      icon: <Trees className="h-4 w-4" />,
      label: "View rừng",
    },
    {
      condition: !!room.mountainView,
      icon: <Mountain className="h-4 w-4" />,
      label: "View núi",
    },
    {
      condition: !!room.airCondition,
      icon: <AirVent className="h-4 w-4" />,
      label: "Máy lạnh",
    },
    {
      condition: !!room.soundProofed,
      icon: <VolumeX className="h-4 w-4" />,
      label: "Cách âm",
    },
  ];

  const visibleAmenities = amenities
    .filter((item) => item.condition)
    .slice(0, 6);

  const handleBookRoom = () => {
    if (!userId) return toast.error("Lỗi đặt phòng, bạn đã đăng nhập chưa?");

    if (!hotel?.userId)
      return toast.error("Lỗi đặt phòng, vui lòng làm mới lại trang");

    if (date?.from && date?.to) {
      // Kiểm tra totalPrice trước khi gửi
      const maxAmountInVND = 999999999; // Giới hạn của Stripe cho VND
      if (totalPrice > maxAmountInVND) {
        toast.error(
          `Tổng số tiền không được vượt quá ${maxAmountInVND.toLocaleString()} VND`
        );
        return;
      }

      setBookingIsLoading(true);

      // Chỉ lưu trữ các thuộc tính cần thiết của room để tránh tham chiếu vòng
      const bookingRoomData = {
        room: {
          id: room.id,
          title: room.title,
          roomPrice: room.roomPrice,
          breakFastPrice: room.breakFastPrice,
          image: room.image,
        },
        totalPrice,
        breakFastIncluded: includeBreakFast,
        startDate: date.from,
        endDate: date.to,
      };

      setRoomData(bookingRoomData);
      setPaymentIntentId(""); // Reset paymentIntentId để luôn tạo booking mới

      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking: {
            hotelOwnerId: hotel.userId,
            hotelId: hotel.id,
            roomId: room.id,
            startDate: date.from,
            endDate: date.to,
            breakFastIncluded: includeBreakFast,
            totalPrice: totalPrice,
          },
          payment_intent_id: "", // Đảm bảo luôn gửi chuỗi rỗng
        }),
      })
        .then((res) => {
          setBookingIsLoading(false);
          if (res.status === 401) {
            return router.push("/login");
          }
          if (!res.ok) {
            return res.text().then((text) => {
              throw new Error(
                `Lỗi từ server: ${res.status} - ${
                  text || "Không có thông tin chi tiết"
                }`
              );
            });
          }
          return res.json();
        })
        .then((data) => {
          if (data.message) {
            toast.error(data.message);
            return;
          }
          if (!data.paymentIntent) {
            toast.error("Không nhận được thông tin thanh toán từ server");
            return;
          }
          // Thêm thông báo thành công bằng toast
          toast.success(
            "Đặt phòng thành công! Xem gợi ý lịch trình của bạn..."
          );
          setClientSecret(data.paymentIntent.client_secret);
          setPaymentIntentId(data.paymentIntent.id);
          // Mở dialog gợi ý lịch trình thay vì chuyển hướng ngay
          setShowSuggestions(true);
        })
        .catch((error: any) => {
          console.log("Error:", error);
          toast.error(`Có lỗi: ${error.message}`);
        });
    } else {
      toast.error("Vui lòng chọn ngày");
    }
  };

  const handleProceedToPayment = () => {
    setShowSuggestions(false); // Đóng dialog gợi ý
    router.push("/book-room"); // Chuyển hướng đến trang thanh toán
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{room.title}</CardTitle>
          <CardDescription>{room.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="aspect-square overflow-hidden relative h-[200px] rounded-lg">
            <Image
              fill
              src={room.image}
              alt={room.title}
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 content-start text-[13px]">
            {Array.isArray(visibleAmenities) && visibleAmenities.length > 0 ? (
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
          <div className="flex flex-col justify-between text-[13px]">
            {!!room.breakFastPrice && (
              <div>
                Bữa sáng:{" "}
                <span className="font-bold text-red-600">
                  {formatPrice(room.breakFastPrice)}
                </span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="mt-2">
              Giá phòng:{" "}
              <span className="font-bold text-red-600">
                {formatPrice(room.roomPrice)}
              </span>{" "}
              <span>/ 24h</span>
            </div>
          </div>
        </CardContent>
        {!isBookRoom && (
          <CardFooter>
            {isHotelDetailsPage ? (
              <div className="flex flex-col gap-6 w-full">
                <div>
                  <div className="mb-2">Chọn ngày bạn muốn thuê</div>
                  <DateRangePicker
                    date={date}
                    setDate={setDate}
                    disabledDates={disabledDates}
                  />
                </div>
                {room.breakFastPrice > 0 && (
                  <div className="mb-4">
                    <div className="mb-2">
                      Bạn có muốn được phục vụ bữa sáng?
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="breakFast"
                        checked={includeBreakFast}
                        onCheckedChange={(value) =>
                          setIncludeBreakFast(!!value)
                        }
                      />
                      <label
                        htmlFor="breakFast"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Gồm bữa sáng (+{formatPrice(room.breakFastPrice)}/ngày)
                      </label>
                    </div>
                  </div>
                )}
                <div>
                  Tổng cộng:{" "}
                  <span className="font-bold">{formatPrice(totalPrice)}</span>{" "}
                  cho <span className="font-bold">{days} Ngày</span>
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => handleBookRoom()}
                    disabled={bookingIsLoading}
                    type="button"
                    className="cursor-pointer w-full"
                  >
                    {bookingIsLoading ? (
                      <Loader2 className="mr-2 h-4 w-4" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    {bookingIsLoading ? "Đang tải..." : "Đặt phòng"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-between">
                <Button
                  disabled={isLoading}
                  type="button"
                  variant="ghost"
                  className="cursor-pointer"
                  onClick={() => {
                    handleRoomDelete(room);
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" /> Xóa
                    </>
                  )}
                </Button>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Cập nhật
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[900px] w-[90%]">
                    <DialogHeader className="px-2">
                      <DialogTitle>Cập Nhật Phòng</DialogTitle>
                      <DialogDescription>
                        Thay đổi chi tiết của phòng này
                      </DialogDescription>
                    </DialogHeader>
                    <AddRoomForm
                      hotel={hotel}
                      room={room}
                      handleDialogueOpen={handleDialogueOpen}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Dialog gợi ý lịch trình */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-[600px] w-[90%]">
          <DialogHeader>
            <DialogTitle>Gợi ý lịch trình tại {hotel?.city}</DialogTitle>
            <DialogDescription>
              Dưới đây là một số địa điểm bạn có thể tham quan trong chuyến đi
              của mình!
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-4 p-4">
            {cityAttractions.length > 0 ? (
              cityAttractions.map((attraction: Attraction, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg shadow-sm"
                >
                  <div className="mt-1">
                    {getAttractionIcon(attraction.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      {attraction.name}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {attraction.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                Hiện tại chưa có gợi ý lịch trình cho thành phố này.
              </p>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleProceedToPayment}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Tiến hành thanh toán
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoomCard;
