'use client';

import { useEffect, useMemo, useState } from 'react';

const fallbackProfile = {
  display_name: 'Creator',
  avatar_url: null as string | null,
};

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export function ProfileCard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initials = useMemo(() => {
    const name = profile?.display_name || fallbackProfile.display_name;
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return 'BB';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'B';
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [profile?.display_name]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load profile');
      }
      setProfile(data.profile);
      setDisplayName(data.profile?.display_name || '');
      setAvatarUrl(data.profile?.avatar_url || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          avatarUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      setProfile(data.profile);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setDisplayName(profile?.display_name || '');
    setAvatarUrl(profile?.avatar_url || '');
    setError(null);
  };

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-text-muted/10 bg-bg-secondary/60 p-4">
        <div className="h-16 shimmer-loading rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-text-muted/10 bg-bg-secondary/60 p-4">
      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent-gold/40 bg-bg-tertiary text-sm font-semibold text-accent-gold">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Profile</p>
          <p className="mt-1 text-lg text-text-primary">
            {profile?.display_name || fallbackProfile.display_name}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary h-9"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
      </div>

      {editing && (
        <div className="mt-4 space-y-3">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}
          <div>
            <label className="label-gold" htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              className="input-base mt-2"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your studio name"
            />
          </div>
          <div>
            <label className="label-gold" htmlFor="avatarUrl">
              Avatar URL
            </label>
            <input
              id="avatarUrl"
              type="url"
              className="input-base mt-2"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editing && error && (
        <div className="mt-3 text-xs text-red-300">{error}</div>
      )}
    </div>
  );
}
