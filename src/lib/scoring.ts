// ============================================================================
// Scoring / analysis logic — pure TypeScript, no React, no DB
// ============================================================================

import type { AnswerMap } from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface GapItem {
  key: string;
  target: number;
  current: number;
  delta: number;
}

export interface StatusBadge {
  text: string;
  colorClass: string;
  bgClass: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Maps each question key to the training module that addresses it. */
export const CATEGORY_TO_MODULE: Record<string, string> = {
  linux_sys: "mod_linux",
  linux_troubleshoot: "mod_linux",
  net_l2_l3: "mod_net",
  net_sdn: "mod_net",
  virt_kvm: "mod_virt",
  os_identity: "mod_os_core",
  os_compute: "mod_os_core",
  os_network: "mod_os_net",
  storage_block: "mod_storage",
  storage_ceph: "mod_storage",
  ops_automation: "mod_ops",
  ops_monitor: "mod_ops",
};

/** Human-readable labels for every axis / question key. */
export const FORMAT_LABELS: Record<string, string> = {
  linux_sys: "Administration Linux",
  linux_troubleshoot: "Troubleshooting Linux",
  net_l2_l3: "Reseaux L2/L3",
  net_sdn: "SDN / Overlay Networks",
  virt_kvm: "Virtualisation KVM",
  os_identity: "Keystone (Identity)",
  os_compute: "Nova (Compute)",
  os_network: "Neutron (Network)",
  storage_block: "Cinder (Block Storage)",
  storage_ceph: "Ceph (Distributed Storage)",
  ops_automation: "Automatisation (Ansible/Terraform)",
  ops_monitor: "Monitoring / Observabilite",
};

// ============================================================================
// Key groups
// ============================================================================

/** Prerequisite question keys (Linux, Network, Virtualisation). */
export function getPrereqKeys(): string[] {
  return ["linux_sys", "linux_troubleshoot", "net_l2_l3", "net_sdn", "virt_kvm"];
}

/** OpenStack-specific question keys. */
export function getOpenstackKeys(): string[] {
  return [
    "os_identity",
    "os_compute",
    "os_network",
    "storage_block",
    "storage_ceph",
    "ops_automation",
    "ops_monitor",
  ];
}

// ============================================================================
// Core calculations
// ============================================================================

/**
 * Computes the gap analysis for every axis present in `targets`.
 * Each item contains the key, target level, current level (from answers,
 * defaulting to 0) and delta (target - current, floored at 0).
 */
export function calculateGapAnalysis(
  answers: AnswerMap,
  targets: Record<string, number>,
): GapItem[] {
  return Object.keys(targets).map((key) => {
    const target = targets[key];
    const current = answers[key] ?? 0;
    return {
      key,
      target,
      current,
      delta: Math.max(0, target - current),
    };
  });
}

/**
 * Returns an overall competency score as a percentage (0-100).
 *
 * Formula: `min(100, round((totalCurrent / totalTarget) * 100))`
 *
 * If `totalTarget` is 0, returns 0 to avoid division by zero.
 */
export function calculateOverallScore(
  answers: AnswerMap,
  targets: Record<string, number>,
): number {
  const keys = Object.keys(targets);
  const totalTarget = keys.reduce((sum, k) => sum + targets[k], 0);
  if (totalTarget === 0) return 0;
  const totalCurrent = keys.reduce((sum, k) => sum + (answers[k] ?? 0), 0);
  return Math.min(100, Math.round((totalCurrent / totalTarget) * 100));
}

/**
 * Returns the arithmetic average of the answer levels for the given keys,
 * rounded to one decimal place.  Returns 0 when the key list is empty.
 */
export function calculateAverageLevel(
  answers: AnswerMap,
  keys: string[],
): number {
  if (keys.length === 0) return 0;
  const total = keys.reduce((sum, k) => sum + (answers[k] ?? 0), 0);
  return Math.round((total / keys.length) * 10) / 10;
}

// ============================================================================
// Status badges
// ============================================================================

/**
 * Prerequisite status badge based on average prerequisite level.
 */
export function getPrereqStatus(avgPrereq: number): StatusBadge {
  if (avgPrereq < 2.0) {
    return {
      text: "BLOQUANT (Niveau insuffisant)",
      colorClass: "text-red-700",
      bgClass: "bg-red-100",
    };
  }
  if (avgPrereq < 3.0) {
    return {
      text: "CONSOLIDATION NECESSAIRE",
      colorClass: "text-yellow-700",
      bgClass: "bg-yellow-100",
    };
  }
  return {
    text: "VALIDE (Niveau suffisant)",
    colorClass: "text-green-700",
    bgClass: "bg-green-100",
  };
}

/**
 * OpenStack status badge based on average OpenStack level.
 */
export function getOpenstackStatus(avgOS: number): StatusBadge {
  if (avgOS < 1.5) {
    return {
      text: "DEBUTANT",
      colorClass: "text-gray-700",
      bgClass: "bg-gray-100",
    };
  }
  if (avgOS < 3.0) {
    return {
      text: "INTERMEDIAIRE",
      colorClass: "text-cyan-700",
      bgClass: "bg-cyan-100",
    };
  }
  return {
    text: "AVANCE",
    colorClass: "text-green-700",
    bgClass: "bg-green-100",
  };
}

// ============================================================================
// Recommendations (plain text, no HTML)
// ============================================================================

/**
 * Returns a plain-text recommendation string for the prerequisite domain.
 */
export function getPrereqRecommendation(avgPrereq: number): string {
  if (avgPrereq < 2.0) {
    return (
      "Les prerequis systeme et reseau sont insuffisants pour aborder la formation OpenStack. " +
      "Une mise a niveau prealable en administration Linux, reseaux et virtualisation est indispensable " +
      "avant de demarrer le cursus."
    );
  }
  if (avgPrereq < 3.0) {
    return (
      "Les bases sont presentes mais necessitent un renforcement. " +
      "Il est recommande de suivre les modules de consolidation Linux et reseau " +
      "en parallele ou avant le debut de la formation OpenStack."
    );
  }
  return (
    "Les prerequis sont valides. Le candidat peut integrer directement " +
    "la formation OpenStack sans mise a niveau prealable."
  );
}

/**
 * Returns a plain-text recommendation string for the OpenStack domain.
 */
export function getOpenstackRecommendation(avgOS: number): string {
  if (avgOS < 1.5) {
    return (
      "Le candidat a peu ou pas d'experience OpenStack. " +
      "Le parcours complet (modules fondamentaux + avances) est recommande, " +
      "en commencant par les services d'identite et de calcul."
    );
  }
  if (avgOS < 3.0) {
    return (
      "Le candidat possede des bases OpenStack. " +
      "Un parcours cible sur les modules presentant les plus grands ecarts " +
      "permettra d'atteindre le niveau requis pour le profil vise."
    );
  }
  return (
    "Le candidat a un niveau avance en OpenStack. " +
    "Seuls des modules de perfectionnement ou de specialisation " +
    "sont necessaires selon le profil cible."
  );
}

// ============================================================================
// Recommended modules
// ============================================================================

/**
 * Given a gap analysis and a category-to-module mapping, returns a
 * deduplicated list of module keys that address identified gaps (delta > 0).
 */
export function getRecommendedModules(
  gaps: GapItem[],
  categoryToModule: Record<string, string> = CATEGORY_TO_MODULE,
): string[] {
  const seen = new Set<string>();
  const modules: string[] = [];

  for (const gap of gaps) {
    if (gap.delta > 0) {
      const mod = categoryToModule[gap.key];
      if (mod && !seen.has(mod)) {
        seen.add(mod);
        modules.push(mod);
      }
    }
  }

  return modules;
}
