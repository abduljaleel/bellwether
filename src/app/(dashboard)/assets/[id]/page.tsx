"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getRiskBadgeVariant,
  getSeverityColor,
  formatDate,
  type Asset,
  type AnomalyEvent,
  type RiskAssessment,
} from "@/lib/data/geospatial";
import {
  getAsset,
  listAnomaliesForAsset,
  getLatestRiskForAsset,
} from "@/lib/data/api";

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) return;
    let cancelled = false;
    (async () => {
      try {
        const [a, e, r] = await Promise.all([
          getAsset(assetId),
          listAnomaliesForAsset(assetId),
          getLatestRiskForAsset(assetId),
        ]);
        if (cancelled) return;
        setAsset(a);
        setEvents(e);
        setRisk(r);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load asset");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Asset</h1>
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Asset Not Found</h1>
        <p className="text-muted-foreground">
          No asset with ID &quot;{assetId}&quot; exists.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
          <p className="text-muted-foreground">{asset.location}</p>
        </div>
        <Badge
          variant={getRiskBadgeVariant(asset.riskScore)}
          className="text-sm px-3 py-1"
        >
          Risk: {asset.riskScore}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{asset.type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sector</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{asset.sector}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coordinates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono">
              {asset.latitude.toFixed(2)}, {asset.longitude.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Checked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{formatDate(asset.lastChecked)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monitor">
        <TabsList>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>

        {/* Monitor tab: risk gauge SVG */}
        <TabsContent value="monitor" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Gauge</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative h-48 w-48">
                <svg viewBox="0 0 200 120" className="w-48 h-auto">
                  {/* Background arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="text-muted"
                  />
                  {/* Filled arc (proportional to risk) */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(asset.riskScore / 100) * 251.2} 251.2`}
                    className={
                      asset.riskScore >= 70
                        ? "text-red-500"
                        : asset.riskScore >= 40
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }
                  />
                  <text
                    x="100"
                    y="90"
                    textAnchor="middle"
                    className="fill-current text-3xl font-bold"
                    fontSize="36"
                  >
                    {asset.riskScore}
                  </text>
                  <text
                    x="100"
                    y="110"
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize="12"
                  >
                    Risk Score
                  </text>
                </svg>
              </div>
              <p className="mt-4 text-sm text-muted-foreground max-w-md text-center">
                {asset.description}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events tab: timeline */}
        <TabsContent value="events" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No events recorded for this asset
                </p>
              ) : (
                <div className="space-y-4">
                  {events
                    .sort(
                      (a, b) =>
                        new Date(b.detectedAt).getTime() -
                        new Date(a.detectedAt).getTime()
                    )
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`rounded-lg border p-4 ${getSeverityColor(event.severity)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize text-xs">
                              {event.type.replace("_", " ")}
                            </Badge>
                            <Badge
                              variant={
                                event.severity === "critical"
                                  ? "destructive"
                                  : event.severity === "high"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="capitalize text-xs"
                            >
                              {event.severity}
                            </Badge>
                            <Badge
                              variant={
                                event.status === "active" ? "default" : "secondary"
                              }
                              className="capitalize text-xs"
                            >
                              {event.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(event.detectedAt)}
                          </span>
                        </div>
                        <p className="text-sm">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Source: {event.source} &middot; Confidence:{" "}
                          {event.confidence}%
                          {event.affectedArea && (
                            <> &middot; Area: {event.affectedArea}</>
                          )}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk tab: factor breakdown */}
        <TabsContent value="risk" className="mt-4">
          {risk ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Risk Assessment</CardTitle>
                  <Badge
                    variant={
                      risk.trend === "worsening"
                        ? "destructive"
                        : risk.trend === "improving"
                        ? "default"
                        : "secondary"
                    }
                    className="capitalize"
                  >
                    {risk.trend}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold">{risk.overallScore}</p>
                  <p className="text-sm text-muted-foreground">
                    Overall Risk Score
                  </p>
                </div>
                <div className="space-y-3">
                  {risk.factors.map((factor) => (
                    <div key={factor.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{factor.name}</span>
                        <span className="text-muted-foreground">
                          {factor.score} (weight: {(factor.weight * 100).toFixed(0)}
                          %)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            factor.score >= 70
                              ? "bg-red-500"
                              : factor.score >= 40
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No risk assessment available
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
