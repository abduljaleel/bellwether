"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSeverityColor,
  formatDate,
  type AnomalyEvent,
} from "@/lib/data/geospatial";
import { listAnomalies, resolveAnomaly } from "@/lib/data/api";

export default function AnomaliesPage() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAnomalies();
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load anomalies");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleResolve(id: string) {
    setResolvingId(id);
    setError(null);
    try {
      const updated = await resolveAnomaly(id);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve anomaly");
    } finally {
      setResolvingId(null);
    }
  }

  const filtered = events
    .filter((e) => {
      if (severityFilter !== "all" && e.severity !== severityFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Anomalies</h1>
        <p className="text-muted-foreground">
          Detected anomaly events across all assets
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chronological feed */}
      <div className="space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : (
          <>
            {filtered.map((event) => (
              <Card
                key={event.id}
                className={`border-l-4 ${getSeverityColor(event.severity)}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {event.assetName}
                      </span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {event.type.replace("_", " ")}
                      </Badge>
                      <Badge
                        variant={
                          event.severity === "critical" || event.severity === "high"
                            ? "destructive"
                            : "outline"
                        }
                        className="capitalize text-xs"
                      >
                        {event.severity}
                      </Badge>
                      <Badge
                        variant={event.status === "active" ? "default" : "secondary"}
                        className="capitalize text-xs"
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(event.detectedAt)}
                      </span>
                      {event.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(event.id)}
                          disabled={resolvingId === event.id}
                        >
                          {resolvingId === event.id ? "Resolving..." : "Resolve"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm">{event.description}</p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>Source: {event.source}</span>
                    <span>Confidence: {event.confidence}%</span>
                    {event.affectedArea && <span>Area: {event.affectedArea}</span>}
                  </div>
                  {event.recommendedActions.length > 0 && (
                    <div className="mt-3 border-t pt-2">
                      <p className="text-xs font-medium mb-1">Recommended Actions</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {event.recommendedActions.map((action, i) => (
                          <li key={i}>&bull; {action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {events.length === 0
                    ? "No anomalies detected yet"
                    : "No anomalies match your filters"}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
