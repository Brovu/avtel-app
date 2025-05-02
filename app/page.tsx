"use client";

import HotelList from "@/components/hotel/HotelList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import DateRangePicker from "@/components/room/DateRangePicker";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Hotel, MessageCircle, X, Send, Star } from "lucide-react";
import chatbotData from "@/data/chatbotData.json";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);

  // State cho chatbot
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { sender: "user" | "bot"; text?: string; hotels?: any[] }[]
  >([
    {
      sender: "bot",
      text: "Chào bạn! Mình là AI trợ lý du lịch. Bạn muốn tìm khách sạn như thế nào? (Ví dụ: Tôi cần một phòng dưới 1 triệu ở Đà Nẵng, có spa và gym)",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatContext, setChatContext] = useState<{
    city?: string;
    priceMin?: number;
    priceMax?: number;
    userAmenities?: string[]; // Tiện ích người dùng yêu cầu trực tiếp
    suggestedAmenities?: string[]; // Tiện ích gợi ý từ cảm xúc
    checkIn?: Date;
    checkOut?: Date;
    descriptionKeywords?: string[];
    minRating?: number;
    mood?: string;
  }>({ userAmenities: [], suggestedAmenities: [] });

  // Khởi tạo date từ searchParams
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate && endDate) {
      return {
        from: new Date(startDate),
        to: new Date(endDate),
      };
    }
    return undefined;
  });

  const [tempDate, setTempDate] = useState<DateRange | undefined>(date);

  // Hàm gọi API để lấy danh sách khách sạn
  const fetchHotels = useCallback(
    async (additionalParams: Record<string, string> = {}) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          ...(searchParams.get("title") && {
            title: searchParams.get("title")!,
          }),
          ...(searchParams.get("country") && {
            country: searchParams.get("country")!,
          }),
          ...(searchParams.get("state") && {
            state: searchParams.get("state")!,
          }),
          ...(searchParams.get("city") && { city: searchParams.get("city")! }),
          ...(date?.from && { startDate: date.from.toISOString() }),
          ...(date?.to && { endDate: date.to.toISOString() }),
          limit: "6",
          page: currentPage.toString(),
          ...additionalParams,
        });

        const response = await fetch(`/api/hotels?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error(`Lỗi từ server: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching hotels:", error);
        return [];
      } finally {
        setLoading(false);
        setShouldFetch(false);
      }
    },
    [searchParams, date, currentPage]
  );

  // Hàm ánh xạ tên tiện ích sang tên hiển thị thân thiện
  const mapAmenityToDisplayName = (amenity: string) => {
    switch (amenity) {
      case "swimmingPool":
        return "hồ bơi";
      case "gym":
        return "phòng gym";
      case "bar":
        return "quầy bar";
      case "spa":
        return "spa";
      case "freeWifi":
        return "wifi miễn phí";
      case "restaurant":
        return "nhà hàng";
      case "coffeShop":
        return "quán cà phê";
      case "movieNights":
        return "đêm chiếu phim";
      case "freeParking":
        return "bãi đỗ xe miễn phí";
      default:
        return amenity;
    }
  };

  // Hàm phân tích cảm xúc từ câu hỏi của người dùng
  const detectMood = (input: string): string | null => {
    const inputLower = input.toLowerCase();
    const matchedMood = chatbotData.moods.find((mood: any) =>
      mood.keywords.some((keyword: string) => inputLower.includes(keyword))
    );
    return matchedMood ? matchedMood.name : null;
  };

  // Hàm gợi ý dựa trên cảm xúc
  const getMoodBasedSuggestion = (
    mood: string
  ): { amenities: string[]; descriptionKeywords: string[] } => {
    const matchedMood = chatbotData.moods.find((m: any) => m.name === mood);
    if (matchedMood) {
      return {
        amenities: matchedMood.amenities,
        descriptionKeywords: matchedMood.descriptionKeywords,
      };
    }
    return { amenities: [], descriptionKeywords: [] };
  };

  // Hàm lấy displayName của cảm xúc để hiển thị trong tin nhắn
  const getMoodDisplayName = (mood: string): string => {
    const matchedMood = chatbotData.moods.find((m: any) => m.name === mood);
    return matchedMood ? matchedMood.displayName : mood;
  };

  // Hàm tìm kiếm thành phố từ câu hỏi và so sánh với database
  const detectCityFromInput = async (input: string): Promise<string | null> => {
    const inputLower = input.toLowerCase();
    const matchedCity = chatbotData.cities.find((city: any) =>
      city.aliases.some((alias: string) => inputLower.includes(alias))
    );

    if (matchedCity) {
      const cityName = matchedCity.name;
      const hotelsInCity = await fetchHotels({ city: cityName });
      if (hotelsInCity.length > 0) {
        return cityName;
      }
    }
    return null;
  };

  // Hàm lấy danh sách tiện ích thực tế của khách sạn
  const getHotelAmenities = (hotel: any): string[] => {
    const possibleAmenities = [
      "swimmingPool",
      "gym",
      "bar",
      "spa",
      "freeWifi",
      "restaurant",
      "coffeShop",
      "movieNights",
      "freeParking",
    ];
    return possibleAmenities
      .filter((amenity) => hotel[amenity] === true)
      .map(mapAmenityToDisplayName);
  };

  // Xử lý tin nhắn từ chatbot
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    // Thêm tin nhắn của người dùng vào danh sách
    setChatMessages((prev) => [...prev, { sender: "user", text: chatInput }]);

    const inputLower = chatInput.toLowerCase();

    // Xử lý các câu hỏi thông thường
    if (
      inputLower.includes("bạn khỏe không") ||
      inputLower.includes("bạn thế nào")
    ) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Mình là AI nên luôn khỏe, cảm ơn bạn đã hỏi! Bạn cần tìm khách sạn nào hôm nay?",
        },
      ]);
      setChatInput("");
      return;
    }

    if (inputLower.includes("hôm nay thời tiết thế nào")) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Mình không có thông tin thời tiết thời gian thực, nhưng nếu bạn cho mình biết khu vực, mình có thể gợi ý khách sạn phù hợp nhé! Bạn muốn tìm ở đâu?",
        },
      ]);
      setChatInput("");
      return;
    }

    if (inputLower.includes("cảm ơn") || inputLower.includes("thanks")) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Không có gì, mình rất vui được giúp bạn! Bạn cần tìm thêm khách sạn nào không?",
        },
      ]);
      setChatInput("");
      return;
    }

    // Phân tích yêu cầu tìm khách sạn
    let params: Record<string, string> = {};
    let priceMin: number | null = null;
    let priceMax: number | null = null;
    let userAmenities: string[] = []; // Tiện ích người dùng yêu cầu trực tiếp
    let suggestedAmenities: string[] = []; // Tiện ích gợi ý từ cảm xúc
    let descriptionKeywords: string[] = chatContext.descriptionKeywords || [];
    let minRating: number | null = chatContext.minRating || null;
    let checkIn: Date | undefined = chatContext.checkIn;
    let checkOut: Date | undefined = chatContext.checkOut;

    // Bước 1: Phân tích cảm xúc và gợi ý dựa trên cảm xúc
    const mood = detectMood(chatInput);
    if (mood) {
      setChatContext((prev) => ({ ...prev, mood }));
      const moodSuggestions = getMoodBasedSuggestion(mood);
      suggestedAmenities = [...new Set(moodSuggestions.amenities)];
      descriptionKeywords = [
        ...new Set([
          ...descriptionKeywords,
          ...moodSuggestions.descriptionKeywords,
        ]),
      ];
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Mình thấy bạn đang muốn tìm một không gian ${getMoodDisplayName(
            mood
          )}. Mình sẽ gợi ý một số khách sạn phù hợp nhé!`,
        },
      ]);
    }

    // Bước 2: So sánh thành phố từ câu hỏi với database
    const detectedCity = await detectCityFromInput(chatInput);
    if (detectedCity) {
      params.city = detectedCity;
      setChatContext((prev) => ({ ...prev, city: detectedCity }));
    } else if (chatContext.city) {
      params.city = chatContext.city;
    } else if (inputLower.includes("việt nam")) {
      params.country = "Việt Nam";
      setChatContext((prev) => ({ ...prev, country: "Việt Nam" }));
    } else if (inputLower.includes("gần trung tâm")) {
      params.locationDescription = "trung tâm";
      setChatContext((prev) => ({ ...prev, locationDescription: "trung tâm" }));
    }

    // Trích xuất giá
    if (inputLower.includes("dưới 1 triệu")) {
      priceMax = 1000000;
      setChatContext((prev) => ({ ...prev, priceMax: 1000000 }));
    } else if (inputLower.includes("dưới 2 triệu")) {
      priceMax = 2000000;
      setChatContext((prev) => ({ ...prev, priceMax: 2000000 }));
    } else if (inputLower.match(/từ (\d+) đến (\d+) triệu/)) {
      const match = inputLower.match(/từ (\d+) đến (\d+) triệu/);
      priceMin = parseInt(match![1]) * 1000000;
      priceMax = parseInt(match![2]) * 1000000;
      setChatContext((prev) => ({ ...prev, priceMin, priceMax }));
    } else if (chatContext.priceMax) {
      priceMax = chatContext.priceMax;
    }

    // Trích xuất tiện ích người dùng yêu cầu trực tiếp
    if (inputLower.includes("hồ bơi")) {
      userAmenities.push("swimmingPool");
    }
    if (inputLower.includes("spa")) {
      userAmenities.push("spa");
    }
    if (inputLower.includes("phòng gym")) {
      userAmenities.push("gym");
    }
    if (inputLower.includes("quầy bar")) {
      userAmenities.push("bar");
    }
    if (inputLower.includes("wifi miễn phí")) {
      userAmenities.push("freeWifi");
    }
    if (inputLower.includes("nhà hàng")) {
      userAmenities.push("restaurant");
    }
    if (inputLower.includes("quán cà phê")) {
      userAmenities.push("coffeShop");
    }
    if (inputLower.includes("chiếu phim")) {
      userAmenities.push("movieNights");
    }
    if (inputLower.includes("bãi đỗ xe")) {
      userAmenities.push("freeParking");
    }

    // Trích xuất yêu cầu đặc biệt (description)
    if (inputLower.includes("sang trọng")) {
      descriptionKeywords = [...descriptionKeywords, "sang trọng", "luxury"];
    }
    if (inputLower.includes("yên tĩnh")) {
      descriptionKeywords = [...descriptionKeywords, "yên tĩnh", "bình yên"];
      userAmenities.push("spa");
    }
    if (inputLower.includes("cho gia đình")) {
      userAmenities.push("swimmingPool", "movieNights");
    }

    // Cập nhật chatContext với tiện ích người dùng và tiện ích gợi ý
    setChatContext((prev) => ({
      ...prev,
      userAmenities: [...new Set(userAmenities)],
      suggestedAmenities: [...new Set(suggestedAmenities)],
      descriptionKeywords,
    }));

    // Trích xuất đánh giá
    if (inputLower.includes("trên 4 sao")) {
      minRating = 4;
      setChatContext((prev) => ({ ...prev, minRating }));
    } else if (inputLower.includes("được đánh giá cao")) {
      minRating = 4.5;
      setChatContext((prev) => ({ ...prev, minRating }));
    }

    // Trích xuất thời gian đặt phòng
    const dateMatch = inputLower.match(/vào ngày (\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const year = new Date().getFullYear();
      checkIn = new Date(year, month, day);
      setChatContext((prev) => ({ ...prev, checkIn }));
    }
    const durationMatch = inputLower.match(/cho (\d+) ngày/);
    if (durationMatch && checkIn) {
      const days = parseInt(durationMatch[1]);
      checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + days);
      setChatContext((prev) => ({ ...prev, checkOut }));
    }

    // Nếu yêu cầu không rõ ràng, hỏi lại
    if (
      (inputLower.includes("tìm khách sạn") ||
        inputLower.includes("khách sạn nào")) &&
      !params.city &&
      !params.country &&
      !priceMin &&
      !priceMax &&
      userAmenities.length === 0 &&
      descriptionKeywords.length === 0
    ) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Bạn muốn khách sạn ở khu vực nào? Bạn có yêu cầu về giá, tiện ích, hoặc thời gian đặt phòng không? (Ví dụ: Tôi muốn ở Đà Nẵng, có spa và gym)",
        },
      ]);
      setChatInput("");
      return;
    }

    // Gọi API để lấy kết quả
    const hotelsData = await fetchHotels(params);

    // Lọc dữ liệu theo các tiêu chí nâng cao
    let filteredHotels = hotelsData;

    // Bước 1: Lọc khách sạn dựa trên tiện ích người dùng yêu cầu trực tiếp
    if (userAmenities.length > 0) {
      filteredHotels = hotelsData.filter((hotel: any) => {
        return userAmenities.every(
          (amenity: string) => hotel[amenity] === true
        );
      });
    }

    // Bước 2: Nếu tìm thấy khách sạn thỏa mãn userAmenities, lọc thêm dựa trên suggestedAmenities
    let finalHotels: any[] = [];
    let alternativeHotels: any[] = [];
    if (filteredHotels.length > 0 && suggestedAmenities.length > 0) {
      // Lọc khách sạn có thêm tiện ích gợi ý
      finalHotels = filteredHotels.filter((hotel: any) => {
        return suggestedAmenities.every(
          (amenity: string) => hotel[amenity] === true
        );
      });

      // Nếu không tìm thấy khách sạn có tất cả suggestedAmenities, tìm khách sạn có ít nhất một tiện ích gợi ý
      if (finalHotels.length === 0) {
        alternativeHotels = filteredHotels.filter((hotel: any) => {
          return suggestedAmenities.some(
            (amenity: string) => hotel[amenity] === true
          );
        });
      }
    } else {
      finalHotels = filteredHotels; // Nếu không có suggestedAmenities, giữ nguyên kết quả từ userAmenities
    }

    // Lọc theo giá
    if (priceMin || priceMax) {
      const filterByPrice = (hotelList: any[]) =>
        hotelList
          .map((hotel: any) => {
            const availableRooms = hotel.rooms.filter((room: any) => {
              const price = room.roomPrice;
              if (priceMin && priceMax) {
                return price >= priceMin && price <= priceMax;
              } else if (priceMax) {
                return price <= priceMax;
              } else if (priceMin) {
                return price >= priceMin;
              }
              return true;
            });
            if (availableRooms.length > 0) {
              return { ...hotel, rooms: availableRooms };
            }
            return null;
          })
          .filter((hotel: any) => hotel !== null);

      finalHotels = filterByPrice(finalHotels);
      alternativeHotels = filterByPrice(alternativeHotels);
    }

    // Lọc theo đánh giá
    if (minRating) {
      const filterByRating = (hotelList: any[]) =>
        hotelList.filter((hotel: any) => {
          const avgRating =
            hotel.reviews.length > 0
              ? hotel.reviews.reduce(
                  (sum: number, review: any) => sum + review.rating,
                  0
                ) / hotel.reviews.length
              : 0;
          return avgRating >= minRating;
        });

      finalHotels = filterByRating(finalHotels);
      alternativeHotels = filterByRating(alternativeHotels);
    }

    // Lọc theo phòng trống (nếu có thời gian đặt phòng)
    if (checkIn && checkOut) {
      const filterByAvailability = (hotelList: any[]) =>
        hotelList
          .map((hotel: any) => {
            const availableRooms = hotel.rooms.filter((room: any) => {
              const bookings = room.bookings || [];
              const isRoomBooked = bookings.some((booking: any) => {
                const bookingStart = new Date(booking.startDate);
                const bookingEnd = new Date(booking.endDate);
                return (
                  (checkIn >= bookingStart && checkIn <= bookingEnd) ||
                  (checkOut >= bookingStart && checkOut <= bookingEnd) ||
                  (checkIn <= bookingStart && checkOut >= bookingEnd)
                );
              });
              return !isRoomBooked;
            });
            if (availableRooms.length > 0) {
              return { ...hotel, rooms: availableRooms };
            }
            return null;
          })
          .filter((hotel: any) => hotel !== null);

      finalHotels = filterByAvailability(finalHotels);
      alternativeHotels = filterByAvailability(alternativeHotels);
    }

    // Tạo phản hồi từ bot
    if (finalHotels.length > 0) {
      let responseText = "Mình tìm thấy một vài khách sạn phù hợp cho bạn đây:";
      const allAmenities = [...userAmenities, ...suggestedAmenities];
      if (allAmenities.length > 0) {
        responseText += ` (Có ${allAmenities
          .map(mapAmenityToDisplayName)
          .join(" và ")})`;
      }
      if (checkIn && checkOut) {
        const nights = Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
        );
        responseText += ` (Đặt phòng từ ${checkIn.toLocaleDateString()} đến ${checkOut.toLocaleDateString()}, ${nights} đêm)`;
      }
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: responseText,
          hotels: finalHotels,
        },
      ]);
    } else if (filteredHotels.length > 0) {
      // Nếu không thỏa mãn suggestedAmenities nhưng vẫn thỏa mãn userAmenities
      let responseText =
        "Mình tìm thấy một vài khách sạn phù hợp với yêu cầu của bạn đây:";
      if (userAmenities.length > 0) {
        responseText += ` (Có ${userAmenities
          .map(mapAmenityToDisplayName)
          .join(" và ")})`;
      }

      if (alternativeHotels.length > 0) {
        responseText += ` Dưới đây là một số khách sạn có ít nhất một trong các tiện ích bổ sung (${suggestedAmenities
          .map(mapAmenityToDisplayName)
          .join(" hoặc ")}):`;
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: responseText,
            hotels: alternativeHotels,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: responseText,
            hotels: filteredHotels,
          },
        ]);
      }
    } else {
      let errorMessage =
        "Rất tiếc, mình không tìm thấy khách sạn nào phù hợp với yêu cầu của bạn.";
      if (userAmenities.length > 0) {
        errorMessage += ` Không có khách sạn nào có đủ ${userAmenities
          .map(mapAmenityToDisplayName)
          .join(" và ")}.`;
      }
      errorMessage +=
        " Bạn có muốn thử yêu cầu khác không? (Ví dụ: thay đổi khu vực, mức giá, hoặc tiện ích)";
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errorMessage,
        },
      ]);
    }

    // Xóa ô nhập liệu
    setChatInput("");
  };

  // Gọi API khi shouldFetch là true
  useEffect(() => {
    if (shouldFetch) {
      fetchHotels().then((data) => setHotels(data));
    }
  }, [shouldFetch, fetchHotels]);

  // Gọi API lần đầu khi trang tải
  useEffect(() => {
    setShouldFetch(true);
  }, []);

  // Cập nhật tempDate khi người dùng chọn ngày
  const handleTempDateChange = (newDate: DateRange | undefined) => {
    setTempDate(newDate);
  };

  // Áp dụng lựa chọn ngày
  const handleApplyDate = () => {
    setDate(tempDate);

    const newParams = new URLSearchParams(searchParams.toString());
    if (tempDate?.from) {
      newParams.set("startDate", tempDate.from.toISOString());
    } else {
      newParams.delete("startDate");
    }
    if (tempDate?.to) {
      newParams.set("endDate", tempDate.to.toISOString());
    } else {
      newParams.delete("endDate");
    }
    newParams.set("page", "1");

    router.push(`/?${newParams.toString()}`, { scroll: false });
    setShouldFetch(true);
  };

  // Khôi phục lựa chọn ngày
  const handleResetDate = () => {
    setTempDate(undefined);
    setDate(undefined);

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("startDate");
    newParams.delete("endDate");
    newParams.set("page", "1");

    router.push(`/?${newParams.toString()}`, { scroll: false });
    setShouldFetch(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-opacity-90 mx-auto mb-6 shadow-lg"></div>
          <p className="text-gray-700 text-xl font-medium animate-pulse">
            Đang tải danh sách khách sạn...
          </p>
        </div>
      </div>
    );
  }

  if (!hotels || hotels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-8 shadow-lg">
        <Hotel className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
          Không tìm thấy khách sạn phù hợp
        </h3>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Hãy thử thay đổi khoảng thời gian hoặc trò chuyện với AI để tìm kiếm
          khách sạn phù hợp hơn nhé!
        </p>
        <Link href="/">
          <Button
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-800 font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-md"
          >
            Quay lại trang chủ
          </Button>
        </Link>
      </div>
    );
  }

  const nextPage = hotels.length >= 6 ? currentPage + 1 : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-gray-50 min-h-screen">
      <div className="space-y-10">
        {/* Phần chọn thời gian */}
        <div className="flex justify-center mt-6">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center mb-3">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-800">
                Chọn thời gian
              </h3>
            </div>
            <DateRangePicker
              date={tempDate}
              setDate={handleTempDateChange}
              disabledDates={[]}
              className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 shadow-sm"
            />
            <div className="flex justify-center gap-3 mt-3">
              <Button
                onClick={handleApplyDate}
                disabled={!tempDate?.from || !tempDate?.to}
                className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
              >
                Áp dụng
              </Button>
              <Button
                variant="outline"
                onClick={handleResetDate}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-800 font-semibold py-2 px-4 rounded-full transition-all duration-300 shadow-md"
              >
                Khôi phục
              </Button>
            </div>
          </div>
        </div>

        <HotelList hotels={hotels} />

        {nextPage && (
          <div className="flex justify-center mt-10">
            <Link
              href={`/?${new URLSearchParams({
                ...Object.fromEntries(searchParams),
                page: nextPage.toString(),
                ...(date?.from && { startDate: date.from.toISOString() }),
                ...(date?.to && { endDate: date.to.toISOString() }),
              })}`}
              onClick={() => setShouldFetch(true)}
            >
              <Button
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-700 hover:text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 text-lg shadow-lg"
              >
                Xem thêm khách sạn
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Nút mở chatbot */}
      <button
        onClick={() => setChatOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-300 ${
          chatOpen ? "hidden" : "block"
        }`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Cửa sổ chatbot */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl flex flex-col">
          {/* Header của chatbot */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-t-xl">
            <h3 className="text-lg font-semibold">Chat với AI</h3>
            <button onClick={() => setChatOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Khu vực hiển thị tin nhắn */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 ${
                  msg.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                {msg.text && (
                  <span
                    className={`inline-block p-3 rounded-lg shadow-sm ${
                      msg.sender === "user"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-800"
                    }`}
                  >
                    {msg.text.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </span>
                )}
                {msg.hotels && (
                  <div className="space-y-3">
                    {msg.hotels.map((hotel: any) => {
                      const avgRating =
                        hotel.reviews.length > 0
                          ? (
                              hotel.reviews.reduce(
                                (sum: number, review: any) =>
                                  sum + review.rating,
                                0
                              ) / hotel.reviews.length
                            ).toFixed(1)
                          : null;
                      const amenitiesList = getHotelAmenities(hotel)
                        .slice(0, 3)
                        .join(", ");
                      return (
                        <div
                          key={hotel.id}
                          className="bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                        >
                          <h4 className="text-sm font-semibold text-gray-800">
                            {hotel.title}
                          </h4>
                          <p className="text-xs text-gray-600">
                            Vị trí: {hotel.city}
                          </p>
                          <p className="text-xs text-gray-600">
                            Giá từ: {hotel.minPrice.toLocaleString()} VNĐ
                          </p>
                          {avgRating && (
                            <p className="text-xs text-gray-600 flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 mr-1" />
                              Đánh giá: {avgRating}
                            </p>
                          )}
                          {amenitiesList && (
                            <p className="text-xs text-gray-600">
                              Tiện ích: {amenitiesList}
                            </p>
                          )}
                          <Link href={`/hotel-details/${hotel.id}`}>
                            <Button className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded-full">
                              Xem chi tiết
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Ô nhập liệu và nút gửi */}
          <div className="p-4 border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
              placeholder="Nhập yêu cầu của bạn..."
              className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-700"
            />
            <button
              onClick={handleChatSubmit}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
