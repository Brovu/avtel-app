"use client";

import * as React from "react";
import {
  BookOpenCheck,
  ChevronsUpDown,
  Heart,
  Hotel,
  Plus,
  User2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Separator } from "../ui/separator";

export function NavMenu() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <ChevronsUpDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Phần Khách sạn */}
        <DropdownMenuItem
          className="cursor-pointer flex gap-2 items-center"
          onClick={() => router.push("/hotel/new")}
        >
          <Plus size={15} /> <span>Thêm khách sạn</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer flex gap-2 items-center"
          onClick={() => router.push("/my-hotels")}
        >
          <Hotel size={15} /> <span>Khách sạn của bạn</span>
        </DropdownMenuItem>
        {/* Phần Booking */}
        <DropdownMenuItem
          className="cursor-pointer flex gap-2 items-center"
          onClick={() => router.push("/my-bookings")}
        >
          <BookOpenCheck size={15} /> <span>Booking khách sạn</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer flex gap-2 items-center"
          onClick={() => router.push("/favorites")}
        >
          <Heart size={15} /> <span>Khách sạn yêu thích</span>
        </DropdownMenuItem>
        <Separator />

        {/* Phần Hướng dẫn viên */}
        <DropdownMenuItem
          className="cursor-pointer flex gap-2 items-center"
          onClick={() => router.push("/local-guides")}
        >
          <User2 size={15} /> <span>Hướng dẫn viên</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer flex gap-2 items-center"
          onClick={() => router.push("/my-booking-guide")}
        >
          <BookOpenCheck size={15} /> <span>Booking hướng DV</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
