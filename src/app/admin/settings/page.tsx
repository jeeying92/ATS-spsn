"use client";

import { useEffect, useState, useCallback } from "react";
import { CompanySettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Upload, Image, MapPin, Eye, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [address, setAddress] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data);
    setVision(data.vision || "");
    setMission(data.mission || "");
    setAddress(data.address || "");
    setLogoPreview(data.logo_url);
    setPhotoPreview(data.company_photo_url);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (url: string | null) => void
  ) {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const formData = new FormData();
    formData.append("vision", vision);
    formData.append("mission", mission);
    formData.append("address", address);
    if (logoFile) formData.append("logo", logoFile);
    if (photoFile) formData.append("company_photo", photoFile);

    await fetch("/api/settings", { method: "PUT", body: formData });

    setSaving(false);
    setSaved(true);
    setLogoFile(null);
    setPhotoFile(null);
    fetchSettings();
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return <div className="text-center py-12 text-muted">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Company Settings</h1>
          <p className="text-sm text-muted mt-1">Manage company branding and information</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          {saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              Company Logo
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center text-muted">
                    <Upload className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">No logo</span>
                  </div>
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)}
                  />
                </label>
                <p className="text-xs text-muted mt-2">
                  PNG, JPG, or SVG. Recommended: 200x200px or larger, square format.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Photo */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              Company Photo
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="w-full h-48 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-gray-50 overflow-hidden">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Company photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-muted">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm">No company photo uploaded</span>
                  </div>
                )}
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, setPhotoFile, setPhotoPreview)}
                />
              </label>
              <p className="text-xs text-muted">
                A photo of your facility, team, or building. Displayed on the careers page.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vision */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Vision & Mission
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              label="Vision"
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={3}
              placeholder="Our company vision..."
            />
            <Textarea
              label="Mission"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={4}
              placeholder="Our company mission..."
            />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location / Address
            </h2>
          </CardHeader>
          <CardContent>
            <Textarea
              label="Company Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Full company address..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
