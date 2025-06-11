import {
  getGuideBookingsByUserId,
  getGuideBookingsByGuideId,
} from "@/actions/getGuideBookings";
import MyGuideBookingsClient from "@/components/booking/MyGuideBookingsClient";
import Container from "@/components/Container";

const MyBookingGuidePage = async () => {
  const bookingsIMade = await getGuideBookingsByUserId();
  const bookingsForMe = await getGuideBookingsByGuideId();

  console.log("Bookings I made:", bookingsIMade);
  console.log("Bookings for me:", bookingsForMe);

  if (!bookingsIMade || !bookingsForMe) {
    return (
      <Container>
        <div className="pt-20 text-center text-lg text-gray-600 dark:text-gray-400">
          Không tìm thấy đơn đặt lịch hướng dẫn viên nào
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="pt-20 flex flex-col gap-10">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-6 mt-2">
            Đây là các hướng dẫn viên bạn đã đặt
          </h2>
          {bookingsIMade.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {bookingsIMade.map((booking) => (
                <MyGuideBookingsClient
                  key={booking.id}
                  booking={booking}
                  isGuideView={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-lg text-gray-600 dark:text-gray-400">
              Bạn chưa đặt hướng dẫn viên nào.
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-6 mt-2">
            Đây là các đặt lịch của khách hàng với bạn
          </h2>
          {bookingsForMe.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {bookingsForMe.map((booking) => (
                <MyGuideBookingsClient
                  key={booking.id}
                  booking={booking}
                  isGuideView={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-lg text-gray-600 dark:text-gray-400">
              Hiện tại chưa có khách hàng nào đặt lịch với bạn.
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default MyBookingGuidePage;
