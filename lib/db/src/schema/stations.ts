import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  doublePrecision,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const stationsTable = pgTable("fuel_stations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  city: text("city").notNull(),
  municipality: text("municipality").notNull(),
  district: text("district").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  petrolPrice: doublePrecision("petrol_price"),
  dieselPrice: doublePrecision("diesel_price"),
  evPricePerKwh: doublePrecision("ev_price_per_kwh"),
  evPowerKw: doublePrecision("ev_power_kw"),
  open24Hours: boolean("open_24_hours").notNull().default(false),
  amenities: text("amenities").array().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertStationSchema = createInsertSchema(stationsTable).omit({
  updatedAt: true,
});
export type InsertStation = z.infer<typeof insertStationSchema>;
export type Station = typeof stationsTable.$inferSelect;