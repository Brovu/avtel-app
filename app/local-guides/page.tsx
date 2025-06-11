"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Container from "@/components/Container";
import { toast } from "sonner";
import Image from "next/image";

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
}

const LocalGuidesPage = () => {
  const router = useRouter();
  const [guides, setGuides] = useState<LocalGuide[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<LocalGuide[]>([]);
  const [searchCity, setSearchCity] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Lấy danh sách hướng dẫn viên từ API
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await fetch("/api/local-guide", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(
            `Failed to fetch guides: ${response.status} - ${errorData}`
          );
        }

        const data = await response.json();
        setGuides(data);
        setFilteredGuides(data);
      } catch (error) {
        console.error("Error fetching guides:", error);
        toast.error("Lỗi khi tải danh sách hướng dẫn viên");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuides();
  }, []);

  // Lọc hướng dẫn viên theo thành phố
  useEffect(() => {
    if (searchCity.trim() === "") {
      setFilteredGuides(guides);
    } else {
      const filtered = guides.filter((guide) =>
        guide.city.toLowerCase().includes(searchCity.toLowerCase())
      );
      setFilteredGuides(filtered);
    }
  }, [searchCity, guides]);

  // Xử lý khi nhấn vào một hướng dẫn viên để xem chi tiết
  const handleViewDetails = (guideId: string) => {
    router.push(`/local-guide/${guideId}`);
  };

  return (
    <Container>
      <div className="py-10 px-6 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl animate-fade-in">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white animate-pulse-slow">
          Danh sách hướng dẫn viên địa phương
        </h1>

        {/* Thanh tìm kiếm */}
        <div className="max-w-xl mx-auto mb-10">
          <Input
            placeholder="Tìm kiếm theo thành phố (ví dụ: Ho Chi Minh City)"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="w-full px-4 py-2 border-2 border-blue-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Hiển thị danh sách hướng dẫn viên */}
        {isLoading ? (
          <p className="text-center text-lg text-gray-600 dark:text-gray-400 animate-pulse">
            Đang tải danh sách hướng dẫn viên...
          </p>
        ) : filteredGuides.length === 0 ? (
          <p className="text-center text-lg text-gray-600 dark:text-gray-400">
            Không tìm thấy hướng dẫn viên nào phù hợp.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-700"
              >
                <Image
                  src={guide.profileImage}
                  alt={guide.name}
                  width={400}
                  height={200}
                  className="w-full h-56 object-cover transition-opacity duration-300 hover:opacity-90"
                />
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-300 hover:text-blue-600 dark:hover:text-blue-400">
                    {guide.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 transition-opacity duration-300 hover:opacity-100">
                    {guide.bio}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Khu vực:
                    </span>{" "}
                    {guide.city}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Ngôn ngữ:
                    </span>{" "}
                    {guide.languages.join(", ")}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Chuyên môn:
                    </span>{" "}
                    {guide.specialties.join(", ")}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 mb-5">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Giá/ngày:
                    </span>{" "}
                    {guide.pricePerDay.toLocaleString()} VND
                  </p>
                  <Button
                    onClick={() => handleViewDetails(guide.id)}
                    className="cursor-pointer w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default LocalGuidesPage;
