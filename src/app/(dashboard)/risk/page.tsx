"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getRiskBadgeVariant,
  type Asset,
  type RiskAssessment,
} from "@/lib/data/geospatial";
import { listAssets, listRiskAssessments } from "@/lib/data/api";

export default function RiskPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, r] = await Promise.all([listAssets(), listRiskAssessments()]);
        if (cancelled) return;
        setAssets(a);
        setRiskAssessments(r);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load risk data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ranked = [...assets].sort((a, b) => b.riskScore - a.riskScore);

  // Distribution
  const critical = assets.filter((a) => a.riskScore >= 80).length;
  const high = assets.filter((a) => a.riskScore >= 60 && a.riskScore < 80).length;
  const medium = assets.filter((a) => a.riskScore >= 30 && a.riskScore < 60).length;
  const low = assets.filter((a) => a.riskScore < 30).length;

  const distribution = [
    { label: "Critical (80+)", count: critical, color: "bg-red-500" },
    { label: "High (60-79)", count: high, color: "bg-orange-500" },
    { label: "Medium (30-59)", count: medium, color: "bg-amber-500" },
    { label: "Low (<30)", count: low, color: "bg-emerald-500" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Intelligence</h1>
          <p className="text-muted-foreground">
            Portfolio risk ranking and distribution
          </p>
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Intelligence</h1>
        <p className="text-muted-foreground">
          Portfolio risk ranking and distribution
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Distribution chart */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No monitored assets yet. Add assets to build the risk picture.
            </p>
          ) : (
            <div className="flex items-end gap-6 h-40 justify-center">
              {distribution.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-1 w-24">
                  <span className="text-sm font-bold">{d.count}</span>
                  <div
                    className={`w-16 rounded-t ${d.color}`}
                    style={{
                      height: `${Math.max((d.count / assets.length) * 100, 4)}%`,
                      minHeight: d.count > 0 ? "8px" : "0",
                    }}
                  />
                  <span className="text-xs text-muted-foreground text-center">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No assets to rank yet.
            </p>
          ) : (
            <div className="space-y-3">
              {ranked.map((asset, i) => {
                const ra = riskAssessments.find((r) => r.assetId === asset.id);
                return (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-mono text-muted-foreground w-8">
                        #{i + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{asset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.type} &middot; {asset.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {ra && (
                        <Badge
                          variant={
                            ra.trend === "worsening"
                              ? "destructive"
                              : ra.trend === "improving"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize text-xs"
                        >
                          {ra.trend}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              asset.riskScore >= 70
                                ? "bg-red-500"
                                : asset.riskScore >= 40
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${asset.riskScore}%` }}
                          />
                        </div>
                        <Badge
                          variant={getRiskBadgeVariant(asset.riskScore)}
                          className="font-mono text-xs w-10 justify-center"
                        >
                          {asset.riskScore}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
