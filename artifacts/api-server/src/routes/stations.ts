import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, stationsTable, type Station } from "@workspace/db";
import {
  GetStationParams,
  GetStationResponse,
  GetFuelSummaryResponse,
  ListRegionsResponse,
  ListStationsQueryParams,
  ListStationsResponse,
} from "@workspace/api-zod";
import type { PriceLeader } from "@workspace/api-zod";
import { ensureStationsSeeded } from "../lib/station-data";

const router: IRouter = Router();

type FuelType = "petrol" | "diesel" | "electric";
type SortMode = "best" | "price" | "distance";

function haversineDistanceKm(
  latitude: number,
  longitude: number,
  station: Station,
): number {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((station.latitude - latitude) * Math.PI) / 180;
  const longitudeDelta = ((station.longitude - longitude) * Math.PI) / 180;
  const originLatitude = (latitude * Math.PI) / 180;
  const stationLatitude = (station.latitude * Math.PI) / 180;
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 *
      Math.cos(originLatitude) *
      Math.cos(stationLatitude);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function fuelPrice(station: Station, fuelType: FuelType): number | null {
  if (fuelType === "petrol") return station.petrolPrice;
  if (fuelType === "diesel") return station.dieselPrice;
  return station.evPricePerKwh;
}

function stationToResponse(
  station: Station,
  distanceKm: number | null,
  rankingLabel: string | null,
) {
  return {
    ...station,
    distanceKm,
    rankingLabel,
  };
}

function priceLeader(stations: Station[], fuelType: FuelType): PriceLeader {
  const leader = stations
    .filter((station) => fuelPrice(station, fuelType) !== null)
    .sort(
      (left, right) =>
        (fuelPrice(left, fuelType) ?? Number.POSITIVE_INFINITY) -
        (fuelPrice(right, fuelType) ?? Number.POSITIVE_INFINITY),
    )[0];

  if (!leader) {
    return {
      stationId: "",
      stationName: "No data",
      city: "Portugal",
      price: 0,
    };
  }

  return {
    stationId: leader.id,
    stationName: leader.name,
    city: leader.city,
    price: fuelPrice(leader, fuelType) ?? 0,
  };
}

function averagePrice(stations: Station[], fuelType: FuelType): number {
  const values = stations
    .map((station) => fuelPrice(station, fuelType))
    .filter((price): price is number => price !== null);
  return values.length === 0
    ? 0
    : Number(
        (values.reduce((total, price) => total + price, 0) / values.length).toFixed(3),
      );
}

router.get("/stations", async (req, res): Promise<void> => {
  const parsedQuery = ListStationsQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  await ensureStationsSeeded();
  const {
    fuelType,
    search,
    latitude,
    longitude,
    maxDistanceKm,
    sort = "best",
  } = parsedQuery.data as {
    fuelType?: FuelType;
    search?: string;
    latitude?: number;
    longitude?: number;
    maxDistanceKm?: number;
    sort?: SortMode;
  };

  const stations = await db
    .select()
    .from(stationsTable)
    .orderBy(asc(stationsTable.name));
  const hasLocation = latitude !== undefined && longitude !== undefined;
  const normalizedSearch = search?.trim().toLocaleLowerCase("pt-PT");

  const candidates = stations
    .filter((station) => {
      if (fuelType && fuelPrice(station, fuelType) === null) return false;
      if (
        normalizedSearch &&
        ![
          station.name,
          station.brand,
          station.city,
          station.municipality,
          station.district,
        ].some((value) =>
          value.toLocaleLowerCase("pt-PT").includes(normalizedSearch),
        )
      ) {
        return false;
      }
      return true;
    })
    .map((station) => ({
      station,
      distanceKm: hasLocation
        ? haversineDistanceKm(latitude, longitude, station)
        : null,
    }))
    .filter(
      ({ distanceKm }) =>
        maxDistanceKm === undefined ||
        (distanceKm !== null && distanceKm <= maxDistanceKm),
    );

  const activeFuelType = fuelType ?? "petrol";
  const prices = candidates
    .map(({ station }) => fuelPrice(station, activeFuelType))
    .filter((price): price is number => price !== null);
  const lowestPrice = Math.min(...prices);
  const nearestDistance = Math.min(
    ...candidates
      .map(({ distanceKm }) => distanceKm)
      .filter((distance): distance is number => distance !== null),
  );

  candidates.sort((left, right) => {
    const leftPrice = fuelPrice(left.station, activeFuelType);
    const rightPrice = fuelPrice(right.station, activeFuelType);
    if (sort === "price") {
      return (
        (leftPrice ?? Number.POSITIVE_INFINITY) -
        (rightPrice ?? Number.POSITIVE_INFINITY)
      );
    }
    if (sort === "distance" && hasLocation) {
      return (
        (left.distanceKm ?? Number.POSITIVE_INFINITY) -
        (right.distanceKm ?? Number.POSITIVE_INFINITY)
      );
    }
    const leftScore =
      (leftPrice ?? Number.POSITIVE_INFINITY) +
      (left.distanceKm ?? 0) * 0.008;
    const rightScore =
      (rightPrice ?? Number.POSITIVE_INFINITY) +
      (right.distanceKm ?? 0) * 0.008;
    return leftScore - rightScore;
  });

  const response = candidates.map(({ station, distanceKm }, index) => {
    let rankingLabel: string | null = null;
    if (index === 0) rankingLabel = hasLocation ? "Best overall" : "Lowest price";
    else if (leftPriceIsLowest(station, activeFuelType, lowestPrice)) {
      rankingLabel = "Lowest price";
    } else if (index === 1 && hasLocation) {
      rankingLabel = "Great value";
    } else if (index === 0 && hasLocation && distanceKm === nearestDistance) {
      rankingLabel = "Closest";
    }
    return stationToResponse(
      station,
      distanceKm === null ? null : Number(distanceKm.toFixed(1)),
      rankingLabel,
    );
  });

  res.json(ListStationsResponse.parse(response));
});

function leftPriceIsLowest(
  station: Station,
  fuelType: FuelType,
  lowestPrice: number,
): boolean {
  const price = fuelPrice(station, fuelType);
  return price !== null && price === lowestPrice;
}

router.get("/stations/:stationId", async (req, res): Promise<void> => {
  const parsedParams = GetStationParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }

  await ensureStationsSeeded();
  const [station] = await db
    .select()
    .from(stationsTable)
    .where(eq(stationsTable.id, parsedParams.data.stationId));

  if (!station) {
    res.status(404).json({ error: "Station not found" });
    return;
  }

  res.json(GetStationResponse.parse(stationToResponse(station, null, null)));
});

router.get("/summary", async (_req, res): Promise<void> => {
  await ensureStationsSeeded();
  const stations = await db.select().from(stationsTable);
  const updatedAt = stations.reduce(
    (latest, station) =>
      station.updatedAt > latest ? station.updatedAt : latest,
    new Date(0),
  );

  res.json(
    GetFuelSummaryResponse.parse({
      updatedAt,
      stationsCount: stations.length,
      averagePetrol: averagePrice(stations, "petrol"),
      averageDiesel: averagePrice(stations, "diesel"),
      averageEv: averagePrice(stations, "electric"),
      cheapestPetrol: priceLeader(stations, "petrol"),
      cheapestDiesel: priceLeader(stations, "diesel"),
      cheapestEv: priceLeader(stations, "electric"),
    }),
  );
});

router.get("/regions", async (_req, res): Promise<void> => {
  await ensureStationsSeeded();
  const stations = await db.select().from(stationsTable);
  const grouped = new Map<string, Station[]>();
  for (const station of stations) {
    const existing = grouped.get(station.district) ?? [];
    existing.push(station);
    grouped.set(station.district, existing);
  }

  const response = [...grouped.entries()]
    .map(([name, districtStations]) => ({
      name,
      stationCount: districtStations.length,
      cheapestPetrol: priceLeader(districtStations, "petrol").price,
      cheapestDiesel: priceLeader(districtStations, "diesel").price,
      cheapestEv: priceLeader(districtStations, "electric").price,
    }))
    .sort((left, right) => left.cheapestPetrol - right.cheapestPetrol);

  res.json(ListRegionsResponse.parse(response));
});

export default router;