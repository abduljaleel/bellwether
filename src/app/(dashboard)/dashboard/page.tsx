"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  getRiskBadgeVariant,
  type Asset,
  type AnomalyEvent,
  type DataLayer,
} from "@/lib/data/geospatial";
import {
  listAssets,
  listAnomalies,
  listLayers,
  getCurrentUser,
  seedDemoData,
} from "@/lib/data/api";

export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [layers, setLayers] = useState<DataLayer[]>([]);
  const [userLabel, setUserLabel] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [a, e, l, u] = await Promise.all([
        listAssets(),
        listAnomalies(),
        listLayers(),
        getCurrentUser(),
      ]);
      setAssets(a);
      setEvents(e);
      setLayers(l);
      setUserLabel(u.fullName || u.email || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSeed() {
    setSeeding(true);
    setError(null);
    try {
      await seedDemoData();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load demo data");
    } finally {
      setSeeding(false);
    }
  }

  const activeAnomalies = events.filter((e) => e.status === "active");
  const avgRisk = assets.length
    ? Math.round(assets.reduce((sum, a) => sum + a.riskScore, 0) / assets.length)
    : 0;
  const activeLayers = layers.filter((l) => l.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Geospatial intelligence overview{userLabel ? <> &mdash; {userLabel}</> : null}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monitored Assets"
          value={loading ? "—" : String(assets.length)}
          description="Facilities, pipelines, zones"
        />
        <MetricCard
          title="Active Anomalies"
          value={loading ? "—" : String(activeAnomalies.length)}
          description="Requiring attention"
        />
        <MetricCard
          title="Avg Risk Score"
          value={loading ? "—" : String(avgRisk)}
          description="Across all assets (0-100)"
        />
        <MetricCard
          title="Data Layers"
          value={loading ? "—" : String(activeLayers)}
          description="Active satellite and weather feeds"
        />
      </div>

      {/* Asset list with risk badges */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Assets</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground">
                No monitored assets yet. Load the demo portfolio to explore
                Bellwether with sample assets, anomalies, and risk data.
              </p>
              <Button onClick={handleSeed} disabled={seeding}>
                {seeding ? "Loading demo data..." : "Load demo data"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assets.map((asset) => (
              <Link key={asset.id} href={`/assets/${asset.id}`}>
                <Card className="hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {asset.name}
                    </CardTitle>
                    <Badge variant={getRiskBadgeVariant(asset.riskScore)} className="text-xs">
                      Risk: {asset.riskScore}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Type</p>
                        <p className="font-medium capitalize">{asset.type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Location</p>
                        <p className="font-medium truncate">{asset.location}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Sector</p>
                        <p className="font-medium capitalize">{asset.sector}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
