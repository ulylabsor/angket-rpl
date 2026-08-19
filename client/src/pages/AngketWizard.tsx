import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, AlertCircle, CheckCircle2, ClipboardList, Lock, Users as UsersIcon } from "lucide-react";
import { apiFetch } from "../lib/api";

type Butir = { id: string; templateId: string; dimensi: string; nomor: number; teks: string; urut: number };
type AngketDetail = { template: { kode: string; nama: string; label: string }; dimensiOrder: string[]; grouped: Record<string, Butir[]>; butir: Butir[] };
type PeriodeInfo = { id: string; nama: string; tahun: number; status: string; tglMulai?: string; tglSelesai?: string };

const SCALE_LABELS: Record<number, string> = { 1: "Sangat Kurang", 2: "Kurang", 3: "Baik", 4: "Sangat Baik" };
const RATING_STYLE: Record<number, { selBorder: string; selBg: string; selNum: string; selLabel: string; selCheck: string; hover: string; hoverNum: string }> = {
  1: { selBorder: "border-rose-500", selBg: "bg-rose-50", selNum: "text-rose-700", selLabel: "text-rose-800", selCheck: "text-rose-600", hover: "hover:border-rose-300 hover:bg-rose-50/50", hoverNum: "group-hover:text-rose-500" },
  2: { selBorder: "border-amber-500", selBg: "bg-amber-50", selNum: "text-amber-700", selLabel: "text-amber-800", selCheck: "text-amber-600", hover: "hover:border-amber-300 hover:bg-amber-50/50", hoverNum: "group-hover:text-amber-500" },
  3: { selBorder: "border-indigo-500", selBg: "bg-indigo-50", selNum: "text-indigo-700", selLabel: "text-indigo-900", selCheck: "text-indigo-600", hover: "hover:border-indigo-300 hover:bg-indigo-50/50", hoverNum: "group-hover:text-indigo-500" },
  4: { selBorder: "border-emerald-500", selBg: "bg-emerald-50", selNum: "text-emerald-700", selLabel: "text-emerald-800", selCheck: "text-emerald-600", hover: "hover:border-emerald-300 hover:bg-emerald-50/50", hoverNum: "group-hover:text-emerald-500" },
};

const UNIT_UIN = "UIN Raden Fatah Palembang";

const JABATAN_UNIV = [
  "Rektor",
  "Wakil Rektor 1",
  "Ketua Pengelola RPL Universitas",
  "Sekretaris Pengelola RPL Universitas",
];

const JABATAN_FAK = [
  "Direktur Pascasarjana",
  "Wakil Direktur Pascasarjana",
  "Dekan",
  "Wakil Dekan 1 - Bidang Akademik dan Kelembagaan",
  "Ketua Program Studi",
];

const JABATAN_LPM = [
  "Ketua LPM",
  "Sekretaris LPM",
  "Kepala Pusat Kurikulum dan Pembelajaran",
  "Kapus Pengembangan Standar Mutu",
  "Kapus Audit dan Pengendalian Mutu Akademik",
  "Kapus Career Development Center",
  "Kapus Perangkingan dan Internasionalisasi",
];

// Distinct jabatan Tim Asesor dari Lampiran II SK Rektor 1699/2025 (Ket. Tim Asesor RPL)
const JABATAN_ASESOR = [
  "Ketua GPMF",
  "Auditor Internal",
  "Kepala Laboratorium Terpadu",
  "Kepala Laboratorium",
  "Praktisi Badan Standar Nasional",
  "Praktisi PCR",
  "Praktisi BBLK",
  "Praktisi Hukum",
  "Praktisi Penyiaran",
  "Praktisi Akuntan",
  "Praktisi Baznas",
  "Praktisi Wakaf",
  "Praktisi Pendidikan",
  "Praktisi Psikolog",
  "Praktisi Agama",
  "Praktisi QA",
  "Praktisi Budayawan",
  "Praktisi Humaniora - MSI",
];

const JABATAN_SEK = ["Sekretaris Prodi", "Staf Administrasi"];

function jabatanOptionsFor(kode: string): string[] | null {
  switch (kode) {
    case "UNIV": return JABATAN_UNIV;
    case "FAK": return JABATAN_FAK;
    case "LPM": return JABATAN_LPM;
    case "ASESOR": return JABATAN_ASESOR;
    case "SEK": return JABATAN_SEK;
    case "MHS": return null; // auto Mahasiswa
    default: return null;
  }
}

export default function AngketWizard() {
  const { kode } = useParams();
  const [sp] = useSearchParams();
  const periodeId = sp.get("periodeId") ?? "";
  const navigate = useNavigate();

  const [detail, setDetail] = useState<AngketDetail | null>(null);
  const [fakultasList, setFakultasList] = useState<any[]>([]);
  const [periodeInfo, setPeriodeInfo] = useState<PeriodeInfo | null>(null);
  const [periodeErr, setPeriodeErr] = useState(false);
  const [identitas, setIdentitas] = useState({ nama: "", jabatan: "", unit: UNIT_UIN, fakultas: "", prodi: "", kewarganegaraan: "WNI" as "WNI" | "WNA", negara: "" });
  const [skor, setSkor] = useState<Record<string, number>>({});
  const [terbuka, setTerbuka] = useState({ q21: "", q22: "", q23: "", q24: "", q25: "" });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [validationError, setValidationError] = useState("");

  const K = (kode ?? "").toUpperCase();
  const needFakProdi = K === "FAK" || K === "SEK" || K === "MHS";
  const isAsesor = K === "ASESOR";
  const unitFixed = K === "UNIV" || K === "FAK" || K === "LPM";
  const showUnit = unitFixed || isAsesor;
  const isMHS = K === "MHS";
  const jabatanOpts = jabatanOptionsFor(K);
  const RESPONDEN: Record<string, string> = { UNIV: "Rektor · Warek 1 · Ketua & Sekretaris Pengelola RPL Univ", FAK: "Direktur & Wadir Pascasarjana · Dekan & Wadek 1 · Kaprodi", LPM: "Tim LPM", ASESOR: "Tim Asesor RPL", SEK: "Sekretaris Prodi & Staf Administrasi", MHS: "Mahasiswa / Pemohon RPL" };

  useEffect(() => {
    if (!K) return;
    apiFetch<AngketDetail>(`/angket/${K}`).then(setDetail).catch((e) => setErr(String(e)));
    if (needFakProdi || K === "ASESOR") apiFetch<any[]>("/master/fakultas").then(setFakultasList).catch(() => {});
  }, [K]);

  // auto-default per template: unit fixed untuk UNIV/FAK/LPM, selectable untuk ASESOR, jabatan Mahasiswa untuk MHS
  useEffect(() => {
    if (!K) return;
    const isAsesorLocal = K === "ASESOR";
    const unitFixedLocal = K === "UNIV" || K === "FAK" || K === "LPM";
    setIdentitas((prev) => {
      let next = { ...prev };
      if (unitFixedLocal) next.unit = UNIT_UIN;
      else if (isAsesorLocal) { if (prev.unit === UNIT_UIN) next.unit = ""; }
      else next.unit = "";
      if (K === "MHS") next.jabatan = "Mahasiswa";
      else if (prev.jabatan === "Mahasiswa" && K !== "MHS") next.jabatan = "";
      if (K !== "MHS") { next.kewarganegaraan = "WNI"; next.negara = ""; }
      return next;
    });
  }, [K]);

  useEffect(() => {
    if (!periodeId) { setPeriodeInfo(null); setPeriodeErr(false); return; }
    let alive = true;
    apiFetch<PeriodeInfo>(`/periode/${periodeId}`)
      .then((p) => { if (alive) { setPeriodeInfo(p); setPeriodeErr(false); } })
      .catch(() => { if (alive) { setPeriodeInfo(null); setPeriodeErr(true); } });
    return () => { alive = false; };
  }, [periodeId]);

  const dims = detail?.dimensiOrder ?? [];
  const totalSteps = 1 + dims.length + 2;

  const currentDimButir = step >= 1 && step <= dims.length ? (detail?.grouped[dims[step - 1]] ?? []) : [];

  // Tiap ganti langkah (Lanjut / Kembali / Lengkapi dimensi) — mulai dari atas
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const isIdentitasDone = useMemo(() => {
    if (!identitas.nama.trim()) return false;
    if (!identitas.jabatan.trim()) return false;
    if (showUnit && !identitas.unit.trim()) return false;
    if (needFakProdi && (!identitas.fakultas.trim() || !identitas.prodi.trim())) return false;
    if (isMHS) {
      if (!identitas.kewarganegaraan) return false;
      if (identitas.kewarganegaraan === "WNA" && !identitas.negara.trim()) return false;
    }
    if (!periodeId) return false;
    return true;
  }, [identitas, needFakProdi, showUnit, isMHS, periodeId]);
  const dimDone = (dim: string) => (detail?.grouped[dim] ?? []).every((b) => skor[b.id] >= 1 && skor[b.id] <= 4);

  const handleOptionSelect = (butirId: string, value: number) => {
    setSkor((s) => ({ ...s, [butirId]: value }));
    setValidationError("");
  };

  const handleNext = () => {
    if (step === 0 && !isIdentitasDone) {
      if (isMHS && identitas.kewarganegaraan === "WNA" && !identitas.negara.trim()) setValidationError("Lengkapi identitas: asal negara wajib untuk WNA.");
      else setValidationError("Lengkapi identitas (dan periode) sebelum melanjutkan.");
      return;
    }
    if (step >= 1 && step <= dims.length) {
      const unanswered = currentDimButir.filter((b) => !skor[b.id]);
      if (unanswered.length) {
        setValidationError(`Silakan lengkapi ${unanswered.length} pertanyaan lagi di bagian ini sebelum melanjutkan.`);
        return;
      }
    }
    setValidationError("");
    setStep((s) => s + 1);
  };

  const doSubmit = async () => {
    if (!detail) return;
    setSubmitting(true); setErr(""); setShowConfirm(false);
    try {
      const jawabanSkala = detail.butir.map((b) => ({ butirId: b.id, skor: skor[b.id] }));
      if (jawabanSkala.some((j) => !j.skor)) throw new Error("Lengkapi semua pernyataan skala.");
      const identitasPayload: any = {
        nama: identitas.nama,
        jabatan: identitas.jabatan,
        unit: unitFixed ? UNIT_UIN : isAsesor ? identitas.unit : null,
        fakultas: needFakProdi ? identitas.fakultas : null,
        prodi: needFakProdi ? identitas.prodi : null,
      };
      if (isMHS) {
        identitasPayload.kewarganegaraan = identitas.kewarganegaraan;
        identitasPayload.negara = identitas.kewarganegaraan === "WNA" ? identitas.negara : null;
        identitasPayload.asalNegara = identitas.kewarganegaraan === "WNA" ? identitas.negara : null;
      }
      const res: any = await apiFetch("/respons", {
        method: "POST",
        body: JSON.stringify({
          periodeId, templateKode: K,
          identitas: identitasPayload,
          jawabanSkala, jawabanTerbuka: terbuka,
        }),
      });
      navigate(`/angket/${K}/terima-kasih`, { state: res });
    } catch (e: any) { setErr(e.message ?? String(e)); } finally { setSubmitting(false); }
  };

  useEffect(() => {
    const key = `wizard:${K}:${periodeId}`;
    localStorage.setItem(key, JSON.stringify({ identitas, skor, terbuka, step }));
  }, [K, periodeId, identitas, skor, terbuka, step]);

  if (!detail) return <div className="page-pattern min-h-screen grid place-items-center p-8 text-sm text-slate-600">{err ? <span className="text-red-600">{err}</span> : "Memuat angket..."}</div>;

  const selectedFak = fakultasList.find((f) => f.nama === identitas.fakultas);
  const prodiOpts: string[] = selectedFak ? selectedFak.prodi.map((p: any) => p.nama) : [];
  const isPenilaian = step >= 1 && step <= dims.length;
  const progress = ((step + 1) / totalSteps) * 100;

  // SurveyFlow-style renderSurvey: per-step progress + header + questions
  return (
    <div className="page-pattern min-h-screen font-sans text-slate-800 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Public header — kompak di HP biar fokus ke soal */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            <img src="/logo-radenfatah.png" alt="UIN Raden Fatah" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg shrink-0" />
            <span className="font-extrabold text-[15px] sm:text-xl text-slate-800 tracking-tight">Monev RPL</span>
            <span className="hidden lg:inline text-xs text-slate-500 truncate">· UIN Raden Fatah · {K} · {detail.butir.length} butir</span>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline-flex text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">{Object.keys(skor).length}/{detail.butir.length}</span>
            <span className="text-[11px] sm:text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full">{Math.round(progress)}%</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
        {/* Step progress header — kompak di HP */}
        <div className="mb-4 sm:mb-10 animate-fade-in-up">
          <div className="flex justify-between items-end gap-2 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-sm font-bold text-indigo-600 tracking-wider uppercase leading-tight line-clamp-2">
              {step === 0 ? `Langkah 1 dari ${totalSteps}: Identitas` : isPenilaian ? `Langkah ${step + 1} dari ${totalSteps}: ${dims[step - 1]}` : step === dims.length + 1 ? `Langkah ${step + 1} dari ${totalSteps}: Terbuka` : `Langkah ${step + 1} dari ${totalSteps}: Review`}
            </span>
            <span className="text-xs sm:text-sm text-slate-500 font-medium shrink-0">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-1.5 sm:h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Identitas — kompak di HP */}
        {step === 0 && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-t-2xl sm:rounded-t-3xl shadow-sm border border-slate-200 p-5 sm:p-10 border-b-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4 pointer-events-none hidden sm:block" />
              <div className="relative">
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900">{detail.template.label}</h2>
                <p className="text-sm sm:text-lg text-slate-600 leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">Isi identitas responden sebelum penilaian. Tanda <span className="text-rose-500">*</span> wajib.</p>
                {RESPONDEN[K] && <p className="text-xs sm:text-sm text-slate-500 mt-2 flex items-center gap-2"><UsersIcon size={14} className="shrink-0" /> <span className="line-clamp-2">{RESPONDEN[K]}</span></p>}
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{detail.butir.length} butir · skala 1–4</p>
              </div>
            </div>
            <div className="bg-white rounded-b-2xl sm:rounded-b-3xl shadow-xl border border-slate-200 p-4 sm:p-10">
              {!periodeId && <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6 flex items-center gap-2"><AlertCircle size={18} /> Periode belum dipilih. Kembali ke beranda dan pilih periode aktif.</div>}
              {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{err}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-1">Nama <span className="text-rose-500">*</span></span>
                  <input value={identitas.nama} onChange={(e) => setIdentitas({ ...identitas, nama: e.target.value })} placeholder="Nama lengkap" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm" />
                </label>

                {/* Jabatan: select per template, auto untuk MHS */}
                {isMHS ? (
                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">Jabatan <span className="text-rose-500">*</span></span>
                    <div className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mahasiswa
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Otomatis terisi untuk Pemohon RPL.</p>
                  </label>
                ) : jabatanOpts ? (
                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">Jabatan <span className="text-rose-500">*</span></span>
                    <select value={identitas.jabatan} onChange={(e) => setIdentitas({ ...identitas, jabatan: e.target.value })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm">
                      <option value="">Pilih jabatan</option>
                      {jabatanOpts.map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </label>
                ) : (
                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">Jabatan <span className="text-rose-500">*</span></span>
                    <input value={identitas.jabatan} onChange={(e) => setIdentitas({ ...identitas, jabatan: e.target.value })} placeholder="Jabatan" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm" />
                  </label>
                )}

                {unitFixed && (
                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">Unit <span className="text-rose-500">*</span></span>
                    <div className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 flex items-center justify-between">
                      <span>{UNIT_UIN}</span><Lock size={14} className="text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Otomatis UIN Raden Fatah Palembang.</p>
                  </label>
                )}
                {isAsesor && (
                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">Fakultas / Unit <span className="text-rose-500">*</span></span>
                    <select value={identitas.unit} onChange={(e) => setIdentitas({ ...identitas, unit: e.target.value })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm">
                      <option value="">Pilih Fakultas / Unit</option>
                      {fakultasList.map((f) => <option key={f.id} value={f.nama}>{f.nama}</option>)}
                      <option value="Universitas">Universitas</option>
                      <option value="Eksternal">Eksternal</option>
                    </select>
                  </label>
                )}

                {needFakProdi && (
                  <>
                    <label className="block">
                      <span className="block text-sm font-medium text-slate-700 mb-1">Fakultas <span className="text-rose-500">*</span></span>
                      <select value={identitas.fakultas} onChange={(e) => setIdentitas({ ...identitas, fakultas: e.target.value, prodi: "" })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm">
                        <option value="">Pilih Fakultas</option>
                        {fakultasList.map((f) => <option key={f.id} value={f.nama}>{f.nama}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-sm font-medium text-slate-700 mb-1">Program Studi <span className="text-rose-500">*</span></span>
                      <select value={identitas.prodi} onChange={(e) => setIdentitas({ ...identitas, prodi: e.target.value })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm">
                        <option value="">Pilih Prodi</option>
                        {prodiOpts.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </label>
                  </>
                )}

                {isMHS && (
                  <>
                    <label className="block">
                      <span className="block text-sm font-medium text-slate-700 mb-1">Kewarganegaraan <span className="text-rose-500">*</span></span>
                      <select value={identitas.kewarganegaraan} onChange={(e) => setIdentitas({ ...identitas, kewarganegaraan: e.target.value as any, negara: e.target.value === "WNI" ? "" : identitas.negara })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm">
                        <option value="WNI">WNI</option>
                        <option value="WNA">WNA</option>
                      </select>
                    </label>
                    {identitas.kewarganegaraan === "WNA" && (
                      <label className="block animate-fade-in-up">
                        <span className="block text-sm font-medium text-slate-700 mb-1">Asal Negara <span className="text-rose-500">*</span></span>
                        <input value={identitas.negara} onChange={(e) => setIdentitas({ ...identitas, negara: e.target.value })} placeholder="Contoh: Malaysia" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm" />
                      </label>
                    )}
                  </>
                )}

                {!needFakProdi && !isMHS && (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <Lock size={14} /> Privasi terjaga — identitas hanya untuk rekap.
                  </div>
                )}
              </div>
              {/* Periode read */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Periode</p>
                {!periodeId ? <p className="text-sm text-slate-400 mt-1">Belum dipilih</p> : periodeInfo ? (
                  <p className="text-sm font-semibold text-slate-800 mt-1">{periodeInfo.nama} — {periodeInfo.tahun} <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${periodeInfo.status === "aktif" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200"}`}>{periodeInfo.status}</span></p>
                ) : periodeErr ? <p className="text-sm text-amber-700 mt-1 font-mono">{periodeId.slice(0, 8)}… (tidak ditemukan)</p> : <p className="text-sm text-slate-400 mt-1 animate-pulse">Memuat periode…</p>}
              </div>
              {validationError && <div className="mt-6 bg-red-50 text-red-700 p-5 rounded-xl border border-red-100 flex items-center animate-shake"><AlertCircle size={20} className="mr-3 shrink-0" /><span className="font-semibold text-sm">{validationError}</span></div>}
            </div>
          </div>
        )}

        {/* Dimensi — HP: 1 baris 4 kolom, kompak */}
        {isPenilaian && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-t-2xl sm:rounded-t-3xl shadow-sm border border-slate-200 p-5 sm:p-10 border-b-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4 pointer-events-none hidden sm:block" />
              <div className="relative">
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900">{dims[step - 1]}</h2>
                <p className="text-sm sm:text-lg text-slate-600 leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">{currentDimButir.length} pernyataan · {currentDimButir.filter((b) => skor[b.id] >= 1).length}/{currentDimButir.length} terisi</p>
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-1.5 text-[10px] sm:text-xs"><span className="px-2 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold">1 Sangat Kurang</span><span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold">2 Kurang</span><span className="px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">3 Baik</span><span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">4 Sangat Baik</span></div>
              </div>
            </div>
            <div className="bg-white rounded-b-2xl sm:rounded-b-3xl shadow-xl border border-slate-200 p-4 sm:p-10">
              <div className="space-y-5 sm:space-y-10">
                {currentDimButir.map((b, idx) => (
                  <div key={b.id} className="relative">
                    <h3 className="text-[15px] sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-start leading-snug">
                      <span className="shrink-0 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-500 text-xs sm:text-sm mr-2 sm:mr-3 mt-0.5">{idx + 1}</span>
                      <span>{b.teks}</span>
                    </h3>
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 sm:ml-11">
                      {[1, 2, 3, 4].map((rating) => {
                        const isSelected = skor[b.id] === rating;
                        const rs = RATING_STYLE[rating];
                        return (
                          <button type="button" key={rating} onClick={() => handleOptionSelect(b.id, rating)}
                            className={`relative flex flex-col items-center justify-center py-3 px-1 sm:p-4 rounded-xl border-2 transition-all duration-200 group text-center ${isSelected ? `${rs.selBorder} ${rs.selBg} shadow-sm ring-1 ${rs.selBorder.replace("border-","ring-")}/30` : `border-slate-200 bg-white ${rs.hover}`}`}>
                            <span className={`font-bold text-lg sm:text-xl leading-none ${isSelected ? rs.selNum : `text-slate-400 ${rs.hoverNum}`}`}>{rating}</span>
                            <span className={`font-medium text-[10px] sm:text-xs leading-tight mt-1 ${isSelected ? rs.selLabel : "text-slate-500"}`}>
                              <span className="sm:hidden">{rating === 1 ? "S.Kurang" : rating === 2 ? "Kurang" : rating === 4 ? "S.Baik" : "Baik"}</span>
                              <span className="hidden sm:inline">{SCALE_LABELS[rating]}</span>
                            </span>
                            {isSelected && <span className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 ${rs.selCheck}`}><Check size={12} strokeWidth={3} className="sm:w-4 sm:h-4" /></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {validationError && <div className="mt-10 bg-red-50 text-red-700 p-5 rounded-xl border border-red-100 flex items-center animate-shake"><AlertCircle size={24} className="mr-3 shrink-0" /><span className="font-semibold">{validationError}</span></div>}
              {err && <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{err}</div>}
            </div>
          </div>
        )}

        {/* Terbuka — kompak di HP */}
        {step === dims.length + 1 && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-t-2xl sm:rounded-t-3xl shadow-sm border border-slate-200 p-5 sm:p-10 border-b-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4 pointer-events-none hidden sm:block" />
              <div className="relative">
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900">Pertanyaan Terbuka</h2>
                <p className="text-sm sm:text-lg text-slate-600 leading-relaxed mt-1.5 sm:mt-2 max-w-3xl">Q21–Q25 — opsional. Untuk Temuan &amp; RTL.</p>
              </div>
            </div>
            <div className="bg-white rounded-b-2xl sm:rounded-b-3xl shadow-xl border border-slate-200 p-4 sm:p-10">
              <div className="space-y-6">
                {[
                  ["q21", "21. Kekuatan penyelenggaraan RPL"],
                  ["q22", "22. Kendala yang dihadapi"],
                  ["q23", "23. Perbaikan asesmen yang diharapkan"],
                  ["q24", "24. Rekomendasi"],
                  ["q25", "25. Ketidaksesuaian dengan pedoman (jika ada)"],
                ].map(([k, label]) => {
                  const v = String((terbuka as any)[k] ?? "");
                  const filled = v.trim().length > 0;
                  return (
                    <label key={k} className="block">
                      <span className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-800">{label}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${filled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>{filled ? "Terisi" : "Opsional"}</span>
                      </span>
                      <textarea value={v} onChange={(e) => setTerbuka({ ...terbuka, [k]: e.target.value })} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 text-sm transition-colors" placeholder="Tulis jawaban..." />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Review — ringkas SurveyFlow + periode fix */}
        {step === dims.length + 2 && (() => {
          const totalAnswered = Object.keys(skor).length;
          const totalButir = detail.butir.length;
          const terbukaCount = Object.values(terbuka).filter((v) => String(v).trim()).length;
          const missingDims = dims.filter((d) => !dimDone(d));
          const avgPerDim = dims.map((d) => {
            const items = detail.grouped[d] ?? [];
            const vals = items.map((b) => skor[b.id]).filter((v) => v >= 1);
            const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
            const label = avg == null ? "—" : avg >= 3.5 ? "Sangat Baik" : avg >= 2.5 ? "Baik" : avg >= 1.5 ? "Kurang" : "Sangat Kurang";
            return { dim: d, avg, label, filled: items.filter((b) => skor[b.id] >= 1).length, total: items.length };
          });
          return (
            <div className="animate-fade-in-up space-y-4 sm:space-y-6">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-10 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"><CheckCircle2 size={24} className="sm:w-8 sm:h-8" /></div>
                <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900">Review &amp; Kirim</h2>
                <p className="text-xs sm:text-base text-slate-600 mt-1 sm:mt-2 leading-relaxed">Periksa kembali sebelum mengirim. {totalAnswered}/{totalButir} terisi · {dims.length} dimensi · {terbukaCount}/5 terbuka.</p>
                <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-2">
                  <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold border ${missingDims.length ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>{missingDims.length ? `${missingDims.length} dimensi belum lengkap` : "Semua dimensi terisi — siap kirim"}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-8">
                <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2"><ClipboardList size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-600" /> Identitas Responden</h3>
                <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"><p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Nama</p><p className="font-semibold text-slate-800 mt-1 break-words text-sm">{identitas.nama || "—"}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"><p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Jabatan</p><p className="font-semibold text-slate-800 mt-1 break-words text-sm">{identitas.jabatan || "—"}</p></div>
                  {unitFixed && <div className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"><p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Unit</p><p className="font-semibold text-slate-800 mt-1 break-words text-sm">{UNIT_UIN}</p></div>}
                  {isAsesor && <div className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"><p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Fakultas / Unit</p><p className="font-semibold text-slate-800 mt-1 break-words text-sm">{identitas.unit || "—"}</p></div>}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Periode</p>
                    <div className="mt-1">
                      {!periodeId ? <p className="text-slate-400 text-sm">Belum dipilih</p> : periodeInfo ? (
                        <><p className="font-semibold text-slate-800 text-sm">{periodeInfo.nama} — {periodeInfo.tahun}</p><p className="text-xs text-slate-500 mt-1 flex items-center gap-2"><span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${periodeInfo.status === "aktif" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200"}`}>{periodeInfo.status}</span><span className="font-mono text-[11px]">{periodeInfo.id.slice(0, 8)}…</span></p></>
                      ) : periodeErr ? <p className="font-mono text-sm text-amber-700">{periodeId.slice(0, 8)}… (tidak ditemukan)</p> : <p className="text-sm text-slate-400 animate-pulse">Memuat periode…</p>}
                    </div>
                  </div>
                  {needFakProdi && <><div className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"><p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Fakultas</p><p className="font-semibold text-slate-800 mt-1 break-words text-sm">{identitas.fakultas || "—"}</p></div><div className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"><p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Program Studi</p><p className="font-semibold text-slate-800 mt-1 break-words text-sm">{identitas.prodi || "—"}</p></div></>}
                  {isMHS && <><div className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"><p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Kewarganegaraan</p><p className="font-semibold text-slate-800 mt-1 text-sm">{identitas.kewarganegaraan}</p></div>{identitas.kewarganegaraan === "WNA" && <div className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"><p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Asal Negara</p><p className="font-semibold text-slate-800 mt-1 break-words text-sm">{identitas.negara || "—"}</p></div>}</>}
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-8">
                <h3 className="font-bold text-sm sm:text-base text-slate-800">Rincian per Dimensi</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Skala 1–4 · rata-rata &amp; label mutu per dimensi.</p>
                <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {avgPerDim.map((r) => {
                    const done = r.filled === r.total;
                    return (
                      <div key={r.dim} className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${done ? "bg-white border-slate-200" : "bg-amber-50/60 border-amber-200"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">{r.dim}</span>
                          <span className={`shrink-0 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border ${r.label === "Sangat Baik" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : r.label === "Baik" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : r.label === "Kurang" ? "bg-amber-50 border-amber-200 text-amber-700" : r.label === "Sangat Kurang" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-200"}`}>{r.label}</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-1">{r.total} pernyataan · terisi <b className={done ? "text-emerald-700" : "text-amber-700"}>{r.filled}/{r.total}</b> · rata-rata <b className="text-slate-800">{r.avg == null ? "—" : r.avg.toFixed(2)}</b></p>
                        {!done && <button onClick={() => setStep(1 + dims.indexOf(r.dim))} className="mt-2 sm:mt-3 w-full py-2 sm:py-2 bg-white border border-amber-200 text-amber-700 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold hover:bg-amber-50">Lengkapi {r.dim} →</button>}
                      </div>
                    );
                  })}
                </div>
                {Object.values(terbuka).some((v) => String(v).trim()) && (
                  <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Jawaban terbuka (Q21–Q25)</p>
                    <div className="mt-2 space-y-2 text-xs sm:text-sm">
                      {(["q21","q22","q23","q24","q25"] as const).map((k, i) => {
                        const v = String((terbuka as any)[k] ?? "").trim();
                        if (!v) return null;
                        return <div key={k} className="bg-white border border-slate-200 rounded-xl px-3 py-2"><span className="font-bold text-slate-700">Q{21+i}:</span> <span className="text-slate-600">{v}</span></div>;
                      })}
                    </div>
                  </div>
                )}
                {missingDims.length > 0 && <div className="mt-3 sm:mt-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm flex items-start gap-2"><AlertCircle size={14} className="sm:w-4 sm:h-4 mt-0.5 shrink-0" /><span>Lengkapi semua dimensi: <b>{missingDims.join(", ")}</b>.</span></div>}
                <button onClick={() => setShowConfirm(true)} disabled={submitting || !periodeId || !!missingDims.length} className="mt-4 sm:mt-6 w-full py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base">
                  <CheckCircle2 size={18} /> {submitting ? "Mengirim..." : "Kirim Survei"}
                </button>
                {err && <div className="mt-3 bg-red-50 border border-red-100 text-red-700 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm">{err}</div>}
              </div>
            </div>
          );
        })()}

        {/* Navigation — SurveyFlow 1:1 */}
        {(() => {
          const isDimStep = step >= 1 && step <= dims.length;
          const curDimComplete = isDimStep ? currentDimButir.every((b) => skor[b.id] >= 1 && skor[b.id] <= 4) : true;
          const unansweredCount = isDimStep ? currentDimButir.filter((b) => !skor[b.id]).length : 0;
          const canNext = step === 0 ? isIdentitasDone : isDimStep ? curDimComplete : true;
          const nextTitle = !canNext ? (step === 0 ? "Lengkapi identitas & periode terlebih dahulu" : `Lengkapi ${unansweredCount} pertanyaan lagi di dimensi ini`) : undefined;
          return (
            <div className="flex justify-between items-center gap-3 mt-6 sm:mt-8">
              <button type="button" onClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))} aria-label={step === 0 ? "Beranda" : "Sebelumnya"}
                className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 grid place-items-center rounded-xl border bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-colors shadow-sm">
                <ChevronLeft size={20} />
              </button>
              {step < dims.length + 2 ? (
                <button type="button" onClick={handleNext} disabled={!canNext} title={nextTitle} aria-disabled={!canNext}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-3.5 sm:py-3 px-6 sm:px-8 rounded-xl font-semibold transition-all shadow-md text-[15px] sm:text-base ${canNext ? "bg-slate-900 hover:bg-slate-800 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-200"}`}>
                  <span className="sm:hidden">{step === 0 ? "Lanjut" : "Lanjut"}</span>
                  <span className="hidden sm:inline">{step === 0 ? "Lanjut ke Penilaian" : isPenilaian && step < dims.length ? `Lanjut ke ${dims[step] ?? "berikutnya"}` : step === dims.length ? "Lanjut ke Terbuka" : "Lanjut ke Review"}</span>
                  <ChevronRight size={20} />
                </button>
              ) : <span className="text-xs text-slate-400 hidden sm:inline">Periksa lalu Kirim Survei di atas</span>}
            </div>
          );
        })()}
      </main>

      {/* Confirm modal — SurveyFlow card */}
      {showConfirm && (() => {
        const totalAnswered = Object.keys(skor).length;
        const totalButir = detail.butir.length;
        const avgAll = (() => { const vals = detail.butir.map((b) => skor[b.id]).filter((v) => v >= 1); return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null; })();
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <button aria-label="Tutup" onClick={() => !submitting && setShowConfirm(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up max-h-[86dvh] sm:max-h-none flex flex-col">
              <div className="bg-white px-4 sm:px-8 pt-5 sm:pt-8 pb-4 sm:pb-5 text-center border-b border-slate-100 shrink-0">
                <img src="/logo-radenfatah.png" alt="UIN Raden Fatah" className="w-12 h-12 sm:w-16 sm:h-16 object-contain mx-auto mb-3 sm:mb-4 drop-shadow-sm" />
                <h3 className="text-[17px] sm:text-xl font-bold text-slate-900">Kirim jawaban sekarang?</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">Jawaban akan terekam dan tidak dapat diubah.</p>
              </div>
              <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4 overflow-auto overscroll-contain">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-2.5 sm:py-3 text-center"><p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Angket</p><p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{K}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-2.5 sm:py-3 text-center"><p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Terisi</p><p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{totalAnswered}/{totalButir}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-2.5 sm:py-3 text-center"><p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Rata-rata</p><p className="text-xs sm:text-sm font-bold text-indigo-600 mt-0.5">{avgAll == null ? "—" : avgAll.toFixed(2)}</p></div>
                </div>
                {err && <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg sm:rounded-xl px-3 py-2.5 text-xs sm:text-sm">{err}</div>}
                <div className="flex gap-2.5 sm:gap-3">
                  <button onClick={() => setShowConfirm(false)} disabled={submitting} className="flex-1 py-3 sm:py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold disabled:opacity-50">Batal</button>
                  <button onClick={doSubmit} disabled={submitting} className="flex-1 py-3 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> {submitting ? "Mengirim..." : "Ya, kirim"}</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <footer className="py-6 text-center text-slate-400 text-sm font-medium">
        <p>&copy; {new Date().getFullYear()} Monev RPL — UIN Raden Fatah Palembang.</p>
      </footer>
    </div>
  );
}
