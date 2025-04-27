"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import Container from "../Container";
import useLocation from "@/hooks/useLocation";
import { useRouter, useSearchParams } from "next/navigation";
import qs from "query-string";
import { toast } from "sonner";
import { Button } from "./button";

const LocationFilter = () => {
  const router = useRouter();
  const params = useSearchParams();

  // Khởi tạo state từ URL
  const [country, setCountry] = useState(params.get("country") || "");
  const [state, setState] = useState(params.get("state") || "");
  const [city, setCity] = useState(params.get("city") || "");

  const { getAllCountries, getCountryStates, getStateCities } = useLocation();

  // Lấy danh sách quốc gia
  const countries = getAllCountries;

  // Lấy danh sách bang/tỉnh dựa trên quốc gia
  const states = country ? getCountryStates(country) : [];

  // Lấy danh sách thành phố dựa trên quốc gia và bang/tỉnh
  const cities = country && state ? getStateCities(country, state) : [];

  // Đặt lại state và city khi quốc gia thay đổi
  useEffect(() => {
    const countryStates = getCountryStates(country);
    if (countryStates) {
      setState("");
      setCity("");
    }
  }, [country]);

  // Đặt lại city khi bang/tỉnh thay đổi
  useEffect(() => {
    const stateCities = getStateCities(country, state);
    if (stateCities) {
      setCity("");
    }
  }, [country, state]);

  // Lưu các giá trị vào URL
  useEffect(() => {
    // Nếu tất cả đều rỗng, điều hướng về trang mặc định
    if (country === "" && state === "" && city === "") {
      router.push("/");
      return;
    }

    // Lấy query string hiện tại
    let currentQuery: any = {};
    if (params) {
      currentQuery = qs.parse(params.toString());
    }

    // Cập nhật query string với các giá trị mới
    if (country) {
      currentQuery = {
        ...currentQuery,
        country,
      };
    }
    if (state) {
      currentQuery = {
        ...currentQuery,
        state,
      };
    }
    if (city) {
      currentQuery = {
        ...currentQuery,
        city,
      };
    }

    // Xóa các tham số nếu chúng rỗng
    if (country === "" && currentQuery.country) {
      delete currentQuery.country;
    }
    if (state === "" && currentQuery.state) {
      delete currentQuery.state;
    }
    if (city === "" && currentQuery.city) {
      delete currentQuery.city;
    }

    // Tạo URL mới
    const url = qs.stringifyUrl(
      {
        url: "/", // Điều hướng đến trang danh sách khách sạn
        query: currentQuery,
      },
      { skipNull: true, skipEmptyString: true }
    );

    // Chỉ cập nhật URL nếu có sự thay đổi
    if (url !== window.location.pathname + window.location.search) {
      router.push(url);
      toast.success("Đã tìm ra điểm đến của bạn!");
    }
  }, [country, state, city, params, router]);

  const handleClearFilter = () => {
    router.push("/");
    setCountry("");
    setState("");
    setCity("");
  };

  return (
    <Container>
      <div className="flex gap-2 md:gap-4 items-center justify-center text-sm">
        {/* Dropdown Quốc gia */}
        <div>
          <Select onValueChange={(value) => setCountry(value)} value={country}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Chọn quốc gia" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.isoCode} value={country.isoCode}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown Bang/Tỉnh */}
        <div>
          <Select
            onValueChange={(value) => setState(value)}
            value={state}
            disabled={!country} // Disable nếu chưa chọn quốc gia
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Chọn bang/tỉnh" />
            </SelectTrigger>
            <SelectContent>
              {states.length > 0 ? (
                states.map((state) => (
                  <SelectItem key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-states" disabled>
                  Không có bang/tỉnh
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown Thành phố */}
        <div>
          <Select
            onValueChange={(value) => setCity(value)}
            value={city}
            disabled={!country || !state} // Disable nếu chưa chọn quốc gia hoặc bang/tỉnh
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Chọn thành phố" />
            </SelectTrigger>
            <SelectContent>
              {cities.length > 0 ? (
                cities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-cities" disabled>
                  Không có thành phố
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="cursor-pointer"
          onClick={() => handleClearFilter()}
          variant="outline"
        >
          Làm mới
        </Button>
      </div>
    </Container>
  );
};

export default LocationFilter;
