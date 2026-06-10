import { createClient } from "@/lib/supabase/client";
import {
  assets as seedAssets,
  events as seedEvents,
  riskAssessments as seedRiskAssessments,
  dataLayers as seedDataLayers,
  reports as seedReports,
  type Asset,
  type AssetType,
  type AnomalyEvent,
  type EventType,
  type Severity,
  type RiskAssessment,
  type DataLayer,
  type LayerType,
  type Report,
  type ReportType,
} from "@/lib/data/geospatial";

// ─── Context ─────────────────────────────────────────────────────────────────

export async function getCtx() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  if (!profile?.org_id) throw new Error("No organization found for user");
  return { supabase, userId: user.id, orgId: profile.org_id as string, user };
}

export async function getCurrentUser(): Promise<{
  email: string | null;
  fullName: string | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return {
    email: user?.email ?? null,
    fullName: (user?.user_metadata?.full_name as string | undefined) ?? null,
  };
}

// ─── DB row shapes (live schema, verified) ───────────────────────────────────

interface AssetRow {
  id: string;
  org_id: string | null;
  name: string;
  asset_type: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  metadata: {
    location?: string;
    description?: string;
    sector?: string;
  } | null;
  risk_score: number | null;
  last_checked_at: string | null;
  created_at: string | null;
}

interface AnomalyEventRow {
  id: string;
  asset_id: string | null;
  event_type: string | null;
  severity: string | null;
  detected_at: string | null;
  confidence: number | string | null;
  source: string | null;
  resolved_at: string | null;
  created_at: string | null;
  monitored_assets?: { name: string } | null;
}

interface RiskAssessmentRow {
  id: string;
  asset_id: string | null;
  period: string | null;
  risk_score: number | null;
  risk_factors: unknown;
  trend: string | null;
  assessed_at: string | null;
}

interface DataLayerRow {
  id: string;
  org_id: string | null;
  name: string;
  layer_type: string | null;
  source_api: string | null;
  config: { coverage?: string; last_refresh?: string } | null;
  refresh_interval: string | null;
  active: boolean | null;
  created_at: string | null;
}

interface ReportRow {
  id: string;
  org_id: string | null;
  name: string;
  report_type: string | null;
  content: unknown;
  generated_at: string | null;
  shared_with: unknown;
}

// ─── Mappers (DB snake_case → UI camelCase types) ────────────────────────────

const ASSET_TYPES: AssetType[] = ["facility", "pipeline", "field", "coastline", "forest", "mine"];
const EVENT_TYPES: EventType[] = ["vegetation_change", "thermal", "structural", "flood", "fire"];
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
const LAYER_TYPES: LayerType[] = ["satellite", "weather", "elevation", "landuse"];
const REPORT_TYPES: ReportType[] = ["monitoring", "incident", "risk_summary"];

function asEnum<T extends string>(value: string | null | undefined, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function mapAsset(row: AssetRow): Asset {
  const meta = row.metadata ?? {};
  return {
    id: row.id,
    name: row.name,
    type: asEnum(row.asset_type, ASSET_TYPES, "facility"),
    location: meta.location ?? "",
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    description: meta.description ?? "",
    riskScore: row.risk_score ?? 0,
    lastChecked: row.last_checked_at ?? row.created_at ?? new Date().toISOString(),
    sector: meta.sector ?? "",
  };
}

function describeEvent(type: EventType, severity: Severity, source: string): string {
  const label = type.replace(/_/g, " ");
  const sev = severity.charAt(0).toUpperCase() + severity.slice(1);
  return source
    ? `${sev}-severity ${label} signal detected via ${source}.`
    : `${sev}-severity ${label} signal detected.`;
}

function mapEvent(row: AnomalyEventRow): AnomalyEvent {
  const type = asEnum(row.event_type, EVENT_TYPES, "structural");
  const severity = asEnum(row.severity, SEVERITIES, "low");
  const source = row.source ?? "";
  return {
    id: row.id,
    assetId: row.asset_id ?? "",
    assetName: row.monitored_assets?.name ?? "",
    type,
    severity,
    detectedAt: row.detected_at ?? row.created_at ?? new Date().toISOString(),
    confidence: Math.round(Number(row.confidence ?? 0)),
    status: row.resolved_at ? "resolved" : "active",
    description: describeEvent(type, severity, source),
    source,
    affectedArea: "",
    recommendedActions: [],
  };
}

function mapRisk(row: RiskAssessmentRow): RiskAssessment {
  const factors = Array.isArray(row.risk_factors)
    ? (row.risk_factors as { name: string; weight: number; score: number }[])
    : [];
  return {
    id: row.id,
    assetId: row.asset_id ?? "",
    date: (row.assessed_at ?? "").slice(0, 10),
    overallScore: row.risk_score ?? 0,
    factors,
    trend: asEnum(row.trend, ["improving", "stable", "worsening"], "stable"),
  };
}

function mapLayer(row: DataLayerRow): DataLayer {
  const config = row.config ?? {};
  return {
    id: row.id,
    name: row.name,
    type: asEnum(row.layer_type, LAYER_TYPES, "satellite"),
    source: row.source_api ?? "",
    refreshInterval: row.refresh_interval ?? "",
    status: row.active ? "active" : "inactive",
    lastRefresh: config.last_refresh ?? row.created_at ?? new Date().toISOString(),
    coverage: config.coverage ?? "",
  };
}

function mapReport(row: ReportRow): Report {
  const content = (row.content ?? {}) as {
    summary?: string;
    assets_covered?: string[];
    body?: string;
  };
  return {
    id: row.id,
    title: row.name,
    type: asEnum(row.report_type, REPORT_TYPES, "monitoring"),
    date: (row.generated_at ?? "").slice(0, 10),
    assetsCovered: Array.isArray(content.assets_covered) ? content.assets_covered : [],
    summary: content.summary ?? "",
    content: content.body ?? JSON.stringify(row.content ?? {}, null, 2),
  };
}

// ─── Monitored assets ────────────────────────────────────────────────────────

export async function listAssets(): Promise<Asset[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("monitored_assets")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as AssetRow[]).map(mapAsset);
}

export async function getAsset(id: string): Promise<Asset | null> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("monitored_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAsset(data as AssetRow) : null;
}

export interface CreateAssetInput {
  name: string;
  type: AssetType;
  location: string;
  sector: string;
  latitude: number;
  longitude: number;
  description: string;
}

export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("monitored_assets")
    .insert({
      org_id: orgId,
      name: input.name,
      asset_type: input.type,
      latitude: input.latitude,
      longitude: input.longitude,
      metadata: {
        location: input.location,
        description: input.description,
        sector: input.sector,
      },
      risk_score: 0,
      last_checked_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapAsset(data as AssetRow);
}

// ─── Anomaly events ──────────────────────────────────────────────────────────

const EVENT_SELECT = "*, monitored_assets(name)";

export async function listAnomalies(): Promise<AnomalyEvent[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("anomaly_events")
    .select(EVENT_SELECT)
    .order("detected_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as AnomalyEventRow[]).map(mapEvent);
}

export async function listAnomaliesForAsset(assetId: string): Promise<AnomalyEvent[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("anomaly_events")
    .select(EVENT_SELECT)
    .eq("asset_id", assetId)
    .order("detected_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as AnomalyEventRow[]).map(mapEvent);
}

export async function resolveAnomaly(id: string): Promise<AnomalyEvent> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("anomaly_events")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", id)
    .select(EVENT_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return mapEvent(data as AnomalyEventRow);
}

// ─── Risk assessments ────────────────────────────────────────────────────────

export async function listRiskAssessments(): Promise<RiskAssessment[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("risk_assessments")
    .select("*")
    .order("assessed_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RiskAssessmentRow[]).map(mapRisk);
}

export async function getLatestRiskForAsset(assetId: string): Promise<RiskAssessment | null> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("risk_assessments")
    .select("*")
    .eq("asset_id", assetId)
    .order("assessed_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const row = (data ?? [])[0] as RiskAssessmentRow | undefined;
  return row ? mapRisk(row) : null;
}

// ─── Data layers ─────────────────────────────────────────────────────────────

export async function listLayers(): Promise<DataLayer[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("data_layers")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as DataLayerRow[]).map(mapLayer);
}

export interface CreateLayerInput {
  name: string;
  type: LayerType;
  source: string;
  refreshInterval: string;
  coverage: string;
}

export async function createLayer(input: CreateLayerInput): Promise<DataLayer> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("data_layers")
    .insert({
      org_id: orgId,
      name: input.name,
      layer_type: input.type,
      source_api: input.source,
      refresh_interval: input.refreshInterval,
      active: true,
      config: { coverage: input.coverage, last_refresh: new Date().toISOString() },
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapLayer(data as DataLayerRow);
}

export async function setLayerActive(id: string, active: boolean): Promise<DataLayer> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("data_layers")
    .update({ active })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapLayer(data as DataLayerRow);
}

export async function deleteLayer(id: string): Promise<void> {
  const { supabase } = await getCtx();
  const { error } = await supabase.from("data_layers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function listReports(): Promise<Report[]> {
  const { supabase } = await getCtx();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("generated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ReportRow[]).map(mapReport);
}

export interface CreateReportInput {
  title: string;
  type: ReportType;
  summary: string;
  assetsCovered: string[];
  body: string;
  metrics?: Record<string, unknown>;
}

export async function createReport(input: CreateReportInput): Promise<Report> {
  const { supabase, orgId } = await getCtx();
  const { data, error } = await supabase
    .from("reports")
    .insert({
      org_id: orgId,
      name: input.title,
      report_type: input.type,
      content: {
        summary: input.summary,
        assets_covered: input.assetsCovered,
        body: input.body,
        ...(input.metrics ? { metrics: input.metrics } : {}),
      },
      generated_at: new Date().toISOString(),
      shared_with: [],
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapReport(data as ReportRow);
}

// ─── Demo seeding ────────────────────────────────────────────────────────────

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
}

export async function seedDemoData(): Promise<void> {
  const { supabase, orgId } = await getCtx();
  const now = Date.now();

  // Shift all seed timestamps so the most recent seed moment lands at "now",
  // preserving the relative spacing between events.
  const seedTimes = [
    ...seedAssets.map((a) => new Date(a.lastChecked).getTime()),
    ...seedEvents.map((e) => new Date(e.detectedAt).getTime()),
  ];
  const seedBase = Math.max(...seedTimes);
  const shift = (iso: string) =>
    new Date(now - (seedBase - new Date(iso).getTime())).toISOString();

  // 1) Parents: monitored_assets (org-scoped)
  const { data: insertedAssets, error: assetError } = await supabase
    .from("monitored_assets")
    .insert(
      seedAssets.map((a) => ({
        org_id: orgId,
        name: a.name,
        asset_type: a.type,
        latitude: a.latitude,
        longitude: a.longitude,
        metadata: {
          location: a.location,
          description: a.description,
          sector: a.sector,
        },
        risk_score: a.riskScore,
        last_checked_at: shift(a.lastChecked),
      }))
    )
    .select("id");
  if (assetError || !insertedAssets || insertedAssets.length !== seedAssets.length) {
    throw new Error(assetError?.message ?? "Failed to seed assets");
  }

  const idMap = new Map<string, string>();
  seedAssets.forEach((a, i) => idMap.set(a.id, (insertedAssets[i] as { id: string }).id));

  // 2) Children: anomaly_events (mix of resolved/unresolved, recent timestamps)
  const { error: eventError } = await supabase.from("anomaly_events").insert(
    seedEvents.map((e) => {
      const detectedAt = shift(e.detectedAt);
      return {
        asset_id: idMap.get(e.assetId),
        event_type: e.type,
        severity: e.severity,
        detected_at: detectedAt,
        confidence: e.confidence,
        source: e.source,
        resolved_at:
          e.status === "resolved"
            ? new Date(new Date(detectedAt).getTime() + 18 * 60 * 60 * 1000).toISOString()
            : null,
      };
    })
  );
  if (eventError) throw new Error(eventError.message);

  // 3) Children: risk_assessments
  const { error: riskError } = await supabase.from("risk_assessments").insert(
    seedRiskAssessments.map((r) => ({
      asset_id: idMap.get(r.assetId),
      period: currentPeriod(),
      risk_score: r.overallScore,
      risk_factors: r.factors,
      trend: r.trend,
      assessed_at: new Date(now).toISOString(),
    }))
  );
  if (riskError) throw new Error(riskError.message);

  // 4) data_layers (org-scoped)
  const { error: layerError } = await supabase.from("data_layers").insert(
    seedDataLayers.map((l) => ({
      org_id: orgId,
      name: l.name,
      layer_type: l.type,
      source_api: l.source,
      refresh_interval: l.refreshInterval,
      active: l.status === "active",
      config: { coverage: l.coverage, last_refresh: shift(l.lastRefresh) },
    }))
  );
  if (layerError) throw new Error(layerError.message);

  // 5) One sample report (org-scoped)
  const sample = seedReports[0];
  const { error: reportError } = await supabase.from("reports").insert({
    org_id: orgId,
    name: sample.title,
    report_type: sample.type,
    content: {
      summary: sample.summary,
      assets_covered: sample.assetsCovered,
      body: sample.content,
    },
    generated_at: new Date(now).toISOString(),
    shared_with: [],
  });
  if (reportError) throw new Error(reportError.message);
}
