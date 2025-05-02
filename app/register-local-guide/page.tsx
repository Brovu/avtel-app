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
      <div className="max-w-2xl mx-auto py-10 px-6 bg-white rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
          Đăng ký làm hướng dẫn viên địa phương
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Tên hiển thị</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nhập tên của bạn"
              required
            />
          </div>

          <div>
            <Label htmlFor="bio">Giới thiệu bản thân</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Mô tả về bạn và kinh nghiệm của bạn"
              required
            />
          </div>

          <div>
            <Label>Ngôn ngữ hỗ trợ</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {languagesOptions.map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox
                    id={`language-${language}`}
                    checked={formData.languages.includes(language)}
                    onCheckedChange={() =>
                      handleCheckboxChange(language, "languages")
                    }
                  />
                  <Label htmlFor={`language-${language}`}>{language}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Chuyên môn</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {specialtiesOptions.map((specialty) => (
                <div key={specialty} className="flex items-center space-x-2">
                  <Checkbox
                    id={`specialty-${specialty}`}
                    checked={formData.specialties.includes(specialty)}
                    onCheckedChange={() =>
                      handleCheckboxChange(specialty, "specialties")
                    }
                  />
                  <Label htmlFor={`specialty-${specialty}`}>{specialty}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="pricePerDay">Giá theo ngày (VND)</Label>
            <Input
              id="pricePerDay"
              name="pricePerDay"
              type="number"
              value={formData.pricePerDay}
              onChange={handleInputChange}
              placeholder="Nhập giá theo ngày"
              required
            />
          </div>

          <div>
            <Label>Quốc gia hoạt động</Label>
            <Select onValueChange={handleCountryChange} value={selectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn quốc gia" />
              </SelectTrigger>
              <SelectContent>
                {Country.getAllCountries().map((country) => (
                  <SelectItem key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tỉnh/Thành hoạt động</Label>
            <Select
              onValueChange={handleStateChange}
              value={selectedState}
              disabled={!selectedCountry}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn tỉnh/thành" />
              </SelectTrigger>
              <SelectContent>
                {selectedCountry &&
                  getCountryStates(selectedCountry).map((state) => (
                    <SelectItem key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quận/Huyện hoạt động</Label>
            <Select
              onValueChange={handleCityChange}
              value={selectedCity}
              disabled={!selectedState}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn quận/huyện" />
              </SelectTrigger>
              <SelectContent>
                {selectedState &&
                  getStateCities(selectedCountry, selectedState).map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phoneNumber">Số điện thoại</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div>
            <Label htmlFor="email">Email liên lạc</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Nhập email liên lạc"
            />
          </div>

          <div>
            <Label>Ảnh đại diện</Label>
            <div className="flex items-center gap-4">
              {imageData.url ? (
                <div className="relative">
                  <Image
                    src={imageData.url}
                    alt="Profile Image"
                    width={200}
                    height={200}
                    className="object-cover rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 cursor-pointer"
                    onClick={handleDeleteImage}
                  >
                    Xóa
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-[400px] p-12 border-2 border-dashed border-primary/50 rounded mt-4">
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
                    className="ut-button:bg-blue-500 ut-button:text-white ut-button:rounded-md ut-button:px-4 ut-button:py-2 ut-button:hover:bg-blue-600 ut-button:transition-all ut-button:duration-200"
                  />
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </form>
      </div>
    </Container>
  );
};

export default RegisterLocalGuidePage;
