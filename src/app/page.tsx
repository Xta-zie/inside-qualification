"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Target,
  Users,
  BarChart3,
  UserCircle,
  ClipboardCheck,
  FileText,
  ChevronRight,
} from "lucide-react";

function useAnimateOnScroll() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.15 }
    );

    const children = el.querySelectorAll(".animate-on-scroll");
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function HomePage() {
  const featuresRef = useAnimateOnScroll();
  const stepsRef = useAnimateOnScroll();

  return (
    <>
      <style jsx global>{`
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .animate-on-scroll.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .animate-on-scroll:nth-child(2) {
          transition-delay: 0.12s;
        }
        .animate-on-scroll:nth-child(3) {
          transition-delay: 0.24s;
        }
        .hero-fade-in {
          animation: heroFadeIn 0.8s ease-out both;
        }
        .hero-fade-in-delay {
          animation: heroFadeIn 0.8s ease-out 0.2s both;
        }
        .hero-fade-in-delay-2 {
          animation: heroFadeIn 0.8s ease-out 0.4s both;
        }
        @keyframes heroFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dot-pattern {
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.08) 1px,
            transparent 1px
          );
          background-size: 24px 24px;
        }
      `}</style>

      {/* ───── NAVBAR ───── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-baseline gap-1">
            <span
              className="text-2xl tracking-wide text-inside-blue"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              INSIDE
            </span>
            <span
              className="text-lg tracking-wide text-inside-cyan"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Academy
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/api/auth/signin"
              className="rounded-lg border-2 border-inside-blue px-5 py-2 text-sm font-semibold text-inside-blue transition-colors hover:bg-inside-blue/5"
            >
              Se connecter
            </Link>
            <Link
              href="/assessment"
              className="rounded-lg bg-inside-pink px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-inside-pink/90"
            >
              Commencer l&apos;&eacute;valuation
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-inside-blue to-[#002e4f] py-28 md:py-36">
        {/* dot pattern overlay */}
        <div className="dot-pattern absolute inset-0 pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h1
            className="hero-fade-in text-5xl md:text-7xl tracking-wider text-white leading-tight"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            &Eacute;valuez vos comp&eacute;tences
            <br />
            <span className="text-inside-cyan">OpenStack</span>
          </h1>

          <p className="hero-fade-in-delay mx-auto mt-6 max-w-2xl text-lg text-white/75 leading-relaxed">
            Identifiez vos forces, comblez vos lacunes et construisez votre
            parcours de mont&eacute;e en comp&eacute;tences personnalis&eacute;.
          </p>

          <div className="hero-fade-in-delay-2 mt-10">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-2 rounded-full bg-inside-pink px-10 py-4 text-lg font-bold text-white shadow-lg shadow-inside-pink/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-inside-pink/40"
            >
              D&eacute;marrer l&apos;audit
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full"
          >
            <path
              d="M0 80V40C240 0 480 0 720 40C960 80 1200 80 1440 40V80H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section ref={featuresRef} className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2
            className="text-center text-4xl tracking-wide text-inside-blue mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Une &eacute;valuation compl&egrave;te
          </h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-gray-500">
            Trois dimensions cl&eacute;s pour cartographier pr&eacute;cis&eacute;ment
            votre niveau OpenStack.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Card 1 */}
            <div className="animate-on-scroll group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-inside-purple/10">
                <Target className="h-7 w-7 text-inside-purple" />
              </div>
              <h3
                className="mb-2 text-2xl tracking-wide text-gray-900"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                12 Axes de Comp&eacute;tences
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                De Linux &agrave; Ceph, en passant par Nova, Neutron et
                Ansible&nbsp;&mdash;&nbsp;couvrez l&apos;ensemble de
                l&apos;&eacute;cosyst&egrave;me.
              </p>
            </div>

            {/* Card 2 */}
            <div className="animate-on-scroll group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-inside-cyan/15">
                <Users className="h-7 w-7 text-inside-cyan" />
              </div>
              <h3
                className="mb-2 text-2xl tracking-wide text-gray-900"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                3 Profils M&eacute;tier
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                Ing&eacute;nieur Syst&egrave;me, Architecte Cloud,
                Ing&eacute;nieur Production&nbsp;&mdash;&nbsp;choisissez votre
                parcours.
              </p>
            </div>

            {/* Card 3 */}
            <div className="animate-on-scroll group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-inside-pink/10">
                <BarChart3 className="h-7 w-7 text-inside-pink" />
              </div>
              <h3
                className="mb-2 text-2xl tracking-wide text-gray-900"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Rapport D&eacute;taill&eacute;
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                Gap analysis, plan de formation et export PDF
                personnalis&eacute; pour votre &eacute;quipe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section ref={stepsRef} className="bg-gray-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2
            className="text-center text-4xl tracking-wide text-inside-blue mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Comment &ccedil;a marche&nbsp;?
          </h2>
          <p className="mx-auto mb-16 max-w-lg text-center text-gray-500">
            Trois &eacute;tapes simples pour obtenir votre bilan de
            comp&eacute;tences.
          </p>

          <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {/* Connecting line (desktop) */}
            <div className="absolute top-12 left-[16.66%] right-[16.66%] hidden h-0.5 bg-gradient-to-r from-inside-cyan via-inside-purple to-inside-pink md:block" />

            {/* Step 1 */}
            <div className="animate-on-scroll flex flex-col items-center text-center">
              <div className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-inside-cyan/20">
                <UserCircle className="h-10 w-10 text-inside-cyan" />
              </div>
              <span
                className="mb-1 text-sm font-bold uppercase tracking-widest text-inside-cyan"
              >
                &Eacute;tape 1
              </span>
              <h3
                className="mb-2 text-2xl tracking-wide text-gray-900"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Identifiez-vous
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                Cr&eacute;ez votre compte ou connectez-vous pour
                d&eacute;marrer votre &eacute;valuation en toute
                s&eacute;curit&eacute;.
              </p>
            </div>

            {/* Step 2 */}
            <div className="animate-on-scroll flex flex-col items-center text-center">
              <div className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-inside-purple/20">
                <ClipboardCheck className="h-10 w-10 text-inside-purple" />
              </div>
              <span
                className="mb-1 text-sm font-bold uppercase tracking-widest text-inside-purple"
              >
                &Eacute;tape 2
              </span>
              <h3
                className="mb-2 text-2xl tracking-wide text-gray-900"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                R&eacute;pondez au questionnaire
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                &Eacute;valuez vos comp&eacute;tences sur chaque axe
                gr&acirc;ce &agrave; un questionnaire adapt&eacute;
                &agrave; votre profil m&eacute;tier.
              </p>
            </div>

            {/* Step 3 */}
            <div className="animate-on-scroll flex flex-col items-center text-center">
              <div className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-inside-pink/20">
                <FileText className="h-10 w-10 text-inside-pink" />
              </div>
              <span
                className="mb-1 text-sm font-bold uppercase tracking-widest text-inside-pink"
              >
                &Eacute;tape 3
              </span>
              <h3
                className="mb-2 text-2xl tracking-wide text-gray-900"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Obtenez votre rapport
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                Recevez un bilan d&eacute;taill&eacute; avec gap analysis,
                recommandations et plan de formation export&eacute; en PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 text-center">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-xl tracking-wide text-inside-blue"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              INSIDE
            </span>
            <span
              className="text-base tracking-wide text-inside-cyan"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Academy
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Matrice de comp&eacute;tence V2.0
          </p>
          <p className="mt-2 text-xs text-gray-300">
            &copy; {new Date().getFullYear()} INSIDE. Tous droits
            r&eacute;serv&eacute;s.
          </p>
        </div>
      </footer>
    </>
  );
}
