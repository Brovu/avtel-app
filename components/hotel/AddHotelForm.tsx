"use client";

import * as z from "zod";
import { Hotel, Room } from "@prisma/client";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useState, useEffect } from "react";
import { UploadButton } from "../Uploadthing";
import Image from "next/image";
import { toast } from "sonner";
import useLocation from "@/hooks/useLocation";
import { Country } from "country-state-city";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  PlusCircle,
  Terminal,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import axios from "axios";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import AddRoomForm from "../room/AddRoomForm";
import { Separator } from "../ui/separator";
import RoomCard from "../room/RoomCard";

interface AddHotelFormProps {
  hotel: HotelWithRooms | null;
}

export type HotelWithRooms = Hotel & {
  rooms: Room[];
};

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Tên khách sạn phải dài ít nhất 3 ký tự nha!",
  }),
  description: z.string().min(10, {
    message: "Mô tả phải dài ít nhất 10 ký tự để khách hiểu rõ hơn nè!",
  }),
  image: z.string().min(1, {
    message: "Hình ảnh là bắt buộc đó nha!",
  }),
  country: z.string().min(1, {
    message: "Quốc gia là bắt buộc nha bạn ơi!",
  }),
  state: z.string().optional(),
  city: z.string().optional(),
  locationDescription: z.string().min(10, {
    message: "Mô tả vị trí phải dài ít nhất 10 ký tự nha!",
  }),
  gym: z.boolean().optional(),
  spa: z.boolean().optional(),
  bar: z.boolean().optional(),
  laundry: z.boolean().optional(),
  restaurant: z.boolean().optional(),
  shopping: z.boolean().optional(),
  freeParking: z.boolean().optional(),
  bikeRental: z.boolean().optional(),
  freeWifi: z.boolean().optional(),
  movieNights: z.boolean().optional(),
  swimmingPool: z.boolean().optional(),
  coffeShop: z.boolean().optional(),
});

const AddHotelForm = ({ hotel }: AddHotelFormProps) => {
  const [imageData, setImageData] = useState<{
    url: string | undefined;
    fileKey: string | undefined;
  }>({
    url: hotel?.image,
    fileKey: undefined,
  });

  const [selectedCountry, setSelectedCountry] = useState<string>(
    hotel?.country || ""
  );
  const [selectedState, setSelectedState] = useState<string>(
    hotel?.state || ""
  );
  const [selectedCity, setSelectedCity] = useState<string>(hotel?.city || "");
  const [isLoading, setIsLoading] = useState(false);
  const [createdHotel, setCreatedHotel] = useState<HotelWithRooms | null>(null);
  const [isHotelDeleting, setIsHotelDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState<{
    lat?: number;
    lng?: number;
  }>({});

  const { getCountryByCode, getStateByCode, getCountryStates, getStateCities } =
    useLocation();
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: hotel
      ? {
          title: hotel.title,
          description: hotel.description,
          image: hotel.image,
          country: hotel.country,
          state: hotel.state,
          city: hotel.city,
          locationDescription: hotel.locationDescription,
          gym: hotel.gym,
          spa: hotel.spa,
          bar: hotel.bar,
          laundry: hotel.laundry,
          restaurant: hotel.restaurant,
          shopping: hotel.shopping,
          freeParking: hotel.freeParking,
          bikeRental: hotel.bikeRental,
          freeWifi: hotel.freeWifi,
          movieNights: hotel.movieNights,
          swimmingPool: hotel.swimmingPool,
          coffeShop: hotel.coffeShop,
        }
      : {
          title: "",
          description: "",
          image: "",
          country: "",
          state: "",
          city: "",
          locationDescription: "",
          gym: false,
          spa: false,
          bar: false,
          laundry: false,
          restaurant: false,
          shopping: false,
          freeParking: false,
          bikeRental: false,
          freeWifi: false,
          movieNights: false,
          swimmingPool: false,
          coffeShop: false,
        },
  });

  useEffect(() => {
    form.setValue("country", selectedCountry);
  }, [selectedCountry, form]);

  useEffect(() => {
    form.setValue("state", selectedState);
  }, [selectedState, form]);

  useEffect(() => {
    form.setValue("city", selectedCity);
  }, [selectedCity, form]);

  // Hàm gọi Nominatim API để lấy tọa độ từ địa chỉ
  const getCoordinatesFromAddress = async (
    address: string
  ): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`,
        {
          headers: {
            "User-Agent": "HotelApp/1.0 (roy772003@gmail.com)", // Thay bằng email của bạn
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        return { lat: parseFloat(lat), lng: parseFloat(lon) };
      } else {
        console.error("Geocoding failed: No results found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return null;
    }
  };

  // Delay để tránh gọi API quá nhanh (giới hạn 1 yêu cầu/giây của Nominatim)
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Lấy tọa độ tạm thời mỗi khi địa chỉ thay đổi
  useEffect(() => {
    const fetchCoordinates = async () => {
      await delay(1000); // Đợi 1 giây để tránh vượt giới hạn Nominatim
      const countryName =
        Country.getAllCountries().find(
          (c) => c.isoCode === form.getValues("country")
        )?.name || form.getValues("country");
      const stateName =
        form.getValues("state") && form.getValues("country")
          ? getCountryStates(form.getValues("country")).find(
              (s) => s.isoCode === form.getValues("state")
            )?.name || form.getValues("state")
          : "";
      const addressParts = [
        form.getValues("locationDescription"),
        form.getValues("city"),
        stateName,
        countryName,
      ].filter(Boolean);
      const address = addressParts.join(", ");

      if (address) {
        const coordinates = await getCoordinatesFromAddress(address);
        if (coordinates) {
          setTempCoordinates({ lat: coordinates.lat, lng: coordinates.lng });
        } else {
          setTempCoordinates({});
        }
      }
    };

    fetchCoordinates();
  }, [
    form.watch("country"),
    form.watch("state"),
    form.watch("city"),
    form.watch("locationDescription"),
  ]);

  async function handleDeleteImage() {
    if (!imageData.fileKey) {
      setImageData({ url: undefined, fileKey: undefined });
      form.setValue("image", "");
      return;
    }

    try {
      const response = await fetch("/api/uploadthing/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey: imageData.fileKey }),
      });

      if (response.ok) {
        toast.success("Xóa ảnh thành công nha!");
        setImageData({ url: undefined, fileKey: undefined });
        form.setValue("image", "");
      } else {
        throw new Error("Failed to delete image on UploadThing");
      }
    } catch (error: unknown) {
      console.error("Delete error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa ảnh";
      toast.error("Xóa ảnh thất bại rồi: " + errorMessage);
    }
  }

  const handleAddNewHotel = () => {
    setCreatedHotel(null);
    form.reset();
    setImageData({ url: undefined, fileKey: undefined });
    setSelectedCountry("");
    setSelectedState("");
    setSelectedCity("");
    setTempCoordinates({});
  };

  async function handleDeleteHotel(hotel: HotelWithRooms) {
    if (!window.confirm("Bạn có chắc muốn xóa khách sạn này?")) return;
    setIsHotelDeleting(true);

    try {
      if (hotel.image) {
        const imageKey = hotel.image.split("/").pop();
        const imgRes = await axios.post("/api/uploadthing/delete", {
          fileKey: imageKey,
        });
        if (imgRes.status < 200 || imgRes.status >= 300) {
          throw new Error("Xóa ảnh thất bại");
        }
      }

      const res = await axios.delete(`/api/hotel/${hotel.id}`);
      if (res.status >= 200 && res.status < 300) {
        toast.success("Xóa khách sạn thành công!");
        router.push("/hotel/new");
      } else {
        throw { response: res };
      }
    } catch (err: any) {
      console.error("Error deleting hotel:", err);
      const status = err.response?.status;
      if (status === 404) toast.error("Không tìm thấy khách sạn để xóa!");
      else if (status === 401)
        toast.error("Bạn cần đăng nhập để thực hiện hành động này!");
      else if (status === 403)
        toast.error("Bạn không có quyền xóa khách sạn này!");
      else
        toast.error(
          "Xóa khách sạn thất bại: " + (err.message || "Có lỗi xảy ra!")
        );
    } finally {
      setIsHotelDeleting(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    // Tạo địa chỉ từ các trường
    const countryName =
      Country.getAllCountries().find((c) => c.isoCode === values.country)
        ?.name || values.country;
    const stateName =
      values.state && values.country
        ? getCountryStates(values.country).find(
            (s) => s.isoCode === values.state
          )?.name || values.state
        : "";
    const addressParts = [
      values.locationDescription,
      values.city,
      stateName,
      countryName,
    ].filter(Boolean);
    const address = addressParts.join(", ");

    // Lấy tọa độ từ địa chỉ bằng Nominatim
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (address) {
      const coordinates = await getCoordinatesFromAddress(address);
      if (coordinates) {
        latitude = coordinates.lat;
        longitude = coordinates.lng;
      } else {
        toast.warning(
          "Không thể lấy tọa độ từ địa chỉ. Vui lòng kiểm tra lại thông tin."
        );
      }
    }

    // Thêm tọa độ vào dữ liệu gửi lên API
    const dataToSubmit = {
      ...values,
      latitude,
      longitude,
    };

    if (hotel) {
      if (!hotel.id) {
        toast.error("Hotel ID không hợp lệ!");
        setIsLoading(false);
        return;
      }
      axios
        .patch(`/api/hotel/${hotel.id}`, dataToSubmit)
        .then((res) => {
          toast.success("🎉 Khách sạn của bạn đã được cập nhật!");
          router.push(`/hotel/${res.data.id}`);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err);
          if (err.response?.status === 404) {
            toast.error("Không tìm thấy khách sạn để cập nhật!");
          } else if (err.response?.status === 401) {
            toast.error("Bạn cần đăng nhập để thực hiện hành động này!");
          } else {
            toast.error("Có lỗi xảy ra khi cập nhật khách sạn!");
          }
          setIsLoading(false);
        });
    } else {
      axios
        .post("/api/hotel", dataToSubmit)
        .then((res) => {
          toast.success("🎉 Khách sạn của bạn đã được tạo!");
          setCreatedHotel(res.data);
          router.push(`/hotel/${res.data.id}`);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err);
          toast.error("Có lỗi xảy ra khi tạo khách sạn!");
          setIsLoading(false);
        });
    }
  }

  const handleDialogueOpen = () => {
    setOpen((prev) => !prev);
  };

  return (
    <FormProvider {...form}>
      <div className="px-4 py-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {createdHotel || hotel
              ? "Cập nhật khách sạn của bạn nha!"
              : "Thêm khách sạn của bạn vào đi nè!"}
          </h3>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Phần thông tin khách sạn */}
            <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
                Thông tin khách sạn
              </h4>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TÊN KHÁCH SẠN</FormLabel>
                      <FormDescription>
                        Đặt tên khách sạn thật cute nha bạn!
                      </FormDescription>
                      <FormControl>
                        <Input placeholder="Mường Thanh xịn xò..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MÔ TẢ</FormLabel>
                      <FormDescription>
                        Kể cho khách nghe khách sạn bạn có gì đặc biệt nha!
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="Một nơi siêu xịn để nghỉ dưỡng..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>THÊM ẢNH</FormLabel>
                      <FormDescription>
                        Thêm ảnh để khách sạn thêm lung linh nè!
                      </FormDescription>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          {imageData.url ? (
                            <div className="relative">
                              <Image
                                src={imageData.url}
                                alt="Hotel Image"
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
                                    form.setValue("image", imageUrl);
                                    toast.success(
                                      "Tải ảnh lên thành công nha!"
                                    );
                                  }
                                }}
                                onUploadError={(error: Error) => {
                                  console.error("Upload error:", error);
                                  toast.error(
                                    "Tải ảnh lên thất bại rồi: " + error.message
                                  );
                                }}
                                className="ut-button:bg-blue-500 ut-button:text-white ut-button:rounded-md ut-button:px-4 ut-button:py-2 ut-button:hover:bg-blue-600 ut-button:transition-all ut-button:duration-200"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>QUỐC GIA</FormLabel>
                      <FormDescription>
                        Khách sạn của bạn nằm ở quốc gia nào nè?
                      </FormDescription>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            setSelectedCountry(value);
                            field.onChange(value);
                          }}
                          value={selectedCountry}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn quốc gia nha!" />
                          </SelectTrigger>
                          <SelectContent>
                            {Country.getAllCountries().map((country) => (
                              <SelectItem
                                key={country.isoCode}
                                value={country.isoCode}
                              >
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TỈNH/THÀNH</FormLabel>
                      <FormDescription>
                        Tỉnh hoặc thành phố của khách sạn (không bắt buộc nha)
                      </FormDescription>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            setSelectedState(value);
                            field.onChange(value);
                          }}
                          value={selectedState}
                          disabled={!selectedCountry}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tỉnh/thành nha!" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedCountry &&
                              getCountryStates(selectedCountry).map((state) => (
                                <SelectItem
                                  key={state.isoCode}
                                  value={state.isoCode}
                                >
                                  {state.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>QUẬN/HUYỆN</FormLabel>
                      <FormDescription>
                        Quận hoặc huyện (không bắt buộc nha)
                      </FormDescription>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            setSelectedCity(value);
                            field.onChange(value);
                          }}
                          value={selectedCity}
                          disabled={!selectedState}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn quận/huyện nha!" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedState &&
                              getStateCities(
                                selectedCountry,
                                selectedState
                              ).map((city) => (
                                <SelectItem key={city.name} value={city.name}>
                                  {city.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locationDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MÔ TẢ VỊ TRÍ</FormLabel>
                      <FormDescription>
                        Kể chi tiết vị trí khách sạn của bạn đi nào!
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder="Gần bãi biển, cách trung tâm 5 phút..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Hiển thị tọa độ tạm thời */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Tọa độ tự động lấy được:
                  </h4>
                  {tempCoordinates.lat && tempCoordinates.lng ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Kinh độ: {tempCoordinates.lat}, Vĩ độ:{" "}
                      {tempCoordinates.lng}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Chưa lấy được tọa độ. Vui lòng kiểm tra địa chỉ.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Phần tiện ích và danh sách phòng */}
            <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
                Tiện ích
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gym"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="gym"
                        />
                      </FormControl>
                      <FormLabel htmlFor="gym">Gym</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spa"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="spa"
                        />
                      </FormControl>
                      <FormLabel htmlFor="spa">Spa</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bar"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="bar"
                        />
                      </FormControl>
                      <FormLabel htmlFor="bar">Bar</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="laundry"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="laundry"
                        />
                      </FormControl>
                      <FormLabel htmlFor="laundry">Laundry</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="restaurant"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="restaurant"
                        />
                      </FormControl>
                      <FormLabel htmlFor="restaurant">Restaurant</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shopping"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="shopping"
                        />
                      </FormControl>
                      <FormLabel htmlFor="shopping">Shopping</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="freeParking"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="freeParking"
                        />
                      </FormControl>
                      <FormLabel htmlFor="freeParking">Free Parking</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bikeRental"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="bikeRental"
                        />
                      </FormControl>
                      <FormLabel htmlFor="bikeRental">Bike Rental</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="freeWifi"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="freeWifi"
                        />
                      </FormControl>
                      <FormLabel htmlFor="freeWifi">Free WiFi</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="movieNights"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="movieNights"
                        />
                      </FormControl>
                      <FormLabel htmlFor="movieNights">Movie Nights</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="swimmingPool"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="swimmingPool"
                        />
                      </FormControl>
                      <FormLabel htmlFor="swimmingPool">
                        Swimming Pool
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="coffeShop"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="coffeShop"
                        />
                      </FormControl>
                      <FormLabel htmlFor="coffeShop">Coffee Shop</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Phần danh sách phòng */}
              {hotel?.rooms?.length ? (
                <>
                  <Separator className="my-6" />
                  <h3 className="text-lg font-semibold my-4">PHÒNG</h3>
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                    {hotel.rooms.map((room) => (
                      <RoomCard key={room.id} hotel={hotel} room={room} />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Phần thông báo và nút điều khiển */}
          {hotel && !hotel.rooms.length && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <Alert className="bg-indigo-600 text-white">
                <Terminal className="h-4 w-4 stroke-white" />
                <AlertTitle>Gần xong rồi!</AlertTitle>
                <AlertDescription>
                  Bạn đã tạo thành công Khách Sạn của mình 🔥
                  <div>Đừng quên thêm vào vài chiếc Phòng xinh nhé!</div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="cursor-pointer"
                      onClick={() => router.push(`/hotel-details/${hotel.id}`)}
                      variant="outline"
                      type="button"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Xem chi tiết
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
          <div className="flex justify-between gap-2 flex-wrap">
            <Button
              type="submit"
              className="max-w-[150px] cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {createdHotel || hotel ? "Đang Update..." : "Đang thêm..."}
                </>
              ) : (
                <>{createdHotel || hotel ? "CẬP NHẬT" : "THÊM"}</>
              )}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm Phòng xinh
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[900px] w-[90%]">
                <DialogHeader className="px-2">
                  <DialogTitle>Thêm phòng cho Khách Sạn của bạn</DialogTitle>
                  <DialogDescription>
                    Hãy điền thông tin chi tiết về phòng để hoàn tất quá trình
                    tạo khách sạn. Bạn có thể thêm nhiều phòng sau này nữa!
                  </DialogDescription>
                </DialogHeader>
                <AddRoomForm
                  hotel={hotel}
                  handleDialogueOpen={handleDialogueOpen}
                />
              </DialogContent>
            </Dialog>

            {createdHotel || hotel ? (
              <Button
                variant="outline"
                className="max-w-[150px] cursor-pointer"
                onClick={handleAddNewHotel}
                disabled={isLoading}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm mới
              </Button>
            ) : isLoading ? (
              <Button variant="outline" disabled className="max-w-[150px]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thêm
              </Button>
            ) : (
              <Button variant="outline" className="max-w-[150px]">
                <Pencil className="mr-2 h-4 w-4" />
                Thêm
              </Button>
            )}
            {hotel && (
              <Button
                variant="ghost"
                onClick={() => handleDeleteHotel(hotel)}
                className="max-w-[150px] cursor-pointer"
                disabled={isLoading || isHotelDeleting}
              >
                {isHotelDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa luôn
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
};

export default AddHotelForm;
