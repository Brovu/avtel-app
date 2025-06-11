"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Container from "@/components/Container";
import { Separator } from "@/components/ui/separator";
import { Phone, MapPin, Languages, Star } from "lucide-react";
import { DateRange } from "react-day-picker";
import { differenceInCalendarDays, eachDayOfInterval } from "date-fns";
import DateRangePicker from "@/components/room/DateRangePicker";

interface LocalGuide {
  id: string;
  name: string;
  bio: string;
  languages: string[];
  specialties: string[];
  pricePerDay: number;
  city: string;
  phoneNumber?: string;
  email?: string;
  profileImage: string;
  rating?: number;
}

interface GuideBooking {
  id: string;
  guideId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  userId: string;
  status: string;
}

interface GuideReview {
  id: string;
  guideId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  user: { name: string };
}

const LocalGuideDetailsPage = () => {
  const router = useRouter();
  const { guideId } = useParams();
  const { userId } = useAuth();

  const [guide, setGuide] = useState<LocalGuide | null>(null);
  const [bookings, setBookings] = useState<GuideBooking[]>([]);
  const [reviews, setReviews] = useState<GuideReview[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingIsLoading, setBookingIsLoading] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>();
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [days, setDays] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuideData = async () => {
      try {
        setError(null);
        const guideResponse = await fetch(`/api/local-guide/${guideId}`);
        if (!guideResponse.ok) {
          const errorData = await guideResponse.json();
          throw new Error(errorData.error || "Failed to fetch guide");
        }
        const guideData = await guideResponse.json();
        setGuide(guideData);

        const bookingsResponse = await fetch(
          `/api/guide-bookings?guideId=${guideId}`
        );
        if (!bookingsResponse.ok) {
          const errorData = await bookingsResponse.json();
          throw new Error(errorData.error || "Failed to fetch bookings");
        }
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);

        const reviewsResponse = await fetch(
          `/api/guide-reviews?guideId=${guideId}`
        );
        if (!reviewsResponse.ok) {
          const errorData = await reviewsResponse.json();
          throw new Error(errorData.error || "Failed to fetch reviews");
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);

        if (userId) {
          const userReview = reviewsData.find(
            (review: GuideReview) => review.userId === userId
          );
          setHasReviewed(!!userReview);
        }
      } catch (error: any) {
        console.error("Error fetching guide data:", error);
        setError(error.message || "Lỗi khi tải thông tin hướng dẫn viên");
        toast.error(error.message || "Lỗi không xác định");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuideData();
  }, [guideId, userId]);

  useEffect(() => {
    if (date && date.from && date.to && guide) {
      const dayCount = differenceInCalendarDays(date.to, date.from);
      const daysToBook = dayCount > 0 ? dayCount : 1;
      setDays(daysToBook);
      setTotalPrice(daysToBook * guide.pricePerDay);
    }
  }, [date, guide]);

  const disabledDates = useMemo(() => {
    let dates: Date[] = [];
    bookings.forEach((booking) => {
      const range = eachDayOfInterval({
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
      });
      dates = [...dates, ...range];
    });
    return dates;
  }, [bookings]);

  const handleBookGuide = async () => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để đặt lịch!");
      return;
    }

    if (!date?.from || !date?.to) {
      toast.error("Vui lòng chọn ngày đặt lịch!");
      return;
    }

    setBookingIsLoading(true);
    try {
      const response = await fetch("/api/guide-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideId: guide?.id,
          startTime: date.from,
          endTime: date.to,
          totalPrice,
          notes: "Gặp tại điểm hẹn",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          throw new Error("Phản hồi từ server không hợp lệ");
        }
        throw new Error(errorData.error || "Failed to book guide");
      }

      toast.success("Đặt lịch thành công!");
      router.push("/my-booking-guide");
    } catch (error: any) {
      console.error("Error booking guide:", error);
      toast.error(error.message || "Lỗi khi đặt lịch");
    } finally {
      setBookingIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Vui lòng đăng nhập để gửi đánh giá!");
      return;
    }

    if (hasReviewed) {
      toast.error("Bạn đã đánh giá hướng dẫn viên này rồi!");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Vui lòng chọn đánh giá từ 1-5 sao!");
      return;
    }

    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    try {
      const response = await fetch("/api/guide-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideId: guide?.id,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          throw new Error("Phản hồi từ server không hợp lệ");
        }
        throw new Error(errorData.error || "Failed to submit review");
      }

      const text = await response.text();
      let newReview;
      try {
        newReview = JSON.parse(text);
      } catch {
        throw new Error("Dữ liệu trả về từ server không hợp lệ");
      }

      setReviews([
        { ...newReview, user: { name: userId || "Anonymous" } },
        ...reviews,
      ]);
      setHasReviewed(true);
      setRating(0);
      setComment("");
      toast.success("Đánh giá đã được gửi thành công!");
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Lỗi khi gửi đánh giá");
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="py-10 text-center text-lg text-gray-600 dark:text-gray-400 animate-pulse">
          Đang tải thông tin hướng dẫn viên...
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="py-10 text-center text-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      </Container>
    );
  }

  if (!guide) {
    return (
      <Container>
        <div className="py-10 text-center text-lg text-gray-600 dark:text-gray-400">
          Không tìm thấy hướng dẫn viên.
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-5xl mx-auto py-10 px-6 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl animate-fade-in">
        <div className="relative w-full h-[400px] rounded-lg overflow-hidden mb-8">
          <Image
            src={guide.profileImage || "/default-image.jpg"}
            alt={guide.name}
            fill
            className="object-cover transition-opacity duration-300 hover:opacity-90"
          />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          {guide.name}
        </h1>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p className="flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-medium">Khu vực:</span> {guide.city}
          </p>
          <p className="flex items-center">
            <Languages className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-medium">Ngôn ngữ:</span>{" "}
            {guide.languages.join(", ")}
          </p>
          <p>
            <span className="font-medium">Chuyên môn:</span>{" "}
            {guide.specialties.join(", ")}
          </p>
          <p>
            <span className="font-medium">Giá/ngày:</span>{" "}
            {guide.pricePerDay.toLocaleString()} VND
          </p>
          {guide.phoneNumber && (
            <p>
              <span className="font-medium">Số điện thoại:</span>{" "}
              <a
                href={`tel:${guide.phoneNumber}`}
                className="text-blue-600 hover:underline flex items-center"
              >
                <Phone className="w-5 h-5 mr-2" />
                {guide.phoneNumber}
              </a>
            </p>
          )}
          {guide.email && (
            <p>
              <span className="font-medium">Email:</span>{" "}
              <a
                href={`mailto:${guide.email}`}
                className="text-blue-600 hover:underline"
              >
                {guide.email}
              </a>
            </p>
          )}
          {guide.rating && (
            <p className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              <span className="font-medium">Điểm đánh giá:</span>{" "}
              {guide.rating.toFixed(1)}/5
            </p>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Giới thiệu
          </h2>
          <p className="text-gray-700 dark:text-gray-300">{guide.bio}</p>
        </div>

        <Separator className="my-8" />

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Đặt lịch với {guide.name}
          </h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="mb-4">
              <div className="text-gray-700 dark:text-gray-300 mb-2">
                Chọn ngày bạn muốn đặt
              </div>
              <DateRangePicker
                date={date}
                setDate={setDate}
                disabledDates={disabledDates}
              />
            </div>
            <div className="text-gray-700 dark:text-gray-300 mb-4">
              Tổng cộng:{" "}
              <span className="font-bold">
                {totalPrice.toLocaleString()} VND
              </span>{" "}
              cho <span className="font-bold">{days} ngày</span>
            </div>
            <Button
              onClick={handleBookGuide}
              disabled={bookingIsLoading}
              className="cursor-pointer w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {bookingIsLoading ? "Đang xử lý..." : "Đặt lịch ngay"}
            </Button>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Đánh giá
          </h2>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-4">
              Viết đánh giá của bạn
            </h3>
            {hasReviewed ? (
              <p className="text-gray-600 dark:text-gray-400">
                Bạn đã đánh giá hướng dẫn viên này rồi!
              </p>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Đánh giá sao:
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-colors duration-200 ${
                          star <= rating
                            ? "text-yellow-500"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">
                    Bình luận của bạn:
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    disabled={hasReviewed || !userId}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={hasReviewed || !userId}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  {userId
                    ? hasReviewed
                      ? "Đã đánh giá"
                      : "Gửi đánh giá"
                    : "Đăng nhập để đánh giá"}
                </Button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b pb-6 border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg text-gray-800 dark:text-white">
                        {review.user.name || "Ẩn danh"}
                      </p>
                      <p className="text-yellow-500 text-lg flex items-center">
                        <Star className="w-5 h-5 mr-1" />
                        {review.rating}/5
                      </p>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Chưa có đánh giá nào.
              </p>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default LocalGuideDetailsPage;
