// ============================================================================
// Email notification service — HTML report emails via nodemailer
// ============================================================================

import nodemailer from "nodemailer";

// ============================================================================
// Transporter
// ============================================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============================================================================
// Types
// ============================================================================

interface SendReportEmailParams {
  to: string;
  candidateName: string;
  roleLabel: string;
  overallScore: number;
  avgPrereq: number;
  avgOpenstack: number;
  prereqStatus: string;
  openstackStatus: string;
  prereqRecommendation: string;
  openstackRecommendation: string;
  gaps: Array<{
    label: string;
    current: number;
    target: number;
    delta: number;
  }>;
  modules: Array<{
    title: string;
    providers: Array<{ name: string; type: string; detail: string }>;
  }>;
  assessmentUrl: string;
}

// ============================================================================
// INSIDE brand colors
// ============================================================================

const COLORS = {
  blue: "#00548c",
  pink: "#e31b58",
  cyan: "#6bebf4",
  purple: "#8883f0",
  white: "#ffffff",
  black: "#1a1a1a",
  gray: "#6b7280",
  lightGray: "#f3f4f6",
  green: "#16a34a",
  red: "#dc2626",
  yellow: "#ca8a04",
} as const;

// ============================================================================
// HTML builders
// ============================================================================

function statusColor(status: string): string {
  if (status.includes("BLOQUANT") || status.includes("insuffisant")) {
    return COLORS.red;
  }
  if (status.includes("CONSOLIDATION") || status.includes("NECESSAIRE")) {
    return COLORS.yellow;
  }
  if (status.includes("VALIDE") || status.includes("AVANCE")) {
    return COLORS.green;
  }
  if (status.includes("INTERMEDIAIRE")) {
    return COLORS.blue;
  }
  return COLORS.gray;
}

function statusBgColor(status: string): string {
  if (status.includes("BLOQUANT") || status.includes("insuffisant")) {
    return "#fef2f2";
  }
  if (status.includes("CONSOLIDATION") || status.includes("NECESSAIRE")) {
    return "#fefce8";
  }
  if (status.includes("VALIDE") || status.includes("AVANCE")) {
    return "#f0fdf4";
  }
  if (status.includes("INTERMEDIAIRE")) {
    return "#eff6ff";
  }
  return COLORS.lightGray;
}

function buildGapTable(
  gaps: SendReportEmailParams["gaps"],
): string {
  if (gaps.length === 0) return "";

  const rows = gaps
    .map((g, i) => {
      const bg = i % 2 === 0 ? COLORS.white : COLORS.lightGray;
      const gapCell =
        g.delta === 0
          ? `<span style="color:${COLORS.green};font-weight:bold;">OK</span>`
          : `<span style="color:${COLORS.pink};font-weight:bold;">-${g.delta}</span>`;

      return `
        <tr style="background-color:${bg};">
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${g.label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${g.current}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${g.target}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${gapCell}</td>
        </tr>`;
    })
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;font-size:14px;">
      <thead>
        <tr style="background-color:${COLORS.blue};">
          <th style="padding:10px 12px;text-align:left;color:${COLORS.white};font-weight:bold;">Comp&eacute;tence</th>
          <th style="padding:10px 12px;text-align:center;color:${COLORS.white};font-weight:bold;">Niveau</th>
          <th style="padding:10px 12px;text-align:center;color:${COLORS.white};font-weight:bold;">Cible</th>
          <th style="padding:10px 12px;text-align:center;color:${COLORS.white};font-weight:bold;">&Eacute;cart</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}

function buildModulesSection(
  modules: SendReportEmailParams["modules"],
): string {
  if (modules.length === 0) return "";

  const cards = modules
    .map((mod) => {
      const providerRows =
        mod.providers.length > 0
          ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;font-size:13px;">
              <thead>
                <tr style="background-color:${COLORS.purple};">
                  <th style="padding:6px 10px;text-align:left;color:${COLORS.white};font-size:12px;">Fournisseur</th>
                  <th style="padding:6px 10px;text-align:left;color:${COLORS.white};font-size:12px;">Type</th>
                  <th style="padding:6px 10px;text-align:left;color:${COLORS.white};font-size:12px;">D&eacute;tail</th>
                </tr>
              </thead>
              <tbody>
                ${mod.providers
                  .map(
                    (p, pi) => `
                  <tr style="background-color:${pi % 2 === 0 ? COLORS.white : COLORS.lightGray};">
                    <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb;">${p.name}</td>
                    <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb;">${p.type}</td>
                    <td style="padding:5px 10px;border-bottom:1px solid #e5e7eb;">${p.detail}</td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>`
          : "";

      return `
        <div style="border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin-bottom:12px;">
          <div style="font-size:15px;font-weight:bold;color:${COLORS.purple};margin-bottom:8px;">${mod.title}</div>
          ${providerRows}
        </div>`;
    })
    .join("");

  return `
    <div style="margin-top:24px;">
      <h2 style="font-size:18px;color:${COLORS.blue};border-bottom:2px solid ${COLORS.cyan};padding-bottom:6px;margin-bottom:16px;">
        Modules de Formation Recommand&eacute;s
      </h2>
      ${cards}
    </div>`;
}

// ============================================================================
// Main email builder
// ============================================================================

function buildHtml(params: SendReportEmailParams): string {
  const {
    candidateName,
    roleLabel,
    overallScore,
    avgPrereq,
    avgOpenstack,
    prereqStatus,
    openstackStatus,
    prereqRecommendation,
    openstackRecommendation,
    gaps,
    modules,
    assessmentUrl,
  } = params;

  const prereqColor = statusColor(prereqStatus);
  const prereqBg = statusBgColor(prereqStatus);
  const osColor = statusColor(openstackStatus);
  const osBg = statusBgColor(openstackStatus);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'Audit - ${candidateName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:${COLORS.black};">

  <!-- Header banner -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.blue};">
    <tr>
      <td style="padding:24px 32px;text-align:center;">
        <span style="font-size:28px;font-weight:bold;color:${COLORS.white};letter-spacing:6px;">INSIDE</span>
        <br/>
        <span style="font-size:13px;color:${COLORS.cyan};letter-spacing:1px;">Audit de Comp&eacute;tences OpenStack</span>
      </td>
    </tr>
  </table>

  <!-- Main content container -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background-color:${COLORS.white};border-radius:8px;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:32px;">

              <!-- Greeting -->
              <p style="font-size:15px;line-height:1.6;margin-bottom:24px;">
                Bonjour,<br/><br/>
                Veuillez trouver ci-dessous le rapport d'audit de comp&eacute;tences
                pour <strong>${candidateName}</strong>,
                &eacute;valu&eacute;(e) pour le profil <strong>${roleLabel}</strong>.
              </p>

              <!-- Overall score -->
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;width:100px;height:100px;border-radius:50%;border:4px solid ${COLORS.blue};line-height:100px;font-size:32px;font-weight:bold;color:${COLORS.blue};">
                  ${overallScore}%
                </div>
                <div style="font-size:13px;color:${COLORS.gray};margin-top:6px;">Score Global de Conformit&eacute;</div>
              </div>

              <!-- Status cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="48%" style="vertical-align:top;">
                    <div style="background-color:${prereqBg};border:1px solid #e5e7eb;border-radius:6px;padding:16px;">
                      <div style="font-size:15px;font-weight:bold;color:${COLORS.blue};margin-bottom:6px;">Pr&eacute;requis</div>
                      <div style="font-size:24px;font-weight:bold;color:${COLORS.black};margin-bottom:4px;">${avgPrereq} / 4</div>
                      <div style="font-size:12px;font-weight:bold;color:${prereqColor};">${prereqStatus}</div>
                    </div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="vertical-align:top;">
                    <div style="background-color:${osBg};border:1px solid #e5e7eb;border-radius:6px;padding:16px;">
                      <div style="font-size:15px;font-weight:bold;color:${COLORS.blue};margin-bottom:6px;">OpenStack</div>
                      <div style="font-size:24px;font-weight:bold;color:${COLORS.black};margin-bottom:4px;">${avgOpenstack} / 4</div>
                      <div style="font-size:12px;font-weight:bold;color:${osColor};">${openstackStatus}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Recommendations -->
              <div style="margin-bottom:24px;">
                <h3 style="font-size:14px;color:${COLORS.blue};margin-bottom:8px;">Recommandation Pr&eacute;requis</h3>
                <div style="background-color:#f0f9ff;border-left:3px solid ${COLORS.blue};padding:12px 14px;border-radius:4px;font-size:13px;line-height:1.6;margin-bottom:16px;">
                  ${prereqRecommendation}
                </div>

                <h3 style="font-size:14px;color:${COLORS.blue};margin-bottom:8px;">Recommandation OpenStack</h3>
                <div style="background-color:#f0f9ff;border-left:3px solid ${COLORS.blue};padding:12px 14px;border-radius:4px;font-size:13px;line-height:1.6;">
                  ${openstackRecommendation}
                </div>
              </div>

              <!-- Gap analysis table -->
              <h2 style="font-size:18px;color:${COLORS.blue};border-bottom:2px solid ${COLORS.cyan};padding-bottom:6px;margin-bottom:16px;">
                Analyse des &Eacute;carts
              </h2>
              ${buildGapTable(gaps)}

              <!-- Training modules -->
              ${buildModulesSection(modules)}

              <!-- CTA button -->
              <div style="text-align:center;margin-top:32px;margin-bottom:16px;">
                <a href="${assessmentUrl}"
                   style="display:inline-block;background-color:${COLORS.blue};color:${COLORS.white};font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:6px;">
                  Voir le rapport complet en ligne
                </a>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:20px 32px;text-align:center;">
        <span style="font-size:12px;color:${COLORS.gray};">
          &copy; INSIDE Academy &mdash; Matrice de comp&eacute;tences V2.0
        </span>
        <br/>
        <span style="font-size:11px;color:${COLORS.gray};">
          Cet email a &eacute;t&eacute; g&eacute;n&eacute;r&eacute; automatiquement. Merci de ne pas y r&eacute;pondre.
        </span>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ============================================================================
// Send email
// ============================================================================

export async function sendReportEmail(
  params: SendReportEmailParams,
): Promise<void> {
  const html = buildHtml(params);

  await transporter.sendMail({
    from:
      process.env.SMTP_FROM ||
      `"INSIDE Academy" <${process.env.SMTP_USER}>`,
    to: params.to,
    subject: `Rapport d'Audit — ${params.candidateName} — ${params.roleLabel}`,
    html,
  });
}
