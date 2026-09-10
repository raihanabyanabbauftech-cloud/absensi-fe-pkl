"use client";

import { useCallback, useEffect, useState } from "react";
import ProfileForm from "./ProfileForm";
import AccountSummary from "./AccountSummary";
import SecurityForm from "./SecurityForm";
import SelfFacePanel from "./SelfFacePanel";
import { getMyProfile, type EmployeeProfile } from "@/lib/services/employee";

interface Props {
  isSaving: boolean;
  onSavingChange: (saving: boolean) => void;
  resetSignal: number;
  onAvatarChange: (dataUrl: string) => void;
  avatar?: string | null;
}

export default function SettingsContent({
  isSaving,
  onSavingChange,
  resetSignal,
  onAvatarChange,
  avatar,
}: Props) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error("Fetch employee profile error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProfileForm
            profile={profile}
            isLoading={isLoading}
            isSaving={isSaving}
            onSavingChange={onSavingChange}
            onProfileUpdated={loadProfile}
            resetSignal={resetSignal}
            onAvatarChange={onAvatarChange}
            avatar={avatar}
          />
        </div>
        <div>
          <AccountSummary profile={profile} isLoading={isLoading} />
        </div>
      </div>

      <SecurityForm />

      <SelfFacePanel />
    </div>
  );
}
