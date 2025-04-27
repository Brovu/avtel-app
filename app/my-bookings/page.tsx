import { getBookingsByHotelOwnerId } from "@/actions/getBookingsByHotelOwnerld";
import { getBookingsByUserId } from "@/actions/getBookingsByUserId";
import MyBookingsClient from "@/components/booking/MyBookingsClient";

const MyBookings = async () => {
  const bookingsFromVisitors = await getBookingsByHotelOwnerId();
  const bookingsIHaveMade = await getBookingsByUserId();

  if (!bookingsFromVisitors || !bookingsIHaveMade)
    return <div>Không tìm thấy đơn đặt phòng nào</div>;

  return (
    <div className="flex flex-col gap-10">
      {!!bookingsIHaveMade?.length && (
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-6 mt-2">
            Đây là các đơn đặt phòng bạn đã thực hiện
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {bookingsIHaveMade.map((booking) => (
              <MyBookingsClient key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}
      {!!bookingsFromVisitors?.length && (
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-6 mt-2">
            Đây là các đơn đặt phòng của khách tại khách sạn của bạn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {bookingsFromVisitors.map((booking) => (
              <MyBookingsClient key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
