import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { ShieldCheck, ChevronLeft, ChevronRight, Check, AlertCircle, CheckCircle2, ClipboardList, Lock, Users as UsersIcon } from "lucide-react";
import { apiFetch } from "../lib/api";

type Butir = { id: string; templateId: string; dimensi: string; nomor: number; teks: string; urut: number };
type AngketDetail = { template: { kode: string; nama: string; label: string }; dimensiOrder: string[]; grouped: Record<string, Butir[]>; butir: Butir[] };
type PeriodeInfo = { id: string; nama: string; tahun: number; status: string; tglMulai?: string; tglSelesai?: string };

const SCALE_LABELS: Record<number, string> = { 1: "Sangat Kurang", 2: "Kurang", 3: "Baik", 4: "Sangat Baik" };

export default function AngketWizard() {
  const { kode } = useParams();
  const [sp] = useSearchParams();
  const periodeId = sp.get("periodeId") ?? "";
  const navigate = useNavigate();

  const [detail, setDetail] = useState<AngketDetail | null>(null);
  const [fakultasList, setFakultasList] = useState<any[]>([]);
  const [periodeInfo, setPeriodeInfo] = useState<PeriodeInfo | null>(null);
  const [periodeErr, setPeriodeErr] = useState(false);
  const [identitas, setIdentitas] = useState({ nama: "", jabatan: "", unit: "", fakultas: "", prodi: "" });
  const [skor, setSkor] = useState<Record<string, number>>({});
  const [terbuka, setTerbuka] = useState({ q21: "", q22: "", q23: "", q24: "", q25: "" });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [validationError, setValidationError] = useState("");

  const K = (kode ?? "").toUpperCase();
  const needProdi = K === "FAK" || K === "MHS";
  const RESPONDEN: Record<string, string> = { UNIV: "Rektor · Warek 1 · Ketua & Sekretaris Pengelola RPL Univ", FAK: "Direktur & Wadir Pascasarjana · Dekan & Wadek 1 · Kaprodi", LPM: "Tim LPM", ASESOR: "Tim Asesor RPL (Asesor 1 & 2)", SEK: "Sekretaris Prodi & Staf Administrasi", MHS: "Mahasiswa / Pemohon RPL (boleh inisial)" };

  useEffect(() => {
    if (!K) return;
    apiFetch<AngketDetail>(`/angket/${K}`).then(setDetail).catch((e) => setErr(String(e)));
    if (needProdi) apiFetch<any[]>("/master/fakultas").then(setFakultasList).catch(() => {});
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

  const isIdentitasDone = useMemo(() => {
    if (!identitas.nama.trim() || !identitas.jabatan.trim() || !identitas.unit.trim()) return false;
    if (needProdi && (!identitas.fakultas.trim() || !identitas.prodi.trim())) return false;
    if (!periodeId) return false;
    return true;
  }, [identitas, needProdi, periodeId]);
  const dimDone = (dim: string) => (detail?.grouped[dim] ?? []).every((b) => skor[b.id] >= 1 && skor[b.id] <= 4);

  const handleOptionSelect = (butirId: string, value: number) => {
    setSkor((s) => ({ ...s, [butirId]: value }));
    setValidationError("");
  };

  const handleNext = () => {
    if (step === 0 && !isIdentitasDone) {
      setValidationError("Lengkapi identitas (dan periode) sebelum melanjutkan.");
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
      const res: any = await apiFetch("/respons", {
        method: "POST",
        body: JSON.stringify({
          periodeId, templateKode: K,
          identitas: { nama: identitas.nama, jabatan: identitas.jabatan, unit: identitas.unit, fakultas: identitas.fakultas || null, prodi: identitas.prodi || null },
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

  if (!detail) return <div className="min-h-screen bg-slate-50/50 grid place-items-center p-8 text-sm text-slate-600">{err ? <span className="text-red-600">{err}</span> : "Memuat angket..."}</div>;

  const selectedFak = fakultasList.find((f) => f.nama === identitas.fakultas);
  const prodiOpts: string[] = selectedFak ? selectedFak.prodi.map((p: any) => p.nama) : [];
  const isPenilaian = step >= 1 && step <= dims.length;
  const progress = ((step + 1) / totalSteps) * 100;

  // SurveyFlow-style renderSurvey: per-step progress + header + questions
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Public header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo-radenfatah.png" alt="UIN Raden Fatah" className="w-8 h-8 object-contain rounded-lg" />
            <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg hidden sm:flex items-center justify-center text-white shadow-sm"><ShieldCheck size={18} /></span>
            <span className="font-extrabold text-xl text-slate-800 tracking-tight">Monev RPL</span>
            <span className="hidden md:inline text-xs text-slate-500">· UIN Raden Fatah · {K} · {detail.butir.length} butir</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">{Object.keys(skor).length}/{detail.butir.length}</span>
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full">{Math.round(progress)}% Selesai</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto py-8 px-4 sm:px-0">
        {/* Step progress header — SurveyFlow 1:1 */}
        <div className="mb-10 animate-fade-in-up">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-indigo-600 tracking-wider uppercase">
              {step === 0 ? `Langkah 1 dari ${totalSteps}: Identitas` : isPenilaian ? `Langkah ${step + 1} dari ${totalSteps}: ${dims[step - 1]}` : step === dims.length + 1 ? `Langkah ${step + 1} dari ${totalSteps}: Terbuka` : `Langkah ${step + 1} dari ${totalSteps}: Review`}
            </span>
            <span className="text-sm text-slate-500 font-medium">{Math.round(progress)}% Selesai</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Identitas — SurveyFlow dimension header + form */}
        {step === 0 && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-t-3xl shadow-sm border border-slate-200 p-8 sm:p-10 border-b-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="relative">
                <h2 className="text-3xl font-extrabold text-slate-900">{detail.template.label}</h2>
                <p className="text-lg text-slate-600 leading-relaxed mt-2 max-w-3xl">Isi identitas responden sebelum penilaian. Tanda <span className="text-rose-500">*</span> wajib. MHS boleh inisial. Data hanya untuk rekap Monev RPL.</p>
                {RESPONDEN[K] && <p className="text-sm text-slate-500 mt-2 flex items-center gap-2"><UsersIcon size={14} /> Responden: {RESPONDEN[K]}</p>}
                <p className="text-sm text-slate-500 mt-1">{detail.butir.length} butir · skala 1–4</p>
              </div>
            </div>
            <div className="bg-white rounded-b-3xl shadow-xl border border-slate-200 p-8 sm:p-10">
              {!periodeId && <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6 flex items-center gap-2"><AlertCircle size={18} /> Periode belum dipilih. Kembali ke beranda dan pilih periode aktif.</div>}
              {err && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{err}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-1">Nama <span className="text-rose-500">*</span></span>
                  <input value={identitas.nama} onChange={(e) => setIdentitas({ ...identitas, nama: e.target.value })} placeholder="Nama lengkap / inisial" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm" />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-1">Jabatan <span className="text-rose-500">*</span></span>
                  <input value={identitas.jabatan} onChange={(e) => setIdentitas({ ...identitas, jabatan: e.target.value })} placeholder="Contoh: Kaprodi, Asesor" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm" />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-1">Unit <span className="text-rose-500">*</span></span>
                  <input value={identitas.unit} onChange={(e) => setIdentitas({ ...identitas, unit: e.target.value })} placeholder="FITK / Pascasarjana / Universitas" className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm" />
                </label>
                {needProdi ? (
                  <>
                    <label className="block">
                      <span className="block text-sm font-medium text-slate-700 mb-1">Fakultas <span className="text-rose-500">*</span></span>
                      <select value={identitas.fakultas} onChange={(e) => setIdentitas({ ...identitas, fakultas: e.target.value, prodi: "" })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm">
                        <option value="">Pilih Fakultas</option>
                        {fakultasList.map((f) => <option key={f.id} value={f.nama}>{f.nama}</option>)}
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="block text-sm font-medium text-slate-700 mb-1">Program Studi <span className="text-rose-500">*</span></span>
                      <select value={identitas.prodi} onChange={(e) => setIdentitas({ ...identitas, prodi: e.target.value })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors text-sm">
                        <option value="">Pilih Prodi</option>
                        {prodiOpts.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </label>
                  </>
                ) : (
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

        {/* Dimensi — SurveyFlow questions list 1:1 */}
        {isPenilaian && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-t-3xl shadow-sm border border-slate-200 p-8 sm:p-10 border-b-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="relative">
                <h2 className="text-3xl font-extrabold text-slate-900">{dims[step - 1]}</h2>
                <p className="text-lg text-slate-600 leading-relaxed mt-2 max-w-3xl">{currentDimButir.length} pernyataan · pilih 1–4 (1 di kiri) · {currentDimButir.filter((b) => skor[b.id] >= 1).length}/{currentDimButir.length} terisi</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs"><span className="px-2 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold">1 Sangat Kurang</span><span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold">2 Kurang</span><span className="px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">3 Baik</span><span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">4 Sangat Baik</span></div>
              </div>
            </div>
            <div className="bg-white rounded-b-3xl shadow-xl border border-slate-200 p-8 sm:p-10">
              <div className="space-y-10">
                {currentDimButir.map((b, idx) => (
                  <div key={b.id} className="relative">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-start">
                      <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-sm mr-3 mt-0.5">{idx + 1}</span>
                      <span>{b.teks}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:ml-11">
                      {[1, 2, 3, 4].map((rating) => {
                        const isSelected = skor[b.id] === rating;
                        return (
                          <button type="button" key={rating} onClick={() => handleOptionSelect(b.id, rating)}
                            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 group text-center ${isSelected ? "border-indigo-600 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"}`}>
                            <span className={`font-bold text-xl mb-1 ${isSelected ? "text-indigo-700" : "text-slate-400 group-hover:text-indigo-500"}`}>{rating}</span>
                            <span className={`font-medium text-xs ${isSelected ? "text-indigo-900" : "text-slate-500"}`}>{SCALE_LABELS[rating]}</span>
                            {isSelected && <span className="absolute top-2 right-2 text-indigo-600"><Check size={16} strokeWidth={3} /></span>}
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

        {/* Terbuka — SurveyFlow style */}
        {step === dims.length + 1 && (
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-t-3xl shadow-sm border border-slate-200 p-8 sm:p-10 border-b-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="relative">
                <h2 className="text-3xl font-extrabold text-slate-900">Pertanyaan Terbuka</h2>
                <p className="text-lg text-slate-600 leading-relaxed mt-2 max-w-3xl">Q21–Q25 — opsional, boleh dikosongkan. Dipakai untuk Temuan &amp; RTL.</p>
              </div>
            </div>
            <div className="bg-white rounded-b-3xl shadow-xl border border-slate-200 p-8 sm:p-10">
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
            <div className="animate-fade-in-up space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-10 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} /></div>
                <h2 className="text-2xl font-extrabold text-slate-900">Review &amp; Kirim</h2>
                <p className="text-slate-600 mt-2">Periksa kembali sebelum mengirim. {totalAnswered}/{totalButir} terisi · {dims.length} dimensi · {terbukaCount}/5 terbuka.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${missingDims.length ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>{missingDims.length ? `${missingDims.length} dimensi belum lengkap` : "Semua dimensi terisi — siap kirim"}</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><ClipboardList size={18} className="text-indigo-600" /> Identitas Responden</h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Nama</p><p className="font-semibold text-slate-800 mt-1 break-words">{identitas.nama || "—"}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Jabatan</p><p className="font-semibold text-slate-800 mt-1 break-words">{identitas.jabatan || "—"}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Unit</p><p className="font-semibold text-slate-800 mt-1 break-words">{identitas.unit || "—"}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Periode</p>
                    <div className="mt-1">
                      {!periodeId ? <p className="text-slate-400 text-sm">Belum dipilih</p> : periodeInfo ? (
                        <><p className="font-semibold text-slate-800 text-sm">{periodeInfo.nama} — {periodeInfo.tahun}</p><p className="text-xs text-slate-500 mt-1 flex items-center gap-2"><span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${periodeInfo.status === "aktif" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200"}`}>{periodeInfo.status}</span><span className="font-mono text-[11px]">{periodeInfo.id.slice(0, 8)}…</span></p></>
                      ) : periodeErr ? <p className="font-mono text-sm text-amber-700">{periodeId.slice(0, 8)}… (tidak ditemukan)</p> : <p className="text-sm text-slate-400 animate-pulse">Memuat periode…</p>}
                    </div>
                  </div>
                  {needProdi && <><div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Fakultas</p><p className="font-semibold text-slate-800 mt-1 break-words">{identitas.fakultas || "—"}</p></div><div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Program Studi</p><p className="font-semibold text-slate-800 mt-1 break-words">{identitas.prodi || "—"}</p></div></>}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <h3 className="font-bold text-slate-800">Rincian per Dimensi</h3>
                <p className="text-xs text-slate-500 mt-1">Skala 1–4 · rata-rata &amp; label mutu per dimensi.</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {avgPerDim.map((r) => {
                    const done = r.filled === r.total;
                    return (
                      <div key={r.dim} className={`rounded-2xl border p-4 ${done ? "bg-white border-slate-200" : "bg-amber-50/60 border-amber-200"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-800">{r.dim}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${r.label === "Sangat Baik" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : r.label === "Baik" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : r.label === "Kurang" ? "bg-amber-50 border-amber-200 text-amber-700" : r.label === "Sangat Kurang" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-200"}`}>{r.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{r.total} pernyataan · terisi <b className={done ? "text-emerald-700" : "text-amber-700"}>{r.filled}/{r.total}</b> · rata-rata <b className="text-slate-800">{r.avg == null ? "—" : r.avg.toFixed(2)}</b></p>
                        {!done && <button onClick={() => setStep(1 + dims.indexOf(r.dim))} className="mt-3 w-full py-2 bg-white border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-50">Lengkapi {r.dim} →</button>}
                      </div>
                    );
                  })}
                </div>
                {Object.values(terbuka).some((v) => String(v).trim()) && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Jawaban terbuka (Q21–Q25)</p>
                    <div className="mt-2 space-y-2 text-sm">
                      {(["q21","q22","q23","q24","q25"] as const).map((k, i) => {
                        const v = String((terbuka as any)[k] ?? "").trim();
                        if (!v) return null;
                        return <div key={k} className="bg-white border border-slate-200 rounded-xl px-3 py-2"><span className="font-bold text-slate-700">Q{21+i}:</span> <span className="text-slate-600">{v}</span></div>;
                      })}
                    </div>
                  </div>
                )}
                {missingDims.length > 0 && <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" /><span>Lengkapi semua dimensi: <b>{missingDims.join(", ")}</b>.</span></div>}
                <button onClick={() => setShowConfirm(true)} disabled={submitting || !periodeId || !!missingDims.length} className="mt-6 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> {submitting ? "Mengirim..." : "Kirim Survei"}
                </button>
                {err && <div className="mt-3 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">{err}</div>}
              </div>
            </div>
          );
        })()}

        {/* Navigation — SurveyFlow 1:1 */}
        <div className="flex justify-between items-center mt-8">
          <button type="button" onClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))} disabled={step === 0 && false}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${step === 0 ? "text-slate-400 bg-white border border-slate-200 hover:bg-slate-50" : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm"}`}>
            <ChevronLeft size={20} />
            <span>{step === 0 ? "Beranda" : "Sebelumnya"}</span>
          </button>
          {step < dims.length + 2 ? (
            <button type="button" onClick={handleNext} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md">
              <span>{step === 0 ? "Lanjut ke Penilaian" : isPenilaian && step < dims.length ? `Lanjut ke ${dims[step] ?? "berikutnya"}` : step === dims.length ? "Lanjut ke Terbuka" : "Lanjut ke Review"}</span>
              <ChevronRight size={20} />
            </button>
          ) : <span className="text-xs text-slate-400 hidden sm:inline">Periksa lalu Kirim Survei di atas</span>}
        </div>
      </main>

      {/* Confirm modal — SurveyFlow card */}
      {showConfirm && (() => {
        const totalAnswered = Object.keys(skor).length;
        const totalButir = detail.butir.length;
        const avgAll = (() => { const vals = detail.butir.map((b) => skor[b.id]).filter((v) => v >= 1); return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null; })();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button aria-label="Tutup" onClick={() => !submitting && setShowConfirm(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up">
              <div className="bg-white p-8 text-center border-b border-slate-100">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} /></div>
                <h3 className="text-xl font-bold text-slate-900">Kirim jawaban sekarang?</h3>
                <p className="text-sm text-slate-500 mt-1">Jawaban akan terekam dan tidak dapat diubah.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-center"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Angket</p><p className="text-sm font-bold text-slate-800">{K}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-center"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Terisi</p><p className="text-sm font-bold text-slate-800">{totalAnswered}/{totalButir}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-center"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Rata-rata</p><p className="text-sm font-bold text-indigo-600">{avgAll == null ? "—" : avgAll.toFixed(2)}</p></div>
                </div>
                {err && <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-3 py-2.5 text-sm">{err}</div>}
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)} disabled={submitting} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold disabled:opacity-50">Batal</button>
                  <button onClick={doSubmit} disabled={submitting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"><CheckCircle2 size={16} /> {submitting ? "Mengirim..." : "Ya, kirim"}</button>
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

