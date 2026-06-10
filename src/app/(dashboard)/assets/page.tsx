"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
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
import {
  getRiskBadgeVariant,
  formatDateShort,
  type Asset,
  type AssetType,
} from "@/lib/data/geospatial";
import { listAssets, createAsset } from "@/lib/data/api";

const ASSET_TYPE_OPTIONS: AssetType[] = [
  "facility",
  "pipeline",
  "field",
  "coastline",
  "forest",
  "mine",
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("facility");
  const [location, setLocation] = useState("");
  const [sector, setSector] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAssets();
        if (!cancelled) setAssets(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load assets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setName("");
    setType("facility");
    setLocation("");
    setSector("");
    setLatitude("");
    setLongitude("");
    setDescription("");
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
      const created = await createAsset({
        name: name.trim(),
        type,
        location: location.trim(),
        sector: sector.trim(),
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0,
        description: description.trim(),
      });
      setAssets((prev) => [...prev, created]);
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create asset");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            All monitored geospatial assets
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Add Asset</Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Monitored Assets ({assets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No assets yet. Add your first asset to begin monitoring.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Risk Score</TableHead>
                  <TableHead>Last Checked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Link
                        href={`/assets/${asset.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {asset.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-xs">
                        {asset.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-48 truncate">
                      {asset.location}
                    </TableCell>
                    <TableCell className="capitalize text-sm">
                      {asset.sector}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={getRiskBadgeVariant(asset.riskScore)}
                        className="text-xs font-mono"
                      >
                        {asset.riskScore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateShort(asset.lastChecked)}
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
            <DialogTitle>Add Asset</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="asset-name">Name</Label>
              <Input
                id="asset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="North Sea Platform Alpha"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType((v as AssetType) ?? "facility")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="asset-sector">Sector</Label>
                <Input
                  id="asset-sector"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="infrastructure"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="asset-location">Location</Label>
              <Input
                id="asset-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="North Sea, UK Sector"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="asset-lat">Latitude</Label>
                <Input
                  id="asset-lat"
                  type="number"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="57.5"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="asset-lng">Longitude</Label>
                <Input
                  id="asset-lng"
                  type="number"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="1.5"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="asset-description">Description</Label>
              <Textarea
                id="asset-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is being monitored and why"
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
              {saving ? "Creating..." : "Create Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
