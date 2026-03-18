"use client"

import { useState, useRef } from "react"
import { Camera, MapPin, Briefcase, Phone, Globe, Loader2 } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateProfile, uploadAvatar } from "@/lib/actions/profile"
import type { Profile } from "@/lib/types/profile"

interface ProfileEditorProps {
  user: {
    id: string
    email: string
    name: string
    avatarUrl?: string | null
  }
  profile: Profile | null
}

function getInitials(name: string, email: string): string {
  if (name && name !== "User") {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  }
  return email[0]?.toUpperCase() ?? "?"
}

export function ProfileEditor({ user, profile }: ProfileEditorProps) {
  const [bio, setBio] = useState(profile?.bio ?? "")
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [location, setLocation] = useState(profile?.location ?? "")
  const [website, setWebsite] = useState(profile?.website ?? "")
  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatar_url ?? user.avatarUrl ?? null
  )
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    const fd = new FormData()
    fd.set("avatar", file)

    const { url, error } = await uploadAvatar(fd)
    setUploading(false)

    if (error) {
      setMessage({ type: "error", text: error })
      return
    }

    if (url) {
      setAvatarUrl(url)
      setMessage({ type: "success", text: "Avatar updated" })
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const { error } = await updateProfile({
      bio: bio || null,
      job_title: jobTitle || null,
      phone: phone || null,
      location: location || null,
      website: website || null,
      avatar_url: avatarUrl,
    })

    setSaving(false)

    if (error) {
      setMessage({ type: "error", text: error })
    } else {
      setMessage({ type: "success", text: "Profile saved" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar + Name Section */}
      <div className="flex items-start gap-5">
        <div className="relative group">
          <Avatar className="h-20 w-20 ring-1 ring-[var(--border)]">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} />}
            <AvatarFallback className="bg-[rgba(212,115,78,0.1)] text-[var(--accent)] text-xl font-light">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-[rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        <div className="flex-1 min-w-0 pt-1">
          <p className="text-[1.05rem] text-[var(--text)] font-normal truncate">{user.name}</p>
          <p className="text-[0.78rem] text-[var(--text-dim)] font-light mt-0.5 truncate">
            {user.email}
          </p>
          <p className="text-[0.68rem] text-[var(--text-dim)] font-light mt-2">
            Click avatar to upload a new photo (max 2MB)
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {/* Job Title */}
        <div>
          <label className="flex items-center gap-1.5 text-[0.72rem] text-[var(--text-dim)] font-light mb-1.5">
            <Briefcase className="h-3 w-3" strokeWidth={1.5} />
            Job Title
          </label>
          <Input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Creative Director"
            maxLength={100}
            className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.84rem] font-light placeholder:text-[var(--text-dim)]"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="flex items-center justify-between text-[0.72rem] text-[var(--text-dim)] font-light mb-1.5">
            <span>Bio</span>
            <span>{bio.length}/500</span>
          </label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell your team a little about yourself..."
            maxLength={500}
            rows={3}
            className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.84rem] font-light placeholder:text-[var(--text-dim)] resize-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="flex items-center gap-1.5 text-[0.72rem] text-[var(--text-dim)] font-light mb-1.5">
            <Phone className="h-3 w-3" strokeWidth={1.5} />
            Phone
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            maxLength={30}
            className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.84rem] font-light placeholder:text-[var(--text-dim)]"
          />
        </div>

        {/* Location */}
        <div>
          <label className="flex items-center gap-1.5 text-[0.72rem] text-[var(--text-dim)] font-light mb-1.5">
            <MapPin className="h-3 w-3" strokeWidth={1.5} />
            Location
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. New York, NY"
            maxLength={100}
            className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.84rem] font-light placeholder:text-[var(--text-dim)]"
          />
        </div>

        {/* Website */}
        <div>
          <label className="flex items-center gap-1.5 text-[0.72rem] text-[var(--text-dim)] font-light mb-1.5">
            <Globe className="h-3 w-3" strokeWidth={1.5} />
            Website
          </label>
          <Input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yoursite.com"
            maxLength={200}
            className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.84rem] font-light placeholder:text-[var(--text-dim)]"
          />
        </div>
      </div>

      {/* Save Button + Message */}
      <div className="flex items-center justify-between pt-2">
        {message && (
          <p
            className={`text-[0.78rem] font-light ${
              message.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-[0.82rem] font-medium text-white transition-colors hover:bg-[rgba(212,115,78,0.85)] disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  )
}
