import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { booking, payment_intent_id } = body;

    const bookingData = {
      ...booking,
      userName: user.firstName,
      userEmail: user.emailAddresses[0].emailAddress,
      userId: user.id,
      currency: "VND", // Sử dụng VND
      paymentIntentId: payment_intent_id,
    };

    // Kiểm tra totalPrice trước khi gọi Stripe
    const maxAmountInVND = 999999999; // Giới hạn của Stripe cho VND (999,999,999 VND)
    if (booking.totalPrice > maxAmountInVND) {
      return NextResponse.json(
        {
          message: `Tổng số tiền không được vượt quá ${maxAmountInVND.toLocaleString()} VND`,
        },
        { status: 400 }
      );
    }

    // Kiểm tra số lượng phòng khả dụng trong khoảng ngày
    const { roomId, startDate, endDate } = booking;

    // Lấy thông tin phòng để kiểm tra quantity
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(
        { message: "Không tìm thấy phòng" },
        { status: 404 }
      );
    }

    // Kiểm tra các booking đã thanh toán trong khoảng ngày
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId: roomId,
        paymentStatus: true,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(startDate) } },
            ],
          },
        ],
      },
    });

    // Nếu quantity là 1 và đã có booking trùng, từ chối
    if (room.quantity === 1 && conflictingBookings.length > 0) {
      return NextResponse.json(
        { message: "Phòng đã được đặt trong khoảng thời gian này" },
        { status: 400 }
      );
    }

    // Nếu quantity > 1, kiểm tra số lượng booking trùng
    if (conflictingBookings.length >= room.quantity) {
      return NextResponse.json(
        { message: "Không còn phòng trống trong khoảng thời gian này" },
        { status: 400 }
      );
    }

    let foundBooking;

    if (payment_intent_id && payment_intent_id.trim() !== "") {
      foundBooking = await prisma.booking.findUnique({
        where: { paymentIntentId: payment_intent_id, userId: user.id },
      });
    }

    if (foundBooking && payment_intent_id && payment_intent_id.trim() !== "") {
      // update
      const currentIntent = await stripe.paymentIntents.retrieve(
        payment_intent_id
      );
      if (currentIntent) {
        const updatedIntent = await stripe.paymentIntents.update(
          payment_intent_id,
          {
            amount: booking.totalPrice, // Không nhân 100 với VND
          }
        );

        const res = await prisma.booking.update({
          where: { paymentIntentId: payment_intent_id, userId: user.id },
          data: bookingData,
        });

        if (!res) {
          return NextResponse.json(
            { message: "Không thể cập nhật booking" },
            { status: 500 }
          );
        }

        return NextResponse.json({ paymentIntent: updatedIntent });
      }
    }

    // create
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.totalPrice, // Không nhân 100 với VND
      currency: bookingData.currency,
      automatic_payment_methods: { enabled: true },
    });

    bookingData.paymentIntentId = paymentIntent.id;

    await prisma.booking.create({
      data: bookingData,
    });

    return NextResponse.json({ paymentIntent });
  } catch (error: any) {
    console.error("Error in /api/create-payment-intent:", error);
    return NextResponse.json(
      { message: "Lỗi server: " + error.message },
      { status: 500 }
    );
  }
}
