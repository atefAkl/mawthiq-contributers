<!doctype html>
<html lang="ar" dir="rtl">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>موثِق | إدارة تقييمات الشراكة وإصدار الشهادات والتقارير</title>

  <!-- Google Fonts: Cairo for Corporate/UI, Amiri for Royal/Calligraphy Certificate -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap"
    rel="stylesheet">
  <!-- Font Awesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

  <style>
    :root {
      /* Brand Identity - Mawthiq */
      --brand-navy-dark: #071326;
      --brand-navy: #0A1D37;
      --brand-navy-mid: #0E2954;
      --brand-blue: #0C2D87;
      --brand-turquoise: #00C3D0;
      --brand-turquoise-glow: rgba(0, 195, 208, 0.35);

      /* Royal Gold Palette */
      --gold-deep: #8A6A10;
      --gold-primary: #D4AF37;
      --gold-rich: #E5C158;
      --gold-light: #F7E8AA;
      --gold-shimmer: #FFF8DC;
      --gold-gradient: linear-gradient(135deg, #F3E0A3 0%, #D4AF37 50%, #AA8018 100%);
      --gold-metallic: linear-gradient(90deg, #D4AF37 0%, #FFF3C4 50%, #C9991A 100%);

      /* Neutrals & UI */
      --navy: #0A1D37;
      --gold: #D4AF37;
      --ink: #1E293B;
      --muted: #64748B;
      --line: #E2E8F0;
      --pale: #F8FAFC;
      --cream: #FFFDF5;
      --green: #059669;
      --red: #DC2626;

      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.07);
      --shadow-md: 0 4px 14px rgba(10, 29, 55, 0.08);
      --shadow-paper: 0 8px 30px rgba(10, 25, 45, 0.12);
      --shadow-cert: 0 20px 45px rgba(0, 0, 0, 0.35);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #F1F4F9;
      color: var(--ink);
      font-family: 'Cairo', sans-serif;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }

    button,
    input,
    select,
    textarea {
      font-family: inherit;
      font-size: 13px;
    }

    button {
      cursor: pointer;
    }

    /* TOPBAR */
    .topbar {
      background: linear-gradient(135deg, var(--brand-navy-dark) 0%, var(--brand-navy) 100%);
      color: white;
      padding: 14px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 3.5px solid var(--gold-primary);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1.5px solid var(--gold-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 0 16px var(--brand-turquoise-glow);
    }

    .brand-logo-img {
      width: 100%;
      height: 100%;
      background-color: #f0faf4;
      box-shadow: 0 2px 8px #ccc inset;
      object-fit: contain;
      padding: 0;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 900;
      line-height: 1.2;
      background: var(--gold-metallic);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-sub {
      font-size: 11.5px;
      color: var(--brand-turquoise);
      font-weight: 600;
    }

    .top-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    .btn {
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      padding: 8px 15px;
      font-weight: 700;
      font-size: 12.5px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn-primary {
      background: var(--gold-gradient);
      color: var(--brand-navy-dark);
      border: 1px solid var(--gold-light);
      box-shadow: 0 3px 10px rgba(212, 175, 55, 0.3);
    }

    .btn-light {
      background: #FFFFFF;
      color: var(--brand-navy);
      border: 1px solid #CBD5E1;
    }

    .btn-light:hover {
      background: #F8FAFC;
    }

    .btn-turquoise {
      background: rgba(0, 195, 208, 0.15);
      color: var(--brand-turquoise);
      border: 1px solid rgba(0, 195, 208, 0.4);
    }

    .btn-turquoise:hover {
      background: rgba(0, 195, 208, 0.25);
    }

    .btn-danger {
      background: #FEF2F2;
      color: var(--red);
      border-color: #FECACA;
    }

    /* MAIN WRAPPER */
    .wrap {
      max-width: 1560px;
      margin: 20px auto;
      padding: 0 20px;
    }

    .intro {
      background: #FFFFFF;
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      padding: 14px 22px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);
    }

    .eyebrow {
      color: var(--gold-deep);
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .intro h1 {
      margin: 2px 0;
      color: var(--brand-navy);
      font-size: 21px;
      font-weight: 800;
    }

    .intro p {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
    }

    /* LAYOUT */
    .layout {
      display: grid;
      grid-template-columns: minmax(360px, 450px) minmax(0, 1fr);
      gap: 22px;
      align-items: start;
    }

    /* FORM PANEL */
    .panel {
      background: #FFFFFF;
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }

    .form-panel {
      position: sticky;
      top: 90px;
      max-height: calc(100vh - 110px);
      display: flex;
      flex-direction: column;
    }

    .panel-head {
      padding: 14px 18px;
      background: #F8FAFC;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .panel-head h2 {
      font-size: 15px;
      font-weight: 800;
      margin: 0;
      color: var(--brand-navy);
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .panel-body {
      padding: 18px;
      overflow-y: auto;
      flex: 1;
    }

    .form-section {
      margin-bottom: 20px;
      background: #FAFCFE;
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      padding: 14px;
    }

    .form-section h3 {
      font-size: 13.5px;
      font-weight: 800;
      margin: 0 0 12px;
      color: var(--brand-navy);
      border-right: 3.5px solid var(--gold-primary);
      padding-right: 9px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 11px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .field.full {
      grid-column: 1 / -1;
    }

    label {
      font-size: 11.5px;
      font-weight: 700;
      color: #475569;
    }

    input,
    select,
    textarea {
      width: 100%;
      border: 1px solid #CBD5E1;
      border-radius: var(--radius-sm);
      background: #FFFFFF;
      padding: 8px 11px;
      color: var(--ink);
      outline: none;
      transition: all 0.2s ease;
    }

    input:focus,
    select:focus,
    textarea:focus {
      border-color: var(--brand-turquoise);
      box-shadow: 0 0 0 3px rgba(0, 195, 208, 0.15);
    }

    textarea {
      resize: vertical;
      min-height: 72px;
      line-height: 1.55;
    }

    .help {
      font-size: 10.5px;
      color: var(--muted);
      margin-top: 6px;
    }

    .score-row {
      display: grid;
      grid-template-columns: 1fr 140px;
      gap: 10px;
      align-items: center;
      padding: 7px 0;
      border-bottom: 1px solid #F1F5F9;
    }

    .score-row:last-child {
      border-bottom: none;
    }

    .score-row label {
      font-size: 12px;
      font-weight: 600;
    }

    .score-row select {
      padding: 6px 8px;
      font-size: 11.5px;
      font-weight: 700;
    }

    .preset-box {
      margin-top: 8px;
      background: #FFFDF5;
      border: 1px dashed var(--gold-primary);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
    }

    .preset-box label {
      color: var(--gold-deep);
      font-weight: 700;
      display: block;
      margin-bottom: 4px;
    }

    .note {
      background: var(--cream);
      border: 1px solid #FDE68A;
      border-radius: var(--radius-sm);
      padding: 11px 14px;
      font-size: 11px;
      color: #78350F;
      margin-top: 14px;
      line-height: 1.6;
    }

    /* PREVIEW CONTAINER */
    .preview {
      min-width: 0;
    }

    .preview-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 12px 18px;
      background: #FFFFFF;
      border-bottom: 1px solid var(--line);
      flex-wrap: wrap;
    }

    .preview-toolbar strong {
      color: var(--brand-navy);
      font-size: 14px;
    }

    .preview-toolbar span {
      font-size: 11.5px;
      color: var(--muted);
    }

    .view-tabs {
      display: flex;
      gap: 5px;
      background: #F1F5F9;
      padding: 3px;
      border-radius: var(--radius-sm);
    }

    .view-tab {
      padding: 5px 12px;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 700;
      border: none;
      background: transparent;
      color: #475569;
      transition: all 0.2s ease;
    }

    .view-tab.active {
      background: #FFFFFF;
      color: var(--brand-navy);
      box-shadow: var(--shadow-sm);
    }

    .pages {
      padding: 24px 18px;
      background: #DCE3ED;
      display: flex;
      flex-direction: column;
      gap: 32px;
      align-items: center;
    }

    /* PAPER BASE - SCREEN PREVIEW */
    .paper {
      background: #FFFFFF;
      width: 100%;
      max-width: 820px;
      min-height: 1120px;
      margin: 0 auto;
      padding: 42px 46px;
      position: relative;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-paper);
      border-radius: 2px;
      overflow: visible;
    }

    .report-paper {
      padding: 36px 44px;
      height: auto;
    }

    /* Table Architecture for Seamless Report Pagination */
    .report-table-print {
      width: 100%;
      border-collapse: collapse;
      border: none;
    }

    .report-table-print thead {
      display: table-header-group;
    }

    .report-table-print tfoot {
      display: table-footer-group;
    }

    .report-table-print td {
      padding: 0;
      border: none;
    }

    /* Report Logo in Header */
    .paper-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid var(--brand-navy);
      padding-bottom: 0.3rem;
      margin-bottom: 0.3rem;
      background: #FFFFFF;
    }

    .paper-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .report-logo-badge {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #FFFFFF;
      border: 1.5px solid var(--gold-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(10, 29, 55, 0.08);
    }

    .report-logo-img {
      width: 100%;
      height: 100%;
      background-color: #f0faf4;
      box-shadow: 0 2px 8px #ccc inset;
      object-fit: contain;
    }

    .report-brand-name {
      font-size: 20px;
      color: var(--brand-navy);
      font-weight: 900;
      line-height: 1.2;
    }

    .report-brand-sub {
      font-size: 11px;
      color: var(--muted);
      margin-top: -3px;
    }

    .doc-type {
      text-align: left;
      color: var(--muted);
      font-size: 10.5px;
    }

    .doc-type b {
      display: block;
      color: var(--brand-navy);
      font-size: 13.5px;
    }

    .paper-footer {
      border-top: 1.5px solid var(--line);
      padding-top: 8px;
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      color: #94A3B8;
      font-size: 9.5px;
      background: #FFFFFF;
    }

    .report-inner-content h2 {
      font-size: 21px;
      font-weight: 800;
      color: var(--brand-navy);
      margin: 0 0 4px;
    }

    .subtitle {
      color: var(--muted);
      font-size: 11.5px;
      margin: 0 0 18px;
    }

    /* Section block - Prevents awkward breaks across pages */
    .section-block {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 14px;
    }

    .section-title {
      font-size: 13px;
      color: var(--brand-navy);
      font-weight: 800;
      border-right: 3.5px solid var(--gold-primary);
      padding-right: 9px;
      margin: 14px 0 8px;
      display: flex;
      align-items: center;
      gap: 7px;
      page-break-after: avoid;
      break-after: avoid;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .meta {
      background: #F8FAFC;
      border: 1px solid #EDF2F7;
      border-radius: var(--radius-sm);
      padding: 8px 12px;
    }

    .meta small {
      display: block;
      color: var(--muted);
      font-size: 9.5px;
      font-weight: 600;
    }

    .meta b {
      font-size: 12px;
      overflow-wrap: anywhere;
      color: var(--ink);
      font-weight: 800;
    }

    .callout {
      background: linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-navy-mid) 100%);
      color: white;
      padding: 14px 18px;
      border-radius: var(--radius-sm);
      margin-top: 10px;
      border-right: 4px solid var(--gold-primary);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .callout b {
      color: var(--gold-rich);
      display: block;
      margin-bottom: 3px;
      font-size: 11.5px;
      letter-spacing: 0.3px;
    }

    .callout p {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
    }

    .body-copy {
      font-size: 11.5px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      line-height: 1.7;
      background: #F8FAFC;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      color: #334155;
    }

    .report-table {
      border-collapse: collapse;
      width: 100%;
      font-size: 11px;
      margin-top: 6px;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .report-table th {
      background: #F1F5F9;
      color: var(--brand-navy);
      text-align: right;
      padding: 4px 12px;
      font-weight: 800;
      border-bottom: 1px solid var(--line);
    }

    .report-table td {
      padding: 4px 12px;
      border-bottom: 1px solid #EDF2F7;
      vertical-align: middle;
    }

    .report-table tr:nth-child(even) td {
      background: #FAFCFE;
    }

    .pill {
      display: inline-block;
      padding: 2.5px 9px;
      border-radius: 20px;
      background: #FFFBEB;
      color: #92400E;
      font-weight: 800;
      font-size: 10px;
      border: 1px solid #FDE68A;
      white-space: nowrap;
    }

    .pill.green {
      background: #ECFDF5;
      color: #065F46;
      border-color: #A7F3D0;
    }

    .pill.red {
      background: #FEF2F2;
      color: #991B1B;
      border-color: #FECACA;
    }

    .pill.gray {
      background: #F1F5F9;
      color: #64748B;
      border-color: #CBD5E1;
    }

    /* ============================================================
       PAGE 1: LUXURY COVER PAGE (صفحة الغلاف الفاخرة)
       ============================================================ */
    .cover-paper {
      background: radial-gradient(circle at 50% 50%, #0F3163 0%, var(--brand-navy) 45%, var(--brand-navy-dark) 100%);
      color: #FFFFFF;
      padding: 56px 52px;
      position: relative;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
    }

    .cover-paper::before {
      content: '';
      position: absolute;
      inset: 20px;
      border: 1.5px solid rgba(212, 175, 55, 0.45);
      pointer-events: none;
    }

    .cover-paper::after {
      content: '';
      position: absolute;
      inset: 26px;
      border: 1px solid rgba(0, 195, 208, 0.25);
      pointer-events: none;
    }

    .cover-corner {
      position: absolute;
      width: 30px;
      height: 50px;
      border: 2.5px solid var(--gold-primary);
      z-index: 5;
    }

    .cover-corner.tl {
      top: 16px;
      right: 16px;
      border-left: none;
      border-bottom: none;
    }

    .cover-corner.tr {
      top: 16px;
      left: 16px;
      border-right: none;
      border-bottom: none;
    }

    .cover-corner.bl {
      bottom: 16px;
      right: 16px;
      border-left: none;
      border-top: none;
    }

    .cover-corner.br {
      bottom: 16px;
      left: 16px;
      border-right: none;
      border-top: none;
    }

    .cover-top {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(212, 175, 55, 0.3);
      padding-bottom: 22px;
    }

    .cover-logo-box {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .cover-logo-badge {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid var(--gold-primary);
      box-shadow: 0 0 18px var(--brand-turquoise-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .cover-logo-badge img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: #f0faf4;
      object-fit: contain;
    }

    .cover-brand-title {
      font-size: 26px;
      font-weight: 900;
      background: var(--gold-metallic);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.2;
    }

    .cover-brand-subtitle {
      font-size: 12.5px;
      color: var(--brand-turquoise);
      letter-spacing: 0.8px;
      font-weight: 600;
    }

    .cover-doc-badge {
      text-align: left;
      font-size: 10.5px;
      color: #CBD5E1;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 7px 13px;
      border-radius: 30px;
    }

    .cover-doc-badge b {
      display: block;
      color: var(--gold-rich);
      font-size: 11.5px;
    }

    .cover-center {
      position: relative;
      z-index: 10;
      margin: 36px 0;
      text-align: center;
    }

    .cover-tagline-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 18px;
      border-radius: 40px;
      background: rgba(0, 195, 208, 0.12);
      border: 1px solid rgba(0, 195, 208, 0.4);
      color: var(--brand-turquoise);
      font-size: 12.5px;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .cover-main-title {
      font-size: 36px;
      font-weight: 900;
      color: #FFFFFF;
      line-height: 1.25;
      margin-bottom: 8px;
    }

    .cover-main-sub {
      font-size: 19px;
      font-weight: 700;
      background: var(--gold-metallic);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }

    .cover-main-en {
      font-size: 11.5px;
      color: #94A3B8;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 30px;
    }

    .cover-rule-gold {
      width: 130px;
      height: 3px;
      margin: 0 auto 32px;
      background: var(--gold-gradient);
      border-radius: 2px;
    }

    .cover-candidate-card {
      background: rgba(14, 41, 84, 0.7);
      border: 1.5px solid rgba(212, 175, 55, 0.5);
      border-radius: var(--radius-lg);
      padding: 24px 32px;
      max-width: 560px;
      margin: 0 auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(8px);
      text-align: center;
    }

    .cover-for-label {
      font-size: 11.5px;
      color: var(--gold-light);
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .cover-cand-name {
      font-size: 27px;
      font-weight: 900;
      color: #FFFFFF;
      margin-bottom: 12px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      text-align: right;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }

    .cover-meta-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 7px 11px;
      border-radius: var(--radius-sm);
    }

    .cover-meta-item small {
      display: block;
      font-size: 9.5px;
      color: #94A3B8;
      margin-bottom: 2px;
    }

    .cover-meta-item b {
      font-size: 12px;
      color: #FFFFFF;
      font-weight: 700;
    }

    .cover-bottom {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(212, 175, 55, 0.3);
      padding-top: 16px;
      font-size: 10.5px;
      color: #94A3B8;
    }

    .cover-security-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--gold-light);
      font-weight: 600;
    }

    /* ============================================================
       CERTIFICATE OF COMPETENCE (استعادة التصميم الملكي السابق للشهادة واللوجو)
       ============================================================ */
    .cert-paper {
      background: radial-gradient(circle at 50% 30%, #0D2D5B 0%, var(--brand-navy) 50%, var(--brand-navy-dark) 100%);
      color: #FFFFFF;
      padding: 44px 46px;
      position: relative;
      justify-content: space-between;
      box-shadow: var(--shadow-cert);
      page-break-before: always;
      break-before: page;
      page-break-after: avoid;
      break-after: avoid;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .cert-paper::before {
      content: '';
      position: absolute;
      inset: 0;
      background: url(logo.png) no-repeat center 42%/320px;
      opacity: 0.045;
      pointer-events: none;
    }

    .cert-outer-frame {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid var(--gold-primary);
      outline: 1px solid rgba(212, 175, 55, 0.4);
      outline-offset: 6px;
      border-radius: 12px;
      padding: 34px 40px 24px;
      background: rgba(7, 19, 38, 0.45);
      backdrop-filter: blur(4px);
      box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.6);
    }

    .cert-corner-knot {
      position: absolute;
      width: 28px;
      height: 28px;
      border: 2.5px solid var(--gold-primary);
      z-index: 10;
    }

    .cert-corner-knot.top-right {
      top: 6px;
      right: 6px;
      border-bottom: none;
      border-left: none;
    }

    .cert-corner-knot.top-left {
      top: 6px;
      left: 6px;
      border-bottom: none;
      border-right: none;
    }

    .cert-corner-knot.bottom-right {
      bottom: 6px;
      right: 6px;
      border-top: none;
      border-left: none;
    }

    .cert-corner-knot.bottom-left {
      bottom: 6px;
      left: 6px;
      border-top: none;
      border-right: none;
    }

    .cert-header {
      text-align: center;
      position: relative;
    }

    /* Restored Grand Royal Seal Wrap */
    .cert-seal-wrap {
      width: 82px;
      height: 82px;
      margin: 0 auto 10px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(10, 29, 55, 0.9) 100%);
      border: 2.5px solid var(--gold-primary);
      box-shadow: 0 0 25px rgba(212, 175, 55, 0.3), inset 0 0 15px rgba(0, 195, 208, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cert-seal-img {
      width: 100%;
      height: 100%;
      background-color: #f0faf4;
      box-shadow: 0 2px 8px #ccc inset;
      border-radius: 50%;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }

    .cert-org-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--brand-turquoise);
      letter-spacing: 1.5px;
      margin-bottom: 2px;
    }

    /* Restored Grand Calligraphy Title */
    .cert-main-title {
      font-family: 'Amiri', serif;
      font-size: 36px;
      font-weight: 700;
      margin: 2px 0;
      line-height: 1.2;
      background: var(--gold-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 2px 15px rgba(212, 175, 55, 0.35);
      letter-spacing: 0.5px;
    }

    .cert-sub-title {
      font-size: 13px;
      color: var(--gold-light);
      font-weight: 600;
      letter-spacing: 0.8px;
    }

    .cert-gold-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 12px auto;
      width: 280px;
    }

    .cert-gold-divider::before,
    .cert-gold-divider::after {
      content: '';
      flex: 1;
      height: 1.5px;
      background: linear-gradient(90deg, transparent, var(--gold-primary), transparent);
    }

    .cert-gold-divider i {
      color: var(--gold-primary);
      font-size: 10px;
    }

    .cert-body-proclamation {
      text-align: center;
      margin-top: 10px;
    }

    .cert-intro-phrase {
      font-size: 13.5px;
      color: #E2E8F0;
      font-weight: 500;
      margin-bottom: 8px;
    }

    /* Restored Grand Candidate Name */
    .cert-candidate-name {
      font-size: 32px;
      font-weight: 900;
      color: #FFFFFF;
      margin: 6px 0 10px;
      letter-spacing: -0.2px;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
      display: inline-block;
      padding: 2px 24px;
      border-bottom: 2px solid var(--gold-primary);
    }

    .cert-attestation-text {
      font-size: 13.5px;
      color: #CBD5E1;
      max-width: 650px;
      margin: 0 auto 16px;
      line-height: 1.8;
      font-weight: 500;
    }

    .cert-attestation-text b {
      color: #FFFFFF;
      font-weight: 700;
    }

    /* Restored Grand Golden Evaluation Box */
    .cert-golden-card {
      background: rgba(10, 27, 53, 0.85);
      border: 1.5px solid var(--gold-primary);
      border-radius: var(--radius-md);
      padding: 18px 26px;
      margin: 14px 0 20px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45), inset 0 0 25px rgba(212, 175, 55, 0.1);
      position: relative;
      text-align: justify;
      text-align-last: center;
    }

    .cert-quote-mark {
      position: absolute;
      top: -12px;
      right: 24px;
      background: var(--brand-navy-dark);
      color: var(--gold-primary);
      padding: 0 10px;
      font-size: 18px;
    }

    .cert-golden-heading {
      font-size: 11.5px;
      font-weight: 800;
      color: var(--gold-light);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
      display: block;
      text-align: center;
    }

    /* The exact evaluation text: Bold, glowing gold font */
    .cert-golden-message {
      color: #F7D070;
      font-weight: 800;
      font-size: 14.5px;
      line-height: 2.05;
      font-family: 'Cairo', sans-serif;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 10px rgba(247, 208, 112, 0.35);
      letter-spacing: 0.1px;
      white-space: pre-wrap;
    }

    .cert-bottom-grid {
      display: grid;
      grid-template-columns: 160px 1fr 220px;
      gap: 16px;
      align-items: center;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid rgba(212, 175, 55, 0.3);
    }

    .cert-qr-block {
      text-align: right;
    }

    .qr-visual-box {
      width: 68px;
      height: 68px;
      background: #FFFFFF;
      padding: 4px;
      border-radius: 6px;
      border: 1.5px solid var(--gold-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .qr-visual-box svg {
      width: 100%;
      height: 100%;
    }

    .cert-verify-id {
      font-size: 9.5px;
      color: var(--gold-light);
      font-weight: 700;
      margin-top: 4px;
      font-family: monospace;
    }

    .cert-center-stamp {
      text-align: center;
    }

    .stamp-3d-badge {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: radial-gradient(circle, #FFF2B2 0%, #D4AF37 55%, #8B6508 100%);
      color: #382402;
      border: 2px dashed #FFF9D2;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
      font-size: 8px;
      font-weight: 900;
      line-height: 1.2;
      text-transform: uppercase;
    }

    .stamp-3d-badge i {
      font-size: 16px;
      margin-bottom: 2px;
    }

    .cert-signatures {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .sig-col {
      text-align: center;
      flex: 1;
    }

    .sig-title {
      font-size: 10px;
      font-weight: 700;
      color: var(--gold-light);
      margin-bottom: 2px;
    }

    .sig-handwritten {
      font-family: 'Amiri', serif;
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-style: italic;
      opacity: 0.9;
    }

    .sig-rule {
      width: 80px;
      height: 1.5px;
      background: linear-gradient(90deg, transparent, var(--gold-primary), transparent);
      margin: 2px auto 4px;
    }

    .sig-sub {
      font-size: 8.5px;
      color: var(--ink-300);
    }

    .cert-share-hook {
      text-align: center;
      font-size: 10px;
      color: #94A3B8;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .cert-share-hook b {
      color: var(--brand-turquoise);
    }

    /* ============================================================
       PRINT MEDIA RULES (هوامش داخلية محكمة بدون هوامش خارجية)
       ============================================================ */
    @page {
      size: A4 portrait;
      margin: 0;
      /* NO external margins from printer */
    }

    @media print {

      html,
      body {
        background: white !important;
        color: #111 !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .topbar,
      .intro,
      .form-panel,
      .preview-toolbar,
      .no-print {
        display: none !important;
      }

      .wrap {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .layout {
        display: block !important;
      }

      .preview {
        width: 100% !important;
      }

      .pages {
        display: block !important;
        padding: 0 !important;
        background: transparent !important;
        gap: 0 !important;
      }

      .paper {
        max-width: none !important;
        width: 210mm !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        position: relative !important;
      }

      /* CONTAINER 1: COVER PAGE (Internal padding applied, zero external margin) */
      .cover-paper {
        width: 210mm !important;
        height: 298mm !important;
        max-height: 296mm !important;
        margin: 0 !important;
        padding: 20mm !important;
        box-sizing: border-box !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important;
        border-radius: 0 !important;
      }

      /* CONTAINER 2: REPORT TABLE (Internal padding applied to header, content, footer individually) */
      .report-paper {
        width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        background: #FFFFFF !important;
      }

      .report-table-print {
        width: 100% !important;
        border-collapse: collapse !important;
      }

      .report-table-print thead {
        display: table-header-group !important;
      }

      .report-table-print tfoot {
        display: table-footer-group !important;
      }

      /* Repeating Header with internal padding away from edges */
      .paper-header {
        margin: 0 0 2rem 0 !important;
        padding: 1rem 3rem !important;
        box-sizing: border-box !important;
        background: #FFFFFF !important;
      }

      /* Repeating Footer with internal padding away from edges */
      .paper-footer {
        margin: 2rem 0 !important;
        padding: 1rem 3rem !important;
        box-sizing: border-box !important;
        background: #FFFFFF !important;
      }

      /* Report Content with internal padding away from edges */
      .report-inner-content {
        padding: 6mm 20mm !important;
        box-sizing: border-box !important;
      }

      /* Section blocks: Avoid orphan headers and awkward page breaks */
      .section-block {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 14px !important;
      }

      .section-title {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      /* CONTAINER 3: CERTIFICATE PAGE (Internal padding applied, zero external margin, exactly 1 page) */
      .cert-paper {
        width: 210mm !important;
        height: 295mm !important;
        max-height: 296mm !important;
        margin: 0 !important;
        padding: 16mm 16mm !important;
        box-sizing: border-box !important;
        page-break-before: always !important;
        break-before: page !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important;
      }

      .cert-outer-frame {
        padding: 24px 32px 18px !important;
      }

      .cert-golden-card {
        padding: 14px 22px !important;
        margin: 10px 0 14px !important;
      }

      .cert-golden-message {
        font-size: 13.5px !important;
        line-height: 1.85 !important;
      }

      .meta-grid,
      .report-table,
      .callout,
      .note,
      .body-copy,
      .cert-bottom-grid {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      .callout,
      .report-table th,
      .pill,
      .meta {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* RESPONSIVE */
    @media (max-width: 1000px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .form-panel {
        position: static;
        max-height: none;
      }

      .paper {
        min-height: auto;
        padding: 24px;
      }

      .topbar {
        padding: 14px 18px;
        align-items: flex-start;
        flex-direction: column;
      }

      .fields {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 560px) {
      .wrap {
        padding: 0 10px;
      }

      .panel-body {
        padding: 14px;
      }

      .fields {
        grid-template-columns: 1fr;
      }

      .field.full {
        grid-column: auto;
      }

      .pages {
        padding: 8px;
      }

      .paper {
        padding: 18px;
      }

      .meta-grid {
        grid-template-columns: 1fr;
      }

      .top-actions {
        width: 100%;
      }

      .btn {
        padding: 8px 10px;
      }

      .cert-outer-frame {
        padding: 18px 14px;
      }

      .cert-bottom-grid {
        grid-template-columns: 1fr;
        text-align: center;
      }
    }
  </style>
</head>

<body>

  <!-- TOPBAR -->
  <header class="topbar no-print">
    <div class="brand">
      <div class="brand-logo-wrap">
        <img src="/logo.png" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-award text-2xl text-amber-500\'></i>';" alt="شعار موثِق" class="brand-logo-img">
      </div>
      <div>
        <div class="brand-name">موثِق</div>
        <div class="brand-sub">جسر الخبرة · إدارة تقييمات الشراكة</div>
      </div>
    </div>
    <div class="top-actions">
      <button class="btn btn-turquoise" id="aiGenerateBtn" title="توليد وتحديث التقرير بالذكاء الاصطناعي">
        <i class="fas fa-robot"></i> توليد بالذكاء الاصطناعي (AI)
      </button>
      <button class="btn btn-turquoise" id="sampleBtn" title="تعبئة بيانات نموذجية لمعاينة التقرير والشهادة">
        <i class="fas fa-magic"></i> تعبئة نموذجية
      </button>
      <button class="btn btn-light" id="saveDraft">
        <i class="fas fa-save"></i> حفظ المسودة
      </button>
      <button class="btn btn-light" id="loadDraft">
        <i class="fas fa-folder-open"></i> استرجاع
      </button>
      <button class="btn btn-primary" id="printBtn">
        <i class="fas fa-print"></i> طباعة / حفظ PDF
      </button>
    </div>
  </header>

  <!-- MAIN CONTENT -->
  <main class="wrap">
    <div class="intro no-print">
      <div>
        <div class="eyebrow"><i class="fas fa-shield-alt"></i> مساحة عمل داخلية معتمدة</div>
        <h1>تقييم المرشحين للشراكة وإصدار الشهادات</h1>
        <p>أدخل بيانات المقابلة وملاحظاتك؛ صفحات التقرير مرنة تكرر الترويسة والتذييل بهوامش داخلية محكمة، والشهادة
          بتصميمها الملكي الأصلي.</p>
      </div>

    </div>

    <div class="layout">

      <!-- FORM PANEL (ACCORDING TO EXACT SOURCE DATA SCHEMA) -->
      <section class="panel form-panel no-print">
        <div class="panel-head">
          <h2><i class="fas fa-sliders-h"></i> بيانات التقييم المعتمدة</h2>
          <button class="btn btn-danger" id="clearBtn"><i class="fas fa-trash-alt"></i> مسح</button>
        </div>
        <div class="panel-body">
          <form id="assessmentForm">

            <!-- 1. بيانات المقابلة -->
            <div class="form-section">
              <h3>١. بيانات المقابلة</h3>
              <div class="fields">
                <div class="field"><label for="candidate">اسم المتقدم / المتقدمة</label><input id="candidate" data-key
                    value="{{ $applicantName }}" placeholder="الاسم الكامل"></div>
                <div class="field"><label for="date">تاريخ المقابلة</label><input id="date" data-key type="date" value="{{ $interviewDate }}"></div>
                <div class="field"><label for="interviewer">اسم المحاور</label><input id="interviewer" data-key
                    value="{{ $interviewerName }}" placeholder="اسم المحاور"></div>
                <div class="field"><label for="specialty">التخصص / المجال</label><input id="specialty" data-key
                    value="{{ $specialty }}" placeholder="إدارة، تقنية، تطوير أعمال..."></div>
                <div class="field"><label for="round">نوع المقابلة</label><select id="round" data-key>
                    <option>مقابلة تعارف أولية</option>
                    <option>مقابلة إدارية استكمالية</option>
                    <option>مقابلة تقنية</option>
                    <option>مراجعة نهائية</option>
                  </select></div>
                <div class="field"><label for="duration">مدة المقابلة</label><input id="duration" data-key
                    value="{{ $duration }}"></div>
                <div class="field full"><label for="purpose">هدف المقابلة</label><textarea id="purpose"
                    data-key>تقييم مدى التوافق مع رؤية موثِق، واستكشاف الخبرات والدوافع والاستعداد لتحمل مسؤولية كشريك.</textarea>
                </div>
              </div>
            </div>

            <!-- 2. التقييم المبدئي -->
            <div class="form-section">
              <h3>٢. التقييم المبدئي</h3>
              <div class="score-row"><label for="techScore">الخبرة والكفاءة التقنية</label><select id="techScore"
                  data-key>
                  <option value="">لم يُقيّم</option>
                  <option>1 — يحتاج تطويرًا</option>
                  <option>2 — محدود</option>
                  <option>3 — جيد</option>
                  <option>4 — قوي</option>
                  <option>5 — متميز</option>
                </select></div>
              <div class="score-row"><label for="businessScore">فهم البزنس والسوق</label><select id="businessScore"
                  data-key>
                  <option value="">لم يُقيّم</option>
                  <option>1 — يحتاج تطويرًا</option>
                  <option>2 — محدود</option>
                  <option>3 — جيد</option>
                  <option>4 — قوي</option>
                  <option>5 — متميز</option>
                </select></div>
              <div class="score-row"><label for="leadershipScore">القيادة والإدارة</label><select id="leadershipScore"
                  data-key>
                  <option value="">لم يُقيّم</option>
                  <option>1 — يحتاج تطويرًا</option>
                  <option>2 — محدود</option>
                  <option>3 — جيد</option>
                  <option>4 — قوي</option>
                  <option>5 — متميز</option>
                </select></div>
              <div class="score-row"><label for="communicationScore">التواصل وفهم السؤال</label><select
                  id="communicationScore" data-key>
                  <option value="">لم يُقيّم</option>
                  <option>1 — يحتاج تطويرًا</option>
                  <option>2 — محدود</option>
                  <option>3 — جيد</option>
                  <option>4 — قوي</option>
                  <option>5 — متميز</option>
                </select></div>
              <div class="score-row"><label for="commitmentScore">الالتزام والاستعداد للشراكة</label><select
                  id="commitmentScore" data-key>
                  <option value="">لم يُقيّم</option>
                  <option>1 — يحتاج تطويرًا</option>
                  <option>2 — محدود</option>
                  <option>3 — جيد</option>
                  <option>4 — قوي</option>
                  <option>5 — متميز</option>
                </select></div>
              <div class="help">التقييمات رقمية استرشادية؛ اترك أي محور دون تقييم إذا لم تتوفر أدلة كافية.</div>
            </div>

            <!-- 3. ملاحظات المقابلة -->
            <div class="form-section">
              <h3>٣. ملاحظات المقابلة</h3>
              <div class="fields">
                <div class="field full"><label for="summary">ملخص الحوار والأدلة</label><textarea id="summary" data-key
                    placeholder="ما الذي قيل؟ ما الأمثلة الفعلية التي قدمها المرشح؟"></textarea></div>
                <div class="field full"><label for="strengths">نقاط القوة</label><textarea id="strengths" data-key
                    placeholder="السلوك أو الخبرة التي ظهرت بوضوح"></textarea></div>
                <div class="field full"><label for="gaps">الفجوات / نقاط تحتاج تحققًا</label><textarea id="gaps"
                    data-key placeholder="ملاحظات محددة دون أحكام شخصية"></textarea></div>
                <div class="field full"><label for="followup">نقاط التركيز في المقابلة القادمة</label><textarea
                    id="followup" data-key placeholder="أسئلة أو موضوعات نحتاج استكشافها"></textarea></div>
              </div>
            </div>

            <!-- 4. القرار والخطوة التالية -->
            <div class="form-section">
              <h3>٤. القرار والخطوة التالية</h3>
              <div class="fields">
                <div class="field"><label for="decision">التوصية المبدئية</label><select id="decision" data-key>
                    <option>استكمال التقييم</option>
                    <option>الاستمرار في المسار التقني</option>
                    <option>مقابلة إدارية استكمالية</option>
                    <option>الانتقال للمرحلة التالية</option>
                    <option>تأجيل</option>
                    <option>عدم الاستمرار</option>
                  </select></div>
                <div class="field"><label for="status">حالة التقييم</label><select id="status" data-key>
                    <option>تقييم أولي — غير نهائي</option>
                    <option>مكتمل</option>
                    <option>بانتظار مقابلة أخرى</option>
                  </select></div>
                <div class="field full"><label for="rationale">مبررات التوصية</label><textarea id="rationale" data-key
                    placeholder="اربط القرار بما ظهر في المقابلة"></textarea></div>
                <div class="field full"><label for="nextSteps">الإجراءات التالية</label><textarea id="nextSteps"
                    data-key placeholder="الخطوة، المسؤول، أو موعد المتابعة"></textarea></div>
              </div>
            </div>

            <!-- 5. رسالة للمتقدم (نص شهادة الكفاءة) -->
            <div class="form-section">
              <h3>٥. رسالة للمتقدم (نص شهادة الكفاءة)</h3>

              <!-- Quick Presets -->
              <div class="preset-box">
                <label><i class="fas fa-medal"></i> نماذج رسائل ذهبية جاهزة للشهادة:</label>
                <select id="messagePreset" style="padding: 5px 8px; font-size:11.5px;">
                  <option value="">-- اضغط لاختيار صيغة ذهبية مقترحة --</option>
                  <option value="p1">شهادة كفاءة استشارية وتقنية متميزة</option>
                  <option value="p2">شهادة جدارة قيادية وشراكة استراتيجية</option>
                  <option value="p3">شهادة تميز وابتكار في قطاع الأعمال</option>
                </select>
              </div>

              <div class="fields" style="margin-top:10px;">
                <div class="field full">
                  <label for="message">نص الرسالة (يظهر في الشهادة باللون الذهبي وبخط سميك)</label>
                  <textarea id="message" data-key style="min-height:160px"
                    placeholder="اكتب رسالة التغذية الراجعة التي ستُرسل للمتقدم وتظهر بخط ذهبي سميك في الشهادة."></textarea>
                </div>
              </div>
            </div>

          </form>
          <div class="note">النموذج يعمل محليًا داخل المتصفح. استخدم «حفظ المسودة» للاحتفاظ بالبيانات، ثم «طباعة / حفظ
            PDF» للتصدير دون اقتطاع.</div>
        </div>
      </section>

      <!-- PREVIEW SECTION: FLEXIBLE REPORT + DEDICATED CERTIFICATE -->
      <section class="panel preview">
        <div class="preview-toolbar no-print">
          <div>
            <strong>معاينة المستندات المعتمدة</strong>
            <p>يتحدث التقرير والغلاف والشهادة تلقائيًا مع تعديل البيانات</p>
          </div>

          <div class="view-tabs">
            <button class="view-tab active" data-view="all">عرض الكل</button>
            <button class="view-tab" data-view="cover">١. الغلاف</button>
            <button class="view-tab" data-view="report">٢. تقرير المقابلة</button>
            <button class="view-tab" data-view="cert">٣. شهادة الكفاءة</button>
          </div>
        </div>

        <div class="pages">

          <!-- ============================================================
               PAGE 1: صفحة الغلاف الفاخرة (Executive Cover Page)
               ============================================================ -->
          <article class="paper cover-paper" id="coverPage" style="border-radius:0; border: 1px solid #fff">
            <div class="cover-corner tl"></div>
            <div class="cover-corner tr"></div>
            <div class="cover-corner bl"></div>
            <div class="cover-corner br"></div>

            <div class="cover-top">
              <div class="cover-logo-box">
                <div class="cover-logo-badge">
                  <img src="/logo.png" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-award text-2xl text-amber-500\'></i>';" alt="شعار موثِق">
                </div>
                <div>
                  <div class="cover-brand-title">مَـوْثِـق</div>
                  <div class="cover-brand-subtitle">جِسْرُ الْخِبْرَةِ · MAWTHIQ</div>
                </div>
              </div>
              <div class="cover-doc-badge">
                <b>وثيقة تقييم واعتماد رسمية</b>
                <span>رقم المرجع: <span id="c_ref">{{ $refNo }}</span></span>
              </div>
            </div>

            <div class="cover-center">
              <div class="cover-tagline-pill">
                <i class="fas fa-shield-alt"></i> مَنْظُومَةُ اسْتِقْطَابِ وَتَأْهِيلِ الشُّرَكَاءِ
              </div>
              <h1 class="cover-main-title">مَلَفُّ التَّقْيِيمِ الْمِهْنِيِّ الشَّامِلِ</h1>
              <div class="cover-main-sub">وَشَهَادَةُ الْكَفَاءَةِ وَالْجَدَارَةِ لِلشَّرَاكَةِ</div>
              <div class="cover-main-en">Executive Partnership Assessment & Competence Dossier</div>

              <div class="cover-rule-gold"></div>

              <div class="cover-candidate-card">
                <div class="cover-for-label">مُـعَـدٌّ لِـصَـالِـحِ المُرَشَّحِ / الشَّرِيكِ:</div>
                <div class="cover-cand-name" id="c_candidate">د. طارق عبد الرحمن المنصور</div>

                <div class="cover-meta-grid">
                  <div class="cover-meta-item">
                    <small>المجال / التخصص</small>
                    <b id="c_specialty">استشارات التحول الرقمي وحلول المؤسسات</b>
                  </div>
                  <div class="cover-meta-item">
                    <small>تاريخ المقابلة</small>
                    <b id="c_date">20-10-2026</b>
                  </div>
                  <div class="cover-meta-item">
                    <small>نوع المقابلة</small>
                    <b id="c_round">مقابلة تقييم واعتماد شراكة</b>
                  </div>
                  <div class="cover-meta-item">
                    <small>حالة التقييم</small>
                    <b id="c_status" style="color:var(--brand-turquoise)">تقييم أولي — غير نهائي</b>
                  </div>
                </div>
              </div>
            </div>

            <div class="cover-bottom">
              <div class="cover-security-badge">
                <i class="fas fa-lock"></i> وثيقة داخلية سرية · صادرة عن منصة موثِق
              </div>
              <div>جميع الحقوق محفوظة © 2026 موثِق – جسر الخبرة</div>
            </div>
          </article>

          <!-- ============================================================
               REPORT SECTION: FLEXIBLE REPORT WITH REPEATING HEADER & FOOTER
               ============================================================ -->
          <article class="paper report-paper" id="reportPage">
            <table class="report-table-print">
              <thead>
                <tr>
                  <td style="padding:0">
                    <div class="paper-header" style="padding: 4px 12px;">
                      <div class="paper-logo">
                        <div class="report-logo-badge">
                          <img src="/logo.png" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-award text-2xl text-amber-500\'></i>';" alt="شعار موثِق" class="report-logo-img">
                        </div>
                        <div>
                          <div class="report-brand-name">موثِق</div>
                          <div class="report-brand-sub">جسر الخبرة</div>
                        </div>
                      </div>
                      <div class="doc-type">
                        <b>تقرير تقييم مرشح للشراكة</b>
                        <span>وثيقة داخلية · سرية</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </thead>
              <tfoot>
                <tr>
                  <td>
                    <div class="paper-footer">
                      <span>موثِق – جسر الخبرة | وثيقة داخلية</span>
                      <span>تقرير تقييم المرشح</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
              <tbody>
                <tr>
                  <td>
                    <div class="report-inner-content">
                      <h2>تقرير المقابلة الفردية</h2>
                      <p class="subtitle">تقييم أولي للتوافق مع احتياجات موثِق الإدارية والتجارية والتقنية</p>

                      <!-- ١. بيانات المقابلة -->
                      <div class="section-block">
                        <div class="section-title">١. بيانات المقابلة</div>
                        <div class="meta-grid">
                          <div class="meta"><small>اسم المتقدم</small><b id="o_candidate">—</b></div>
                          <div class="meta"><small>تاريخ المقابلة</small><b id="o_date">—</b></div>
                          <div class="meta"><small>المحاور</small><b id="o_interviewer">—</b></div>
                          <div class="meta"><small>التخصص / المجال</small><b id="o_specialty">—</b></div>
                          <div class="meta"><small>نوع المقابلة</small><b id="o_round">—</b></div>
                          <div class="meta"><small>مدة المقابلة</small><b id="o_duration">—</b></div>
                        </div>
                      </div>

                      <!-- ٢. هدف المقابلة -->
                      <div class="section-block">
                        <div class="section-title">٢. هدف المقابلة</div>
                        <div class="body-copy" id="o_purpose">—</div>
                      </div>

                      <!-- ٣. التقييم المبدئي -->
                      <div class="section-block">
                        <div class="section-title">٣. التقييم المبدئي</div>
                        <table class="report-table">
                          <thead>
                            <tr>
                              <th style="width: 48%;">محور التقييم</th>
                              <th style="width: 52%;">التقدير</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><b>الخبرة والكفاءة التقنية</b></td>
                              <td id="o_techScore">لم يُقيّم</td>
                            </tr>
                            <tr>
                              <td><b>فهم البزنس والسوق</b></td>
                              <td id="o_businessScore">لم يُقيّم</td>
                            </tr>
                            <tr>
                              <td><b>القيادة والإدارة</b></td>
                              <td id="o_leadershipScore">لم يُقيّم</td>
                            </tr>
                            <tr>
                              <td><b>التواصل وفهم السؤال</b></td>
                              <td id="o_communicationScore">لم يُقيّم</td>
                            </tr>
                            <tr>
                              <td><b>الالتزام والاستعداد للشراكة</b></td>
                              <td id="o_commitmentScore">لم يُقيّم</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <!-- ٤. ملخص الحوار والأدلة -->
                      <div class="section-block">
                        <div class="section-title">٤. ملخص الحوار والأدلة</div>
                        <div class="body-copy" id="o_summary">لم تُسجل ملاحظات بعد.</div>
                      </div>

                      <!-- ٥. نقاط القوة -->
                      <div class="section-block">
                        <div class="section-title">٥. نقاط القوة</div>
                        <div class="body-copy" id="o_strengths">لم تُسجل ملاحظات بعد.</div>
                      </div>

                      <!-- ٦. الفجوات ونقاط التحقق -->
                      <div class="section-block">
                        <div class="section-title">٦. الفجوات ونقاط التحقق</div>
                        <div class="body-copy" id="o_gaps">لم تُسجل ملاحظات بعد.</div>
                      </div>

                      <!-- التوصية المبدئية وحالة التقييم -->
                      <div class="section-block">
                        <div class="callout">
                          <b>التوصية المبدئية وحالة التقييم</b>
                          <p id="o_decision">استكمال التقييم</p>
                          <p style="margin-top:5px; color:var(--brand-turquoise); font-size:11.5px; font-weight:600;"
                            id="o_status">تقييم أولي — غير نهائي</p>
                        </div>
                      </div>

                      <!-- ٧. مبررات التوصية -->
                      <div class="section-block">
                        <div class="section-title">٧. مبررات التوصية</div>
                        <div class="body-copy" id="o_rationale">لم تُسجل مبررات بعد.</div>
                      </div>

                      <!-- ٨. نقاط التركيز والخطوات التالية -->
                      <div class="section-block">
                        <div class="section-title">٨. نقاط التركيز والخطوات التالية</div>
                        <div class="body-copy" id="o_followup">لم تُسجل نقاط بعد.</div>
                        <div class="body-copy" id="o_nextSteps" style="margin-top:8px"></div>
                      </div>

                      <!-- التنبيه المؤسسي -->
                      <div class="section-block">
                        <div class="note">هذا التقرير مبني على الملاحظات المدخلة، ويجب التمييز بين الوقائع الملحوظة
                          والانطباعات الأولية. لا يمثل التقييم وحده قرار قبول نهائي كشريك.</div>
                      </div>

                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </article>

          <!-- ============================================================
               PAGE LAST: شهادة بكفاءة المتقدم (Dedicated Certificate Page)
               ============================================================ -->
          <article class="paper cert-paper" id="letterPage">
            <div class="cert-outer-frame">

              <!-- Corner Knots -->
              <div class="cert-corner-knot top-right"></div>
              <div class="cert-corner-knot top-left"></div>
              <div class="cert-corner-knot bottom-right"></div>
              <div class="cert-corner-knot bottom-left"></div>

              <!-- Header -->
              <div class="cert-header">
                <div class="cert-seal-wrap">
                  <img src="/logo.png" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-award text-2xl text-amber-500\'></i>';" alt="شعار موثِق" class="cert-seal-img">
                </div>
                <div class="cert-org-name">مَنْـظُـومَـةُ مَـوْثِـق | جِسْـرُ الْخِـبْـرَةِ</div>
                <h2 class="cert-main-title">شَهَادَةُ كَفَاءَةٍ وَتَقْدِير</h2>
                <div class="cert-sub-title">اعْتِمَادُ التَّوَافُقِ الْمِهْنِيِّ وَالْجَدَارَةِ الاسْتِرَاتِيجِيَّةِ
                  لِلشَّرَاكَةِ</div>

                <div class="cert-gold-divider">
                  <i class="fas fa-gem"></i>
                </div>
              </div>

              <!-- Proclamation -->
              <div class="cert-body-proclamation">
                <p class="cert-intro-phrase">تَشْهَدُ إِدَارَةُ مَنْظُومَةِ «مَوْثِق» بِأَنَّ الأُسْتَاذَ /
                  الأُسْتَاذَةَ:
                </p>

                <!-- Candidate Name -->
                <div class="cert-candidate-name" id="l_candidate">
                  د. طارق عبد الرحمن المنصور
                </div>

                <p class="cert-attestation-text">
                  قَدْ خَضَعَ لِمَنْظُومَةِ التَّقْيِيمِ الْمِهْنِيِّ فِي مَجَالِ (<b id="l_specialty">استشارات التحول
                    الرقمي وحلول المؤسسات</b>)، وَأَظْهَرَ كَفَاءَةً اسْتِثْنَائِيَّةً، وَمُسْتَوَىً رَفِيعًا مِنَ
                  الْجَدَارَةِ وَالاحْتِرَافِيَّةِ الَّتِي تُؤَهِّلُهُ لِلشَّرَاكَةِ الإِسْتْرَاتِيجِيَّةِ وَصِنَاعَةِ
                  الأَثَرِ.
                </p>
              </div>

              <!-- ============================================================
                   THE GOLDEN EVALUATION MESSAGE BOX (باللون الذهبي وبخط سميك)
                   ============================================================ -->
              <div class="cert-golden-card">
                <div class="cert-quote-mark">
                  <i class="fas fa-quote-right"></i>
                </div>
                <span class="cert-golden-heading">
                  <i class="fas fa-star" style="color:var(--gold-primary)"></i> تَقْيِيمُ وَإِشَادَةُ لَجْنَةِ
                  الاعْتِمَادِ <i class="fas fa-star" style="color:var(--gold-primary)"></i>
                </span>

                <!-- Evaluation Text written in radiant gold and bold font -->
                <div class="cert-golden-message" id="o_message">
                  «يسرنا في منظومة «موثِق» أن نعرب عن بالغ اعتزازنا بما لمسناه خلال جلسة التقييم من عمق معرفي ورؤية
                  استراتيجية ثاقبة في الاستشارات وحلول الأعمال. إن كفاءتكم التخصصية وجدارتكم تمثل نموذجاً ملهماً لشركاء
                  النجاح الذين نعتز بانضمامهم لمسيرتنا لصناعة أثر نوعي ومستدام.»
                </div>
              </div>

              <!-- Verification, Official Seal & Signatures -->
              <div class="cert-bottom-grid" style="display: flex; justify-content: center">

                <!-- QR Code & Digital Hash -->
                <div class="cert-qr-block" style="flex: 2">
                  <div style="display: flex; flex-direction: column; align-items: center;">
                    <!-- <svg viewBox="0 0 100 100" fill="#0A1D37">
                      <rect x="0" y="0" width="30" height="30" />
                      <rect x="5" y="5" width="20" height="20" fill="#fff" />
                      <rect x="9" y="9" width="12" height="12" />
                      <rect x="70" y="0" width="30" height="30" />
                      <rect x="75" y="5" width="20" height="20" fill="#fff" />
                      <rect x="79" y="9" width="12" height="12" />
                      <rect x="0" y="70" width="30" height="30" />
                      <rect x="5" y="75" width="20" height="20" fill="#fff" />
                      <rect x="9" y="79" width="12" height="12" />
                      <rect x="36" y="8" width="8" height="18" />
                      <rect x="48" y="4" width="14" height="8" />
                      <rect x="38" y="38" width="24" height="24" />
                      <rect x="42" y="42" width="16" height="16" fill="#fff" />
                      <rect x="46" y="46" width="8" height="8" fill="#D4AF37" />
                      <rect x="70" y="38" width="10" height="18" />
                      <rect x="84" y="48" width="12" height="10" />
                      <rect x="8" y="38" width="18" height="8" />
                      <rect x="38" y="72" width="10" height="22" />
                      <rect x="54" y="80" width="20" height="12" />
                      <rect x="80" y="72" width="16" height="22" />
                    </svg> -->
                    <!-- Center 3D Medal -->

                    <div class="stamp-3d-badge">
                      <i class="fas fa-certificate"></i>
                      <span>كَفَاءَةٌ مُعْتَمَدَةٌ</span>
                      <span style="font-size:7px; letter-spacing:0.5px;">موثِق · 2026</span>
                    </div>

                    <div class="cert-verify-id">
                      اعتماد رقم: <span id="l_ref">{{ $refNo }}</span>
                    </div>
                    <div style="font-size:8px; color:#94A3B8;">تاريخ المنح: <span id="l_date">20-10-2026</span></div>
                  </div>
                </div>


                <!-- Signatures -->
                <div class="cert-signatures" style="flex:2">
                  <div class="sig-col">
                    <div class="sig-title">لجنة الاستقطاب</div>
                    <div class="sig-handwritten"></div>
                    <div class="sig-rule"></div>
                    <div class="sig-sub">الاعتماد المهني</div>
                  </div>
                  <div class="sig-col">
                    <div class="sig-title">الإدارة العامة</div>
                    <div class="sig-handwritten"></div>
                    <div class="sig-rule"></div>
                    <div class="sig-sub">الاعتماد التنفيذي</div>
                  </div>
                </div>

              </div>

              <!-- Sharing Hook -->
              <div class="cert-share-hook">
                <i class="fas fa-share-alt" style="color:var(--gold-primary)"></i>
                وثيقة اعتماد وجدارة رسمية · يحق لحاملها مشاركتها ونشرها في الملف التعريفي والمنصات المهنية (LinkedIn)
                كشهادة كفاءة صادرة عن <b>منصة موثِق</b>
              </div>

            </div>
          </article>

        </div>
      </section>

    </div>
  </main>

  <!-- JAVASCRIPT LOGIC (EXACT SOURCE SCHEMA COMPATIBILITY) -->
  <script>
    const keys = [...document.querySelectorAll('[data-key]')];
    const val = id => (document.getElementById(id)?.value || '').trim();
    const safe = s => s || '—';

    // Exact outputMap from the original source file
    const outputMap = {
      candidate: 'candidate',
      date: 'date',
      interviewer: 'interviewer',
      specialty: 'specialty',
      round: 'round',
      duration: 'duration',
      purpose: 'purpose',
      techScore: 'techScore',
      businessScore: 'businessScore',
      leadershipScore: 'leadershipScore',
      communicationScore: 'communicationScore',
      commitmentScore: 'commitmentScore',
      summary: 'summary',
      strengths: 'strengths',
      gaps: 'gaps',
      decision: 'decision',
      status: 'status',
      rationale: 'rationale',
      followup: 'followup',
      nextSteps: 'nextSteps',
      message: 'message'
    };

    function fmtDate(s) {
      if (!s) return '—';
      const [y, m, d] = s.split('-');
      if (y && m && d) return `${d}-${m}-${y}`;
      return s;
    }

    // Format score badge with stylish pill
    function formatScore(scoreVal) {
      if (!scoreVal || scoreVal === 'لم يُقيّم') {
        return '<span class="pill gray">لم يُقيّم</span>';
      }
      if (scoreVal.startsWith('5')) {
        return `<span class="pill green">${scoreVal}</span>`;
      }
      if (scoreVal.startsWith('4')) {
        return `<span class="pill green">${scoreVal}</span>`;
      }
      if (scoreVal.startsWith('3')) {
        return `<span class="pill">${scoreVal}</span>`;
      }
      return `<span class="pill red">${scoreVal}</span>`;
    }

    // Golden message presets
    const goldenPresets = {
      p1: `«يسرنا في منظومة «موثِق» أن نعرب عن بالغ اعتزازنا بما لمسناه خلال جلسة التقييم من عمق معرفي ورؤية استراتيجية ثاقبة في الاستشارات وحلول الأعمال. إن كفاءتكم التخصصية وجدارتكم تمثل نموذجاً ملهماً لشركاء النجاح الذين نعتز بانضمامهم لمسيرتنا لصناعة أثر نوعي ومستدام.»`,
      p2: `«تشهد إدارة «موثِق» بالتميز القيادي والجدارة الرفيعة التي تجلت بوضوح في الرؤية الاستراتيجية والقدرة على قيادة المبادرات المعقدة. نمنح هذا الاعتماد تقديراً للخبرة المتراكمة والاستعداد الواعد لتحقيق نقلة نوعية كشريك استراتيجي في منظومتنا.»`,
      p3: `«تقديراً للكفاءة المهنية الرفيعة، والشغف المشهود في تطوير حلول الأعمال وابتكار النماذج الريادية. تعتمد منظومة «موثِق» هذا التقييم شهادة استحقاق وجدارة تعكس القدرة المتميزة على صناعة قيمة مضافة وشراكة واعدة.»`
    };

    function updatePreview() {
      // 1. Update all standard outputMap targets
      for (const [out, src] of Object.entries(outputMap)) {
        const el = document.getElementById('o_' + out);
        if (el) {
          let v = val(src);
          if (src === 'date') v = fmtDate(v);
          el.textContent = safe(v);
        }
      }

      // 2. Score pills
      document.getElementById('o_techScore').innerHTML = formatScore(val('techScore'));
      document.getElementById('o_businessScore').innerHTML = formatScore(val('businessScore'));
      document.getElementById('o_leadershipScore').innerHTML = formatScore(val('leadershipScore'));
      document.getElementById('o_communicationScore').innerHTML = formatScore(val('communicationScore'));
      document.getElementById('o_commitmentScore').innerHTML = formatScore(val('commitmentScore'));

      // 3. Golden Certificate Message
      const msg = val('message') || goldenPresets.p1;
      document.getElementById('o_message').textContent = msg;

      // 4. Candidate & Date in Certificate
      document.getElementById('l_candidate').textContent = safe(val('candidate') || 'د. طارق عبد الرحمن المنصور');
      document.getElementById('l_date').textContent = fmtDate(val('date')) || '20-10-2026';
      const lSpec = document.getElementById('l_specialty');
      if (lSpec) lSpec.textContent = safe(val('specialty') || 'استشارات التحول الرقمي وحلول المؤسسات');

      // 5. Cover Page updates
      const cC = document.getElementById('c_candidate');
      const cD = document.getElementById('c_date');
      const cS = document.getElementById('c_specialty');
      const cR = document.getElementById('c_round');
      const cSt = document.getElementById('c_status');
      if (cC) cC.textContent = safe(val('candidate') || 'د. طارق عبد الرحمن المنصور');
      if (cD) cD.textContent = fmtDate(val('date')) || '20-10-2026';
      if (cS) cS.textContent = safe(val('specialty') || 'استشارات التحول الرقمي وحلول المؤسسات');
      if (cR) cR.textContent = safe(val('round') || 'مقابلة تقييم واعتماد شراكة');
      if (cSt) cSt.textContent = safe(val('status') || 'تقييم أولي — غير نهائي');
    }

    keys.forEach(el => el.addEventListener('input', updatePreview));
    keys.forEach(el => el.addEventListener('change', updatePreview));

    // Preset selection listener
    const presetSelect = document.getElementById('messagePreset');
    if (presetSelect) {
      presetSelect.addEventListener('change', () => {
        const key = presetSelect.value;
        if (goldenPresets[key]) {
          document.getElementById('message').value = goldenPresets[key];
          updatePreview();
        }
      });
    }

    // View tabs switcher
    const viewTabs = document.querySelectorAll('.view-tab');
    const coverPage = document.getElementById('coverPage');
    const reportPage = document.getElementById('reportPage');
    const letterPage = document.getElementById('letterPage');

    viewTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        viewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const mode = tab.getAttribute('data-view');
        if (mode === 'all') {
          coverPage.style.display = 'flex';
          reportPage.style.display = 'flex';
          letterPage.style.display = 'flex';
        } else if (mode === 'cover') {
          coverPage.style.display = 'flex';
          reportPage.style.display = 'none';
          letterPage.style.display = 'none';
        } else if (mode === 'report') {
          coverPage.style.display = 'none';
          reportPage.style.display = 'flex';
          letterPage.style.display = 'none';
        } else if (mode === 'cert') {
          coverPage.style.display = 'none';
          reportPage.style.display = 'none';
          letterPage.style.display = 'flex';
        }
      });
    });

    // Print Button (Displays all pages cleanly before printing)
    document.getElementById('printBtn').addEventListener('click', () => {
      coverPage.style.display = 'flex';
      reportPage.style.display = 'flex';
      letterPage.style.display = 'flex';
      viewTabs.forEach(t => t.classList.remove('active'));
      viewTabs[0].classList.add('active');

      updatePreview();
      window.print();
    });

    // Fill Sample Data Button
    document.getElementById('sampleBtn').addEventListener('click', () => {
      document.getElementById('candidate').value = 'د. طارق عبد الرحمن المنصور';
      document.getElementById('date').value = '2026-10-20';
      document.getElementById('interviewer').value = 'م. خالد بن سلمان';
      document.getElementById('specialty').value = 'استشارات التحول الرقمي وحلول المؤسسات';
      document.getElementById('round').value = 'مقابلة تقنية';
      document.getElementById('duration').value = '45 دقيقة';
      document.getElementById('purpose').value = 'تقييم مدى التوافق مع رؤية موثِق، واستكشاف الخبرات والدوافع والاستعداد لتحمل مسؤولية كشريك استراتيجي.';

      document.getElementById('techScore').value = '5 — متميز';
      document.getElementById('businessScore').value = '5 — متميز';
      document.getElementById('leadershipScore').value = '4 — قوي';
      document.getElementById('communicationScore').value = '5 — متميز';
      document.getElementById('commitmentScore').value = '5 — متميز';

      document.getElementById('summary').value = 'استعرض المرشح سجلاً حافلاً في قيادة مشاريع التحول الرقمي وإدارة النظم السحابية المؤسسية، مقدماً براهين واقعية تدل على نضج فني وتجاري فريد.';
      document.getElementById('strengths').value = '• عمق استشاري وتقني رفيع المستوى.\n• مهارة استثنائية في التفاوض وصياغة الحلول المبتكرة.\n• توافق تام مع قيم ورسالة منظومة موثِق.';
      document.getElementById('gaps').value = '• التنسيق المسبق للجدول الزمني للارتباطات الميدانية خلال الربع الأول من الشراكة.';

      document.getElementById('decision').value = 'استكمال التقييم';
      document.getElementById('status').value = 'مكتمل';
      document.getElementById('rationale').value = 'الجدارة المثبتة والخبرة النوعية تمثل إضافة محورية لمنظومة الشركاء في موثِق.';
      document.getElementById('nextSteps').value = 'توقيع اتفاقية الشراكة وتحديد خطة الإطلاق المشتركة للمشاريع الاستشارية.';
      document.getElementById('followup').value = 'مناقشة خطة تفعيل المشاريع الاستشارية وآلية المشاركة في العوائد.';

      document.getElementById('message').value = goldenPresets.p1;

      updatePreview();
    });

    // Save & Load Draft
    document.getElementById('saveDraft').addEventListener('click', () => {
      try {
        localStorage.setItem('mawthiq-assessment-v1', JSON.stringify(Object.fromEntries(keys.map(el => [el.id, el.value]))));
        alert('تم حفظ المسودة على هذا الجهاز بنجاح.');
      } catch (e) {
        alert('تعذر الحفظ المحلي في هذا المتصفح.');
      }
    });

    document.getElementById('loadDraft').addEventListener('click', () => {
      try {
        const data = JSON.parse(localStorage.getItem('mawthiq-assessment-v1') || 'null');
        if (!data) { alert('لا توجد مسودة محفوظة.'); return; }
        keys.forEach(el => { if (data[el.id] !== undefined) el.value = data[el.id]; });
        updatePreview();
        alert('تم استرجاع المسودة بنجاح.');
      } catch (e) {
        alert('تعذر استرجاع المسودة.');
      }
    });

    // Clear Form
    document.getElementById('clearBtn').addEventListener('click', () => {
      if (!confirm('هل تريد مسح جميع الحقول؟')) return;
      keys.forEach(el => {
        if (el.id === 'date') el.value = '';
        else if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });
      updatePreview();
    });

    // Initial Trigger
    
    // Initial dynamic bindings from server
    window.addEventListener('DOMContentLoaded', () => {
      document.getElementById('candidate').value = @json($applicantName);
      document.getElementById('date').value = @json($interviewDate);
      document.getElementById('interviewer').value = @json($interviewerName);
      document.getElementById('specialty').value = @json($specialty);
      document.getElementById('duration').value = @json($duration);
      document.getElementById('purpose').value = @json($purpose);
      document.getElementById('summary').value = @json($summary);
      document.getElementById('strengths').value = @json($strengths);
      document.getElementById('gaps').value = @json($gaps);
      document.getElementById('rationale').value = @json($rationale);
      document.getElementById('decision').value = @json($decision);
      document.getElementById('status').value = @json($status);
      document.getElementById('message').value = @json($goldenMessage) || goldenPresets.p1;

      // Scores
      document.getElementById('techScore').value = @json($techScore);
      document.getElementById('businessScore').value = @json($businessScore);
      document.getElementById('leadershipScore').value = @json($leadershipScore);
      document.getElementById('communicationScore').value = @json($communicationScore);
      document.getElementById('commitmentScore').value = @json($commitmentScore);

      updatePreview();
    });

    // AI Generate Button Handler
    const aiBtn = document.getElementById('aiGenerateBtn');
    if (aiBtn) {
      aiBtn.addEventListener('click', async () => {
        aiBtn.disabled = true;
        aiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التوليد...';
        try {
          const res = await fetch('/api/interviews/{{ $interview->id }}/generate-ai-report', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': '{{ csrf_token() }}'
            }
          });
          const data = await res.json();
          if (data.ai_report) {
            const r = data.ai_report;
            if (r.executive_summary) document.getElementById('summary').value = r.executive_summary;
            if (r.strengths) document.getElementById('strengths').value = '• ' + r.strengths.join('\n• ');
            if (r.areas_for_development) document.getElementById('gaps').value = '• ' + r.areas_for_development.join('\n• ');
            if (r.recommendation_text) document.getElementById('rationale').value = r.recommendation_text;
            if (r.certificate_text) document.getElementById('message').value = r.certificate_text;
            updatePreview();
            alert('تم توليد وتحديث التقرير بالذكاء الاصطناعي بنجاح!');
          }
        } catch (e) {
          alert('تعذر استدعاء الذكاء الاصطناعي.');
        } finally {
          aiBtn.disabled = false;
          aiBtn.innerHTML = '<i class="fas fa-robot"></i> توليد بالذكاء الاصطناعي (AI)';
        }
      });
    }

  </script>
</body>

</html>