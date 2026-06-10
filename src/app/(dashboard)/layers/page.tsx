"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, type DataLayer, type LayerType } from "@/lib/data/geospatial";
import {
  listLayers,
  createLayer,
  setLayerActive,
  deleteLayer,
} from "@/lib/data/api";

const LAYER_TYPE_OPTIONS: LayerType[] = [
  "satellite",
  "weather",
  "elevation",
  "landuse",
];

export default function LayersPage() {
  const [layers, setLayers] = useState<DataLayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<LayerType>("satellite");
  const [source, setSource] = useState("");
  const [refreshInterval, setRefreshInterval] = useState("");
  const [coverage, setCoverage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listLayers();
        if (!cancelled) setLayers(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load layers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleLayer(layer: DataLayer) {
    setBusyId(layer.id);
    setError(null);
    try {
      const updated = await setLayerActive(layer.id, layer.status !== "active");
      setLayers((prev) => prev.map((l) => (l.id === layer.id ? updated : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update layer");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await deleteLayer(id);
      setLayers((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete layer");
    } finally {
      setBusyId(null);
    }
  }

  function resetForm() {
    setName("");
    setType("satellite");
    setSource("");
    setRefreshInterval("");
    setCoverage("");
    setFormError(null);
  }

  async function handleCreate() {
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await createLayer({
        name: name.trim(),
        type,
        source: source.trim(),
        refreshInterval: refreshInterval.trim(),
        coverage: coverage.trim(),
      });
      setLayers((prev) => [...prev, created]);
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create layer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Layers</h1>
          <p className="text-muted-foreground">
            Satellite, weather, and geographic data feeds
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Add Layer</Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Active Layers ({layers.filter((l) => l.status === "active").length} /{" "}
            {layers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : layers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No data layers configured yet. Add a layer to start ingesting feeds.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Refresh</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Last Refresh</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {layers.map((layer) => (
                  <TableRow key={layer.id}>
                    <TableCell className="font-medium">{layer.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-xs">
                        {layer.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {layer.source}
                    </TableCell>
                    <TableCell className="text-sm">{layer.refreshInterval}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-40 truncate">
                      {layer.coverage}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(layer.lastRefresh)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant={layer.status === "active" ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleLayer(layer)}
                          disabled={busyId === layer.id}
                        >
                          {layer.status === "active" ? "On" : "Off"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(layer.id)}
                          disabled={busyId === layer.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Data Layer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="layer-name">Name</Label>
              <Input
                id="layer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sentinel-2 Optical"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType((v as LayerType) ?? "satellite")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYER_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="layer-refresh">Refresh Interval</Label>
                <Input
                  id="layer-refresh"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  placeholder="5 days"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="layer-source">Source</Label>
              <Input
                id="layer-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="ESA Copernicus"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="layer-coverage">Coverage</Label>
              <Input
                id="layer-coverage"
                value={coverage}
                onChange={(e) => setCoverage(e.target.value)}
                placeholder="Global, 10m resolution"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Adding..." : "Add Layer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
