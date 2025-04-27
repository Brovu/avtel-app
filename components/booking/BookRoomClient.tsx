"use client";

import useBookRoom from "@/hooks/useBookRoom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import RoomCard from "../room/RoomCard";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import RoomPaymentForm from "./RoomPaymentForm";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

const BookRoomClient = () => {
  const { bookingRoomData, clientSecret } = useBookRoom();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false); // Sử dụng pageLoaded
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: theme === "dark" ? "night" : "stripe",
      labels: "floating",
    },
  };

  useEffect(() => {
    if (bookingRoomData?.room?.id) {
      fetch(`/api/room/${bookingRoomData.room.id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Không thể lấy thông tin phòng");
          }
          return res.json();
        })
        .then((data) => {
          setRoom(data);
          setLoading(false);
          setPageLoaded(true); // Đánh dấu trang đã tải xong
        })
        .catch((error: any) => {
          console.error("Error fetching room:", error);
          toast.error(`Có lỗi: ${error.message}`);
          setLoading(false);
          setPageLoaded(true); // Đánh dấu trang đã tải xong, ngay cả khi có lỗi
        });
    } else {
      // Nếu không có bookingRoomData.room.id, vẫn đánh dấu trang đã tải
      setLoading(false);
      setPageLoaded(true);
    }
  }, [bookingRoomData]);

  const handleSetPaymentSuccess = (value: boolean) => {
    setPaymentSuccess(value);
  };

  // Nếu thanh toán thành công, hiển thị thông báo thành công
  if (paymentSuccess) {
    return (
      <div className="flex items-center flex-col gap-4">
        <div className="text-green-600">Thanh toán thành công!</div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push("/")}
          >
            Về Trang chủ
          </Button>
          <Button
            className="cursor-pointer"
            onClick={() => router.push("/my-bookings")}
          >
            Xem đơn đặt phòng
          </Button>
        </div>
      </div>
    );
  }

  // Nếu trang đã tải xong và không có dữ liệu đặt phòng hoặc clientSecret
  if (pageLoaded && !paymentSuccess && (!bookingRoomData || !clientSecret)) {
    return (
      <div className="flex items-center flex-col gap-4">
        <div className="text-red-600">Rất tiếc! Không thể tải trang này...</div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push("/")}
          >
            Về Trang chủ
          </Button>
          <Button
            className="cursor-pointer"
            onClick={() => router.push("/my-bookings")}
          >
            Xem đơn đặt phòng
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div>Đang tải thông tin phòng...</div>;
  }

  if (!room) {
    return <div>Không tìm thấy thông tin phòng.</div>;
  }

  return (
    <div className="max-w-[700px] mx-auto">
      <h3 className="text-2xl font-semibold mb-6">
        Quý khách vui lòng hoàn tất thanh toán để tận hưởng!
      </h3>
      <div className="mb-6">
        <RoomCard room={room} />
      </div>
      <Elements options={options} stripe={stripePromise}>
        <RoomPaymentForm
          clientSecret={clientSecret}
          handleSetPaymentSuccess={handleSetPaymentSuccess}
        />
      </Elements>
    </div>
  );
};

export default BookRoomClient;
