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
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import qs from "query-string";
import { toast } from "sonner";
import { Button } from "./button";

const LocationFilter = () => {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  const isHomePage = pathname === "/";

  // State cho các bộ lọc vị trí
  const [country, setCountry] = useState(
    isHomePage ? params.get("country") || "" : ""
  );
  const [state, setState] = useState(
    isHomePage ? params.get("state") || "" : ""
  );
  const [city, setCity] = useState(isHomePage ? params.get("city") || "" : "");

  // State cho sắp xếp theo giá
  const [sortPrice, setSortPrice] = useState(
    isHomePage ? params.get("sortPrice") || "" : ""
  );

  const { getAllCountries, getCountryStates, getStateCities } = useLocation();

  const countries = getAllCountries;
  const states = country ? getCountryStates(country) : [];
  const cities = country && state ? getStateCities(country, state) : [];

  // Reset filter khi rời khỏi trang chính
  useEffect(() => {
    if (!isHomePage) {
      setCountry("");
      setState("");
      setCity("");
      setSortPrice(""); // Reset sortPrice
    }
  }, [isHomePage]);

  // Đặt lại state và city khi quốc gia thay đổi
  useEffect(() => {
    if (!isHomePage) return;

    const countryStates = getCountryStates(country);
    if (countryStates) {
      setState("");
      setCity("");
    }
  }, [country, isHomePage]);

  // Đặt lại city khi bang/tỉnh thay đổi
  useEffect(() => {
    if (!isHomePage) return;

    const stateCities = getStateCities(country, state);
    if (stateCities) {
      setCity("");
    }
  }, [country, state, isHomePage]);

  // Lưu các giá trị vào URL
  useEffect(() => {
    if (!isHomePage) return;

    let currentQuery: any = {};
    if (params) {
      currentQuery = qs.parse(params.toString());
    }

    if (country) {
      currentQuery.country = country;
    } else {
      delete currentQuery.country;
    }

    if (state) {
      currentQuery.state = state;
    } else {
      delete currentQuery.state;
    }

    if (city) {
      currentQuery.city = city;
    } else {
      delete currentQuery.city;
    }

    if (sortPrice) {
      currentQuery.sortPrice = sortPrice; // Thêm sortPrice vào query
    } else {
      delete currentQuery.sortPrice;
    }

    const url = qs.stringifyUrl(
      {
        url: "/",
        query: currentQuery,
      },
      { skipNull: true, skipEmptyString: true }
    );

    if (url !== window.location.pathname + window.location.search) {
      router.replace(url, { scroll: false });
    }
  }, [country, state, city, sortPrice, params, router, isHomePage]);

  const handleClearFilter = () => {
    setCountry("");
    setState("");
    setCity("");
    setSortPrice(""); // Reset sortPrice
    router.push("/", { scroll: false });
  };

  if (!isHomePage) return null;

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
            disabled={!country}
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
            disabled={!country || !state}
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

        {/* Dropdown Sắp xếp theo giá */}
        <div>
          <Select
            onValueChange={(value) => setSortPrice(value)}
            value={sortPrice}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Sắp xếp theo giá" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Giá: Tăng dần</SelectItem>
              <SelectItem value="desc">Giá: Giảm dần</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="cursor-pointer"
          onClick={handleClearFilter}
          variant="outline"
        >
          Làm mới
        </Button>
      </div>
    </Container>
  );
};

export default LocationFilter;
