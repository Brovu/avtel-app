"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface BookingContextType {
  bookingInfo: {
    confirmed: boolean;
    city: string;
    startDate: Date | null;
    endDate: Date | null;
  } | null;
  setBookingInfo: (
    info: {
      confirmed: boolean;
      city: string;
      startDate: Date | null;
      endDate: Date | null;
    } | null
  ) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookingInfo, setBookingInfo] = useState<{
    confirmed: boolean;
    city: string;
    startDate: Date | null;
    endDate: Date | null;
  } | null>(null);

  // Chỉ chạy trên client-side
  useEffect(() => {
    // Đọc từ localStorage khi component mount
    const storedBookingInfo = localStorage.getItem("bookingInfo");
    if (storedBookingInfo) {
      const parsed = JSON.parse(storedBookingInfo);
      setBookingInfo({
        confirmed: parsed.confirmed,
        city: parsed.city,
        startDate: parsed.startDate ? new Date(parsed.startDate) : null,
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      });
    }
  }, []);

  // Cập nhật localStorage khi bookingInfo thay đổi
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Kiểm tra môi trường client-side
      if (bookingInfo) {
        localStorage.setItem(
          "bookingInfo",
          JSON.stringify({
            confirmed: bookingInfo.confirmed,
            city: bookingInfo.city,
            startDate: bookingInfo.startDate
              ? bookingInfo.startDate.toISOString()
              : null,
            endDate: bookingInfo.endDate
              ? bookingInfo.endDate.toISOString()
              : null,
          })
        );
      } else {
        localStorage.removeItem("bookingInfo");
      }
    }
  }, [bookingInfo]);

  return (
    <BookingContext.Provider value={{ bookingInfo, setBookingInfo }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};
