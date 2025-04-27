"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import * as z from "zod";
import { Hotel, Room } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { useState } from "react";
import { UploadButton } from "../Uploadthing";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";

interface AddRoomFormProps {
  hotel?: Hotel & {
    rooms: Room[];
  };
  room?: Room;
  handleDialogueOpen: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, "Tên phòng không được để trống"),
  description: z.string().min(1, "Mô tả không được để trống"),
  bedCount: z.coerce.number().int().min(0, "Số giường phải >= 0"),
  guestCount: z.coerce.number().int().min(0, "Số khách phải >= 0"),
  bathroomCount: z.coerce.number().int().min(0, "Số phòng tắm phải >= 0"),
  kingBed: z.coerce.number().int().min(0, "Số giường king phải >= 0"),
  queenBen: z.coerce.number().int().min(0, "Số giường queen phải >= 0"),
  image: z.string().min(1, "Ảnh phòng là bắt buộc"),
  breakFastPrice: z.coerce.number().int().min(0, "Giá bữa sáng phải >= 0"),
  roomPrice: z.coerce.number().int().min(0, "Giá phòng phải >= 0"),
  roomService: z.boolean(),
  TV: z.boolean(),
  balcony: z.boolean(),
  freeWiFi: z.boolean(),
  cityView: z.boolean(),
  oceanView: z.boolean(),
  forestView: z.boolean(),
  mountainView: z.boolean(),
  airCondition: z.boolean(),
  soundProofed: z.boolean(),
});

const AddRoomForm = ({ hotel, room, handleDialogueOpen }: AddRoomFormProps) => {
  const [imageData, setImageData] = useState<{
    url: string | undefined;
    fileKey: string | undefined;
  }>({
    url: room?.image,
    fileKey: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: room
      ? {
          title: room.title,
          description: room.description,
          bedCount: room.bedCount,
          guestCount: room.guestCount,
          bathroomCount: room.bathroomCount,
          kingBed: room.kingBed,
          queenBen: room.queenBen,
          image: room.image,
          breakFastPrice: room.breakFastPrice,
          roomPrice: room.roomPrice,
          roomService: room.roomService,
          TV: room.TV,
          balcony: room.balcony,
          freeWiFi: room.freeWiFi,
          cityView: room.cityView,
          oceanView: room.oceanView,
          forestView: room.forestView,
          mountainView: room.mountainView,
          airCondition: room.airCondition,
          soundProofed: room.soundProofed,
        }
      : {
          title: "",
          description: "",
          bedCount: 0,
          guestCount: 0,
          bathroomCount: 0,
          kingBed: 0,
          queenBen: 0,
          image: "",
          breakFastPrice: 0,
          roomPrice: 0,
          roomService: false,
          TV: false,
          balcony: false,
          freeWiFi: false,
          cityView: false,
          oceanView: false,
          forestView: false,
          mountainView: false,
          airCondition: false,
          soundProofed: false,
        },
  });

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
        toast.success("Xóa ảnh thành công!");
        setImageData({ url: undefined, fileKey: undefined });
        form.setValue("image", "");
      } else {
        throw new Error("Failed to delete image on UploadThing");
      }
    } catch (error: unknown) {
      console.error("Delete error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa ảnh";
      toast.error("Xóa ảnh thất bại: " + errorMessage);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    // Sửa endpoint thành /api/room thay vì /api/hotel
    const endpoint = room
      ? `/api/room/${room.id}` // PATCH cho cập nhật
      : "/api/room"; // POST cho tạo mới

    const method = room ? "patch" : "post";

    axios[method](endpoint, { ...values, hotelId: hotel?.id })
      .then((res) => {
        toast.success(
          room ? "🎉 Phòng đã được cập nhật!" : "🎉 Phòng đã được tạo!"
        );
        handleDialogueOpen();
        form.reset();
        setImageData({ url: undefined, fileKey: undefined });
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.response?.data?.message || "Có lỗi xảy ra!");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }
  return (
    <div className="max-h-[75vh] overflow-y-auto px-4 py-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Phần thông tin phòng */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Thông tin phòng
          </h3>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên phòng</FormLabel>
                  <FormDescription>Cung cấp tên phòng của bạn</FormDescription>
                  <FormControl>
                    <Input placeholder="Phòng đôi..." {...field} />
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
                  <FormLabel>Mô tả</FormLabel>
                  <FormDescription>Có gì đặc biệt?</FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Phòng rộng rãi, view biển..."
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
                  <FormLabel>Ảnh phòng</FormLabel>
                  <FormDescription>
                    Thêm ảnh để phòng thêm lung linh!
                  </FormDescription>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      {imageData.url ? (
                        <div className="relative">
                          <Image
                            src={imageData.url}
                            alt="Room Image"
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
                                toast.success("Tải ảnh lên thành công!");
                              }
                            }}
                            onUploadError={(error: Error) => {
                              console.error("Upload error:", error);
                              toast.error(
                                "Tải ảnh lên thất bại: " + error.message
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bedCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số giường (chiếc)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sức chứa khách (người)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathroomCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số phòng tắm (phòng)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kingBed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giường King (chiếc)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="queenBen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giường Queen (chiếc)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="breakFastPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá bữa sáng (nghìn)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giá phòng (nghìn)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Phần tiện ích */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Tiện ích
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="roomService"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Dịch vụ phòng</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="TV"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>TV</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balcony"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Ban công</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="freeWiFi"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Wi-Fi miễn phí</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cityView"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>View thành phố</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="oceanView"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>View biển</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="forestView"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>View rừng</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mountainView"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>View núi</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="airCondition"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Máy lạnh</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="soundProofed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Cách âm</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Nút điều khiển */}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            className="max-w-[150px] cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {room ? "Đang cập nhật..." : "Đang thêm..."}
              </>
            ) : room ? (
              "CẬP NHẬT"
            ) : (
              "THÊM"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="max-w-[150px] cursor-pointer"
            onClick={handleDialogueOpen}
            disabled={isLoading}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddRoomForm;
