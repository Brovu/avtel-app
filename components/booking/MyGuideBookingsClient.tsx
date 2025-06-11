"use client";

import { GuideBooking, LocalGuide, User } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Image from "next/image";
import { Separator } from "../ui/separator";
import moment from "moment";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {
  MapPin,
  Languages,
  Clock,
  User as UserIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Định nghĩa kiểu props
interface MyGuideBookingsClientProps {
  booking: GuideBooking & {
    guide: (LocalGuide & { user: { name: string; email: string } }) | null;
    user: { name: string; email: string } | null;
  };
  isGuideView?: boolean;
}

// Hàm định dạng giá tiền theo VND với dấu chấm ngăn cách
const formatPrice = (price: number) => {
  const formattedPrice = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedPrice} VND`;
};

const MyGuideBookingsClient: React.FC<MyGuideBookingsClientProps> = ({
  booking,
  isGuideView = false,
}) => {
  const { guide, user } = booking;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  console.log("Rendering MyGuideBookingsClient:", { booking, isGuideView });

  const startTime = moment(booking.startTime).format("DD/MM/YYYY HH:mm");
  const endTime = moment(booking.endTime).format("DD/MM/YYYY HH:mm");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const handleAction = async (action: "confirm" | "cancel") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/guide-bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update booking");
      }

      toast.success(
        action === "confirm"
          ? "Đã xác nhận đặt lịch!"
          : "Đã hủy đặt lịch thành công!"
      );
      router.refresh();
    } catch (error: any) {
      console.error("Error updating booking:", error);
      toast.error(error.message || "Lỗi khi thực hiện hành động");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isGuideView
            ? `Đặt lịch từ ${user?.name || "Khách hàng ẩn danh"}`
            : guide?.name || "Hướng dẫn viên không xác định"}
        </CardTitle>
        <CardDescription>
          {isGuideView
            ? `Email: ${user?.email || "Không có thông tin"}`
            : guide?.bio || "Không có mô tả"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="aspect-square overflow-hidden relative h-[200px] rounded-lg">
          <Image
            fill
            src={guide?.profileImage || "/default-image.jpg"}
            alt={guide?.name || "Hướng dẫn viên"}
            className="object-cover"
          />
        </div>
        <div className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Thời gian bắt đầu: {startTime}
        </div>
        <div className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Thời gian kết thúc: {endTime}
        </div>
        <div className="text-sm flex items-center gap-2">
          {getStatusIcon(booking.status)}
          Trạng thái: {booking.status}
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4 content-start text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {guide?.city || "Không có thông tin"}
          </div>
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            {guide?.languages?.join(", ") || "Không có thông tin"}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Ghi chú:</span>{" "}
            {booking.notes || "Không có ghi chú"}
          </div>
        </div>
        <Separator />
        <div className="text-sm">
          Tổng giá:{" "}
          <span className="font-bold">{formatPrice(booking.totalPrice)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          className="cursor-pointer"
          variant="outline"
          onClick={() => router.push(`/local-guide/${guide?.id || ""}`)}
        >
          Xem chi tiết HDV
        </Button>
        {booking.status === "PENDING" && (
          <Button
            className="cursor-pointer"
            onClick={() => handleAction(isGuideView ? "confirm" : "cancel")}
            disabled={isLoading}
          >
            {isLoading
              ? "Đang xử lý..."
              : isGuideView
              ? "Xác nhận"
              : "Hủy đặt lịch"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MyGuideBookingsClient;
