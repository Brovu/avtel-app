"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Container from "@/components/Container";
import { UploadButton } from "@/components/Uploadthing";
import Image from "next/image";
import useLocation from "@/hooks/useLocation";
import { Country } from "country-state-city";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languagesOptions = [
  "English",
  "Vietnamese",
  "French",
  "Chinese",
  "Japanese",
];
const specialtiesOptions = [
  "Cultural Tours",
  "Food Tours",
  "Adventure Tours",
  "Historical Tours",
  "Nature Tours",
];

const RegisterLocalGuidePage = () => {
  const router = useRouter();
  const { userId } = useAuth();
  const { getCountryStates, getStateCities } = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    languages: [] as string[],
    specialties: [] as string[],
    pricePerDay: "",
    city: "",
    phoneNumber: "",
    email: "",
    profileImage: "",
  });

  const [imageData, setImageData] = useState<{
    url: string | undefined;
    fileKey: string | undefined;
  }>({
    url: undefined,
    fileKey: undefined,
  });

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);

  if (!userId) {
    router.push("/sign-in");
    return null;
  }

  const updateCityField = () => {
    const countryName =
      Country.getAllCountries().find((c) => c.isoCode === selectedCountry)
        ?.name || "";
    const stateName =
      selectedCountry && selectedState
        ? getCountryStates(selectedCountry).find(
            (s) => s.isoCode === selectedState
          )?.name || ""
        : "";
    const cityName = selectedCity || "";
    const locationParts = [cityName, stateName, countryName].filter(Boolean);
    const locationString = locationParts.join(", ");
    setFormData((prev) => ({ ...prev, city: locationString }));
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedState("");
    setSelectedCity("");
    updateCityField();
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedCity("");
    updateCityField();
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    updateCityField();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (
    option: string,
    field: "languages" | "specialties"
  ) => {
    setFormData((prev) => {
      const currentValues = prev[field];
      if (currentValues.includes(option)) {
        return {
          ...prev,
          [field]: currentValues.filter((item) => item !== option),
        };
      }
      return { ...prev, [field]: [...currentValues, option] };
    });
  };

  const handleDeleteImage = async () => {
    if (!imageData.fileKey) {
      setImageData({ url: undefined, fileKey: undefined });
      setFormData((prev) => ({ ...prev, profileImage: "" }));
      return;
    }

    try {
      const response = await fetch("/api/uploadthing/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey: imageData.fileKey }),
      });

      if (response.ok) {
        toast.success("Xóa ảnh thành công!");
        setImageData({ url: undefined, fileKey: undefined });
        setFormData((prev) => ({ ...prev, profileImage: "" }));
      } else {
        throw new Error("Failed to delete image on UploadThing");
      }
    } catch (error: unknown) {
      console.error("Delete error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa ảnh";
      toast.error("Xóa ảnh thất bại: " + errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.profileImage) {
      toast.error("Vui lòng tải lên ảnh đại diện!");
      setIsLoading(false);
      return;
    }

    if (!formData.city) {
      toast.error("Vui lòng chọn vị trí hoạt động!");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/local-guide/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Đăng ký làm hướng dẫn viên thành công!");
        router.push("/");
      } else {
        toast.error(data.error || "Lỗi khi đăng ký làm hướng dẫn viên");
      }
    } catch (error) {
      console.error("Error registering local guide:", error);
      toast.error("Lỗi khi đăng ký làm hướng dẫn viên");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <div className="max-w-2xl mx-auto py-10 px-6 bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-white">
          Đăng ký làm hướng dẫn viên địa phương
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block mt-2"
              >
                Tên hiển thị
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nhập tên của bạn"
                required
                className="w-full border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <Label
                htmlFor="bio"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Giới thiệu bản thân
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Mô tả về bạn và kinh nghiệm của bạn"
                required
                className="w-full border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Ngôn ngữ hỗ trợ
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {languagesOptions.map((language) => (
                  <div
                    key={language}
                    className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <Checkbox
                      id={`language-${language}`}
                      checked={formData.languages.includes(language)}
                      onCheckedChange={() =>
                        handleCheckboxChange(language, "languages")
                      }
                      className="rounded"
                    />
                    <Label
                      htmlFor={`language-${language}`}
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      {language}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Chuyên môn
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {specialtiesOptions.map((specialty) => (
                  <div
                    key={specialty}
                    className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <Checkbox
                      id={`specialty-${specialty}`}
                      checked={formData.specialties.includes(specialty)}
                      onCheckedChange={() =>
                        handleCheckboxChange(specialty, "specialties")
                      }
                      className="rounded"
                    />
                    <Label
                      htmlFor={`specialty-${specialty}`}
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      {specialty}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label
                htmlFor="pricePerDay"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Giá theo ngày (VND)
              </Label>
              <Input
                id="pricePerDay"
                name="pricePerDay"
                type="number"
                value={formData.pricePerDay}
                onChange={handleInputChange}
                placeholder="Nhập giá theo ngày"
                required
                className="w-full border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Quốc gia hoạt động
              </Label>
              <Select
                onValueChange={handleCountryChange}
                value={selectedCountry}
                className="w-full"
              >
                <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                  <SelectValue placeholder="Chọn quốc gia" />
                </SelectTrigger>
                <SelectContent>
                  {Country.getAllCountries().map((country) => (
                    <SelectItem
                      key={country.isoCode}
                      value={country.isoCode}
                      className="hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Tỉnh/Thành hoạt động
              </Label>
              <Select
                onValueChange={handleStateChange}
                value={selectedState}
                disabled={!selectedCountry}
                className="w-full"
              >
                <SelectTrigger
                  className="w-full border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={!selectedCountry}
                >
                  <SelectValue placeholder="Chọn tỉnh/thành" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCountry &&
                    getCountryStates(selectedCountry).map((state) => (
                      <SelectItem
                        key={state.isoCode}
                        value={state.isoCode}
                        className="hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        {state.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Quận/Huyện hoạt động
              </Label>
              <Select
                onValueChange={handleCityChange}
                value={selectedCity}
                disabled={!selectedState}
                className="w-full"
              >
                <SelectTrigger
                  className="w-full border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={!selectedState}
                >
                  <SelectValue placeholder="Chọn quận/huyện" />
                </SelectTrigger>
                <SelectContent>
                  {selectedState &&
                    getStateCities(selectedCountry, selectedState).map(
                      (city) => (
                        <SelectItem
                          key={city.name}
                          value={city.name}
                          className="hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          {city.name}
                        </SelectItem>
                      )
                    )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="phoneNumber"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Số điện thoại
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
                className="w-full border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
              >
                Email liên lạc
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập email liên lạc"
                className="w-full border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Ảnh đại diện
              </Label>
              <div className="flex items-center gap-6">
                {imageData.url ? (
                  <div className="relative">
                    <Image
                      src={imageData.url}
                      alt="Profile Image"
                      width={200}
                      height={200}
                      className="object-cover rounded-xl shadow-md"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 cursor-pointer hover:bg-red-600 transition-all duration-200"
                      onClick={handleDeleteImage}
                    >
                      Xóa
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center max-w-[400px] p-6 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl bg-gray-50 dark:bg-gray-800 hover:border-blue-500 transition-all duration-200">
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res && res[0]) {
                          const imageUrl = res[0].url;
                          const fileKey = res[0].key;
                          setImageData({ url: imageUrl, fileKey });
                          setFormData((prev) => ({
                            ...prev,
                            profileImage: imageUrl,
                          }));
                          toast.success("Tải ảnh lên thành công!");
                        }
                      }}
                      onUploadError={(error: Error) => {
                        console.error("Upload error:", error);
                        toast.error("Tải ảnh lên thất bại: " + error.message);
                      }}
                      className="ut-button:bg-blue-600 ut-button:text-white ut-button:rounded-lg ut-button:px-6 ut-button:py-3 ut-button:hover:bg-blue-700 ut-button:transition-all ut-button:duration-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </form>
      </div>
    </Container>
  );
};

export default RegisterLocalGuidePage;
