"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "@/lib/clsx";
import { MOOD, MOOD_KEYS } from "@/lib/mood";

const ONBOARDED_KEY = "walkq:onboarded";

const SLIDES = [
  {
    headline: "찍기만 하세요.\n문장은 AI가 씁니다",
    sub: "산책하다 마음에 든 장면을 찍으면 한 줄이 붙습니다",
  },
  {
    headline: "찍은 자리마다\n핀이 쌓입니다",
    sub: "걸어온 길이 지도 위에 기록으로 남습니다",
  },
  {
    headline: "내가 어떤 걸 찍는\n사람인지 알게 됩니다",
    sub: "태그와 무드가 모여 나를 보여줍니다",
  },
] as const;

// PRD 7.2 — 온보딩은 로그인 전, 최초 1회만. [건너뛰기]는 1장부터 항상 노출한다.
export function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollingRef = useRef(false);

  const complete = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    router.replace("/login");
  }, [router]);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    scrollingRef.current = true;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    setIndex(i);
    window.setTimeout(() => {
      scrollingRef.current = false;
    }, 400);
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollingRef.current) return;
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    setIndex((prev) => (prev === i ? prev : i));
  }, []);

  const isLast = index === SLIDES.length - 1;

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg)]">
      <div className="flex justify-end px-5" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
        <button type="button" onClick={complete} className="text-meta text-[var(--ink-muted)] py-2 px-1">
          건너뛰기
        </button>
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((slide, i) => (
          <div key={i} className="w-full shrink-0 snap-center flex flex-col items-center justify-center gap-8 px-8 text-center">
            <OnboardVisual step={i} active={index === i} />
            <div className="flex flex-col gap-3">
              <h1 className="text-onboard-h text-[var(--ink)] whitespace-pre-line">{slide.headline}</h1>
              <p className="text-body text-[var(--ink-muted)]">{slide.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex flex-col items-center gap-6 px-8"
        style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={clsx(
                "w-2 h-2 rounded-full transition-colors",
                i === index ? "bg-[var(--accent)]" : "bg-[var(--line-strong)]"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => (isLast ? complete() : goTo(index + 1))}
          className="w-full h-[52px] rounded-[var(--radius-btn)] bg-[var(--accent)] text-[var(--on-accent)] text-[15px] font-semibold active:bg-[var(--accent-hover)]"
        >
          {isLast ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}

function OnboardVisual({ step, active }: { step: number; active: boolean }) {
  if (step === 0) return <CaptionVisual active={active} />;
  if (step === 1) return <MapVisual active={active} />;
  return <MoodVisual active={active} />;
}

function CaptionVisual({ active }: { active: boolean }) {
  return (
    <div key={active ? "on" : "off"} className="flex flex-col items-center gap-4">
      <div
        className="w-[220px] h-[220px] rounded-[var(--radius-photo-onboard)] bg-gradient-to-br from-[var(--surface-sunk)] to-[var(--line)]"
        style={{ boxShadow: "var(--shadow-onboard-photo)" }}
      />
      {active ? (
        <p
          className="text-caption text-[var(--ink)]"
          style={{ animation: "onboardFadeUp 420ms ease-out 220ms both" }}
        >
          담장은 오후를 견디는 중이었다
        </p>
      ) : (
        <p className="text-caption text-transparent">.</p>
      )}
    </div>
  );
}

function MapVisual({ active }: { active: boolean }) {
  const pins: Array<{ top: string; left: string; mood: (typeof MOOD_KEYS)[number]; delay: number }> = [
    { top: "22%", left: "28%", mood: "fresh", delay: 80 },
    { top: "58%", left: "62%", mood: "warm", delay: 200 },
    { top: "38%", left: "70%", mood: "calm", delay: 320 },
    { top: "70%", left: "24%", mood: "lively", delay: 440 },
  ];

  return (
    <div
      key={active ? "on" : "off"}
      className="relative w-[220px] h-[220px] rounded-[var(--radius-photo-onboard)] bg-[var(--surface-sunk)] overflow-hidden"
      style={{ boxShadow: "var(--shadow-onboard-photo)" }}
    >
      {pins.map((pin, i) => (
        <span
          key={i}
          className="absolute w-4 h-4 rounded-full bg-[var(--surface)]"
          style={{
            top: pin.top,
            left: pin.left,
            border: `2px solid ${MOOD[pin.mood].hex}`,
            boxShadow: "var(--shadow-pin)",
            animation: active ? `onboardPopIn 280ms ease-out ${pin.delay}ms both` : undefined,
            opacity: active ? undefined : 0,
          }}
        />
      ))}
    </div>
  );
}

function MoodVisual({ active }: { active: boolean }) {
  const slice = 100 / MOOD_KEYS.length;
  const gradient = MOOD_KEYS.map((key, i) => `${MOOD[key].hex} ${i * slice}% ${(i + 1) * slice}%`).join(", ");
  const previewTags = ["골목", "오후빛", "고요"];

  return (
    <div key={active ? "on" : "off"} className="flex flex-col items-center gap-5">
      <div
        className="relative w-[140px] h-[140px] rounded-full"
        style={{
          background: `conic-gradient(${gradient})`,
          animation: active ? "onboardPopIn 360ms ease-out both" : undefined,
        }}
      >
        <div className="absolute inset-[18px] rounded-full bg-[var(--bg)]" />
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-center max-w-[220px]">
        {previewTags.map((tag, i) => (
          <span
            key={tag}
            className="px-3 py-1.5 rounded-[var(--radius-pill)] bg-[var(--surface)] text-[var(--ink-muted)] text-label"
            style={{
              boxShadow: "var(--shadow-badge)",
              animation: active ? `onboardFadeUp 320ms ease-out ${180 + i * 100}ms both` : undefined,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
