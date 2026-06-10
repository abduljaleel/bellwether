"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Report } from "@/lib/data/geospatial";
import {
  listReports,
  createReport,
  listAssets,
  listAnomalies,
} from "@/lib/data/api";

function getReportTypeVariant(
  type: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "incident":
      return "destructive";
    case "risk_summary":
      return "outline";
    default:
      return "secondary";
  }
}

export default function ReportsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listReports();
        if (!cancelled) setReports(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load reports");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const [assets, events] = await Promise.all([listAssets(), listAnomalies()]);
      const activeAnomalies = events.filter((e) => e.status === "active");
      const avgRisk = assets.length
        ? Math.round(assets.reduce((sum, a) => sum + a.riskScore, 0) / assets.length)
        : 0;
      const criticalCount = assets.filter((a) => a.riskScore >= 80).length;
      const highCount = assets.filter((a) => a.riskScore >= 60 && a.riskScore < 80).length;
      const mediumCount = assets.filter((a) => a.riskScore >= 30 && a.riskScore < 60).length;
      const lowCount = assets.filter((a) => a.riskScore < 30).length;

      const now = new Date();
      const dateLabel = now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      const body = `MONITORING SNAPSHOT
Generated: ${dateLabel} ${now.toISOString().slice(11, 16)} UTC

PORTFOLIO OVERVIEW
- Monitored assets: ${assets.length}
- Active anomalies: ${activeAnomalies.length}
- Average risk score: ${avgRisk}/100

RISK DISTRIBUTION
- Critical (80+): ${criticalCount}
- High (60-79): ${highCount}
- Medium (30-59): ${mediumCount}
- Low (<30): ${lowCount}

ASSET STATUS
${
  assets.length === 0
    ? "No assets under monitoring."
    : assets
        .map((a) => {
          const active = activeAnomalies.filter((e) => e.assetId === a.id).length;
          return `- ${a.name} (${a.type}) — Risk ${a.riskScore}/100, ${active} active anomalies`;
        })
        .join("\n")
}

ACTIVE ANOMALIES
${
  activeAnomalies.length === 0
    ? "No active anomalies."
    : activeAnomalies
        .map(
          (e) =>
            `- [${e.severity.toUpperCase()}] ${e.assetName}: ${e.type.replace(/_/g, " ")} (${e.confidence}% confidence, ${e.source})`
        )
        .join("\n")
}`;

      const created = await createReport({
        title: `Monitoring Snapshot - ${dateLabel}`,
        type: "monitoring",
        summary: `${assets.length} assets monitored, ${activeAnomalies.length} active anomalies, average risk ${avgRisk}/100.`,
        assetsCovered: assets.map((a) => a.name),
        body,
        metrics: {
          asset_count: assets.length,
          active_anomalies: activeAnomalies.length,
          avg_risk: avgRisk,
          distribution: {
            critical: criticalCount,
            high: highCount,
            medium: mediumCount,
            low: lowCount,
          },
        },
      });
      setReports((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Monitoring, incident, and risk reports
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating..." : "Generate Report"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No reports yet. Generate a report to snapshot the current
              monitoring picture.
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={getReportTypeVariant(report.type)}
                        className="capitalize text-xs"
                      >
                        {report.type.replace("_", " ")}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {report.date}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedId(expandedId === report.id ? null : report.id)
                    }
                  >
                    {expandedId === report.id ? "Collapse" : "Expand"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.summary}</p>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {report.assetsCovered.map((asset) => (
                    <Badge key={asset} variant="secondary" className="text-xs">
                      {asset}
                    </Badge>
                  ))}
                </div>
                {expandedId === report.id && (
                  <pre className="mt-4 p-4 bg-muted rounded-md text-xs whitespace-pre-wrap font-mono overflow-auto max-h-96">
                    {report.content}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
