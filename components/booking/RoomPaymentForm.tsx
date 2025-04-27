"use client";

import useBookRoom from "@/hooks/useBookRoom";
import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button"; // Giả định bạn dùng shadcn/ui
import { Separator } from "../ui/separator";
import moment from "moment";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";
import { endOfDay, isWithinInterval, startOfDay } from "date-fns";

interface RoomPaymentFormProps {
  clientSecret: string;
  handleSetPaymentSuccess: (value: boolean) => void;
}

type DateRangesType = {
  startDate: Date;
  endDate: Date;
};

function hasOverlap(
  startDate: Date,
  endDate: Date,
  dateRanges: DateRangesType[]
) {
  const targetInterval = {
    start: startOfDay(new Date(startDate)),
    end: endOfDay(new Date(endDate)),
  };

  for (const range of dateRanges) {
    const rangeStart = startOfDay(new Date(range.startDate));
    const rangeEnd = endOfDay(new Date(range.endDate));

    if (
      isWithinInterval(targetInterval.start, {
        start: rangeStart,
        end: rangeEnd,
      }) ||
      isWithinInterval(targetInterval.end, {
        start: rangeStart,
        end: rangeEnd,
      }) ||
      (targetInterval.start < rangeStart && targetInterval.end > rangeEnd)
    ) {
      return true;
    }
  }
  return false; // Thêm dòng này nếu không có overlap
}

const RoomPaymentForm = ({
  clientSecret,
  handleSetPaymentSuccess,
}: RoomPaymentFormProps) => {
  const { bookingRoomData, resetBookRoom } = useBookRoom();
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!stripe) {
      return;
    }

    if (!clientSecret) {
      return;
    }
    handleSetPaymentSuccess(false);
    setIsLoading(false);
  }, [stripe, clientSecret, handleSetPaymentSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    try {
      // Kiểm tra trùng lịch đặt phòng
      const bookings = await axios.get(
        `/api/booking/${bookingRoomData.room.id}`
      );

      const roomBookingDates = bookings.data.map((booking: Booking) => {
        return {
          startDate: booking.startDate,
          endDate: booking.endDate,
        };
      });

      const overlapFound = hasOverlap(
        bookingRoomData.startDate,
        bookingRoomData.endDate,
        roomBookingDates
      );

      if (overlapFound) {
        setIsLoading(false);
        return toast.error(
          "Rất tiếc! Một số ngày bạn chọn đã được đặt trước. Vui lòng chọn ngày khác hoặc phòng khác"
        );
      }

      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        toast.error(result.error.message || "Thanh toán thất bại!");
        setIsLoading(false);
        return;
      }

      // Gọi API để cập nhật trạng thái thanh toán
      const res = await axios.patch(`/api/booking/${result.paymentIntent.id}`);

      if (res.status !== 200) {
        throw new Error("Không thể cập nhật trạng thái thanh toán");
      }

      toast.success("Đã thanh toán thành công!");
      resetBookRoom();
      handleSetPaymentSuccess(true);
    } catch (error: any) {
      console.error("Error in payment process:", error);
      toast.error(
        error.message === "Không thể cập nhật trạng thái thanh toán"
          ? "Có biến rồi đại vương ơi!"
          : `Có lỗi: ${error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!bookingRoomData?.startDate || !bookingRoomData?.endDate)
    return <div>Lỗi: Thiếu ngày</div>;

  const startDate = moment(bookingRoomData?.startDate).format("MMMM Do YYYY");
  const endDate = moment(bookingRoomData?.endDate).format("MMMM Do YYYY");

  return (
    <form onSubmit={handleSubmit} id="payment-form">
      <h2 className="font-semibold mb-2 text-lg">Địa chỉ thanh toán</h2>
      <AddressElement
        options={{
          mode: "billing",
        }}
      />

      <h2 className="font-semibold mt-4 mb-2 text-lg">Thông Tin Thanh Toán</h2>
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      <div className="flex flex-col gap-1">
        <Separator />
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold mb-1 text-lg my-2">Booking của bạn</h2>
          <div>Bạn sẽ checkin vào {startDate} lúc 14.00</div>
          <div>Bạn sẽ check-out vào {endDate} lúc 09.00</div>
          {bookingRoomData?.breakfastIncluded && (
            <div>Và bữa sáng bắt đầu lúc 8.00 mỗi ngày</div>
          )}
        </div>
        <Separator />
        <div className="font-bold text-lg">
          {bookingRoomData?.breakfastIncluded && (
            <div className="mb-2">
              Bữa sáng: {bookingRoomData.breakfastIncluded} đ
            </div>
          )}
          Tổng cộng: {bookingRoomData?.totalPrice} đ
        </div>
      </div>

      {isLoading && (
        <Alert className="bg-indigo-600 text-white">
          <Terminal className="h-4 w-4 stroke-white" />
          <AlertTitle>Đang tiến hành thanh toán...</AlertTitle>
          <AlertDescription>Vui lòng không rời khỏi page nhé!</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="mt-4 w-full cursor-pointer"
      >
        {isLoading ? "Đang xử lý..." : "Thanh toán"}
      </Button>
    </form>
  );
};

export default RoomPaymentForm;
