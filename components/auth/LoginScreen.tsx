"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseBrowser } from "@/lib/supabase/useBrowserClient";
import { Button } from "@/components/ui/Button";

export function LoginScreen() {
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PRD IA — 온보딩을 아직 안 봤으면 로그인보다 먼저 보여준다
  useEffect(() => {
    const onboarded = typeof window !== "undefined" && localStorage.getItem("walkq:onboarded") === "true";
    if (!onboarded) router.replace("/onboarding");
  }, [router]);

  const handleGoogle = async () => {
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleMagicLink = async () => {
    if (!supabase || !email.trim()) return;
    setBusy(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (authError) {
      setError("로그인 링크를 보내지 못했어요. 다시 시도해주세요.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-8 gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[26px] font-semibold text-[var(--ink)]">워크크</h1>
        <p className="text-body text-[var(--ink-muted)]">산책 중 찍은 장면이 지도·피드·대시보드로 쌓여요</p>
      </div>

      {sent ? (
        <p className="text-body text-[var(--ink)] text-center">메일함을 확인해주세요. 로그인 링크를 보냈어요.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <Button variant="secondary" disabled={busy} onClick={handleGoogle}>
            <span className="font-semibold">G</span> Google로 계속하기
          </Button>

          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              className="w-full h-12 px-4 rounded-[var(--radius-btn)] border border-[var(--line)] bg-[var(--surface)] text-[15px] outline-none focus:border-[var(--accent)]"
            />
            <Button variant="primary" disabled={busy || !email.trim()} onClick={handleMagicLink}>
              이메일 매직링크로 계속하기
            </Button>
          </div>

          {error ? <p className="text-meta text-[var(--error)] text-center">{error}</p> : null}
        </div>
      )}

      <p className="text-meta text-[var(--ink-faint)] text-center">
        계속하면 위치·사진 이용 방식에 동의하는 것으로 간주합니다
      </p>
    </div>
  );
}
