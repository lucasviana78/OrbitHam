import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Response envelope                                                   */
/* ------------------------------------------------------------------ */

export const successEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

export const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  message: z.string(),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

/* ------------------------------------------------------------------ */
/* User / Auth                                                         */
/* ------------------------------------------------------------------ */

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  username: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  username: z.string().min(3, 'Mínimo de 3 caracteres'),
  password: z.string().min(8, 'Mínimo de 8 caracteres'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/* ------------------------------------------------------------------ */
/* Station                                                             */
/* ------------------------------------------------------------------ */

export const stationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  altitude: z.number(),
  callsign: z.string(),
});
export type Station = z.infer<typeof stationSchema>;
export const stationListSchema = z.array(stationSchema);

export const stationFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  callsign: z.string().min(1, 'Informe o indicativo'),
  latitude: z.coerce
    .number({ invalid_type_error: 'Número inválido' })
    .min(-90, 'Min -90')
    .max(90, 'Max 90'),
  longitude: z.coerce
    .number({ invalid_type_error: 'Número inválido' })
    .min(-180, 'Min -180')
    .max(180, 'Max 180'),
  altitude: z.coerce.number({ invalid_type_error: 'Número inválido' }),
});
export type StationFormInput = z.infer<typeof stationFormSchema>;

/* ------------------------------------------------------------------ */
/* Satellite                                                           */
/* ------------------------------------------------------------------ */

export const satelliteSchema = z.object({
  id: z.number(),
  norad_id: z.number(),
  name: z.string(),
  category: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  downlink_mhz: z.number().nullable().optional(),
  tle_1: z.string().nullable().optional(),
  tle_2: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type Satellite = z.infer<typeof satelliteSchema>;
export const satelliteListSchema = z.array(satelliteSchema);

/* ------------------------------------------------------------------ */
/* Pass                                                                */
/* ------------------------------------------------------------------ */

export const passSchema = z.object({
  rise: z.string(),
  peak: z.string(),
  set: z.string(),
  max_elevation: z.number(),
});
export type Pass = z.infer<typeof passSchema>;
export const passListSchema = z.array(passSchema);

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export const dashboardPassSchema = passSchema.extend({
  satellite_id: z.number(),
  satellite_name: z.string(),
});
export type DashboardPass = z.infer<typeof dashboardPassSchema>;

export const dashboardSchema = z.object({
  active_satellites_count: z.number(),
  total_stations: z.number(),
  next_passes: z.array(dashboardPassSchema),
  active_satellites: satelliteListSchema,
});
export type Dashboard = z.infer<typeof dashboardSchema>;
