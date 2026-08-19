import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

type Butir = { id: string; templateId: string; dimensi: string; nomor: number; teks: string; urut: number };
type AngketDetail = { template: { kode: string; nama: string; label: string }; dimensiOrder: string[]; grouped: Record<string, Butir[]>; butir: Butir[] };
type PeriodeInfo = { id: string; nama: string; tahun: number; status: string; tglMulai?: string; tglSelesai?: string };

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

  const stepsMeta = useMemo(() => {
    return [
      { label: "Identitas", sub: needProdi ? "Nama & prodi" : "Nama & unit", icon: "fa-id-card" },
      { label: "Penilaian", sub: `${dims.length} dimensi · ${detail?.butir.length ?? 0} butir`, icon: "fa-list-check" },
      { label: "Terbuka", sub: "Q21–Q25", icon: "fa-comment-dots" },
      { label: "Review", sub: "Kirim", icon: "fa-paper-plane" },
    ];
  }, [dims, detail, needProdi]);
  const stepperIndex = step === 0 ? 0 : step >= 1 && step <= dims.length ? 1 : step === dims.length + 1 ? 2 : 3;

  const currentDimButir = step >= 1 && step <= dims.length ? (detail?.grouped[dims[step - 1]] ?? []) : [];

  const isIdentitasDone = useMemo(() => {
    if (!identitas.nama.trim() || !identitas.jabatan.trim() || !identitas.unit.trim()) return false;
    if (needProdi && (!identitas.fakultas.trim() || !identitas.prodi.trim())) return false;
    if (!periodeId) return false;
    return true;
  }, [identitas, needProdi, periodeId]);
  const dimDone = (dim: string) => (detail?.grouped[dim] ?? []).every((b) => skor[b.id] >= 1 && skor[b.id] <= 4);
  const dimFilled = (dim: string) => (detail?.grouped[dim] ?? []).filter((b) => skor[b.id] >= 1).length;
  const allDimsDone = dims.length > 0 && dims.every(dimDone);
  // step 0..dims.length+2 reachable: identitas must be done to reach penilaian etc; each dim must be done in order
  const stepReachable = (target: number) => {
    if (target <= 0) return true;
    if (!isIdentitasDone) return false;
    // to reach a penilaian step N (1-indexed), all earlier dims must be done
    if (target >= 1 && target <= dims.length) {
      for (let i = 0; i < target - 1; i++) if (!dimDone(dims[i])) return false;
      return true;
    }
    if (target === dims.length + 1) return allDimsDone; // terbuka
    if (target === dims.length + 2) return allDimsDone; // review
    return true;
  };
  const isDoneByOutcome = (outerIdx: number) => {
    if (outerIdx === 0) return isIdentitasDone;
    if (outerIdx === 1) return allDimsDone;
    if (outerIdx === 2) return false; // terbuka opsional — never blocks
    if (outerIdx === 3) return false;
    return false;
  };
  // canNext must react to skor — jangan pakai memo yang deps-nya ketinggalan skor (bug: tombol Lanjut tetap disabled walau sudah terisi)
  const canNext = (() => {
    if (step === 0) return isIdentitasDone;
    if (step >= 1 && step <= dims.length) return currentDimButir.every((b) => skor[b.id] >= 1 && skor[b.id] <= 4);
    return true;
  })();

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

  if (!detail) return <div className="max-w-3xl mx-auto p-8 text-sm text-slate-600">{err ? <span className="text-rose-600">{err}</span> : "Memuat angket..."}</div>;

  const selectedFak = fakultasList.find((f) => f.nama === identitas.fakultas);
  const prodiOpts: string[] = selectedFak ? selectedFak.prodi.map((p: any) => p.nama) : [];

  const pct = Math.round(((step + 1) / totalSteps) * 100);
  // outer stepper is only 4 steps now — no scroll
  const isPenilaian = step >= 1 && step <= dims.length;
  const dimIdx = isPenilaian ? step - 1 : -1;
  const dimProgress = isPenilaian ? `${currentDimButir.filter((b) => skor[b.id] >= 1).length}/${currentDimButir.length}` : "";
  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))} className="w-9 h-9 shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-arrow-left text-xs" />
            </button>
            <div className="w-9 h-9 shrink-0 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <i className={`fa-solid ${K === "FAK" ? "fa-graduation-cap" : K === "MHS" ? "fa-user-graduate" : K === "ASESOR" ? "fa-chalkboard-user" : K === "LPM" ? "fa-magnifying-glass-chart" : K === "SEK" ? "fa-folder-open" : "fa-building-columns"} text-sm`} />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-slate-900 text-sm leading-none truncate">{detail.template.label}</h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">UIN Raden Fatah · RPL Tipe A · <b className="text-indigo-600">{K}</b> · {detail.butir.length} butir · skala 1–4</p>
              {RESPONDEN[K] && <p className="text-[11px] text-slate-400 truncate">Responden: {RESPONDEN[K]}</p>}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">{Object.keys(skor).length}/{detail.butir.length}</span>
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">{pct}%</span>
          </div>
          <span className="sm:hidden text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full shrink-0">{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-200"><div className="h-1.5 bg-indigo-600 transition-all" style={{ width: `${pct}%` }} /></div>
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-2.5">
          <ol className="flex items-stretch gap-1.5 sm:gap-2">
            {stepsMeta.map((s, i) => {
              // map outer idx -> real step
              const outerToStep = (idx: number) => idx === 0 ? 0 : idx === 1 ? 1 : idx === 2 ? dims.length + 1 : dims.length + 2;
              const targetStep = outerToStep(i);
              const state = i === stepperIndex ? "active" : i < stepperIndex || isDoneByOutcome(i) ? "done" : "todo";
              const locked = !stepReachable(targetStep);
              // allow going back to already reachable steps, but not forward past incomplete dims
              // actually: any step whose target is reachable can be clicked
              const canClick = stepReachable(targetStep) && targetStep !== step;
              const subText = i === 1 && isPenilaian ? `${dims[dimIdx]} · ${dimProgress}` : i === 1 ? s.sub : s.sub;
              return (
                <li key={i} className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0">
                  {i > 0 && <span className={`hidden sm:block w-4 h-px shrink-0 ${i <= stepperIndex ? "bg-indigo-300" : "bg-slate-200"}`} />}
                  <button
                    type="button"
                    onClick={() => { if (!canClick) return; setStep(targetStep); }}
                    disabled={!canClick}
                    title={locked ? "Lengkapi langkah sebelumnya dahulu" : undefined}
                    className={`flex-1 flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-2 rounded-2xl border text-left transition-all min-w-0 ${locked ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70" : state === "active" ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" : state === "done" ? "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "bg-white border-slate-200 text-slate-400"}`}
                  >
                    <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${locked ? "bg-slate-200 text-slate-400" : state === "active" ? "bg-white/20 text-white" : state === "done" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {locked ? <i className="fa-solid fa-lock text-[10px]" /> : state === "done" ? <i className="fa-solid fa-check text-xs" /> : <i className={`fa-solid ${s.icon} text-xs`} />}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className={`block text-xs font-extrabold truncate ${locked ? "text-slate-400" : state === "active" ? "text-white" : state === "done" ? "text-slate-800" : "text-slate-500"}`}>{s.label}</span>
                      <span className={`block text-[10px] sm:text-xs font-semibold truncate ${locked ? "text-slate-400" : state === "active" ? "text-indigo-100" : state === "done" ? "text-emerald-600" : "text-slate-400"}`}>{locked ? "Terkunci" : subText}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {isPenilaian && dims.length > 1 && (
            <div className="mt-3 flex gap-1.5">
              {dims.map((d, i) => {
                const done = dimDone(d);
                const active = i === dimIdx;
                const filled = dimFilled(d);
                const total = (detail.grouped[d] ?? []).length;
                const reachable = stepReachable(1 + i);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { if (!reachable || active) return; setStep(1 + i); }}
                    disabled={!reachable || active}
                    title={!reachable ? "Selesaikan dimensi sebelumnya dahulu" : undefined}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-bold transition-all ${!reachable ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70" : active ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm" : done ? "bg-white border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${!reachable ? "bg-slate-200 text-slate-400" : active ? "bg-indigo-600 text-white" : done ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>{!reachable ? <i className="fa-solid fa-lock text-[8px]" /> : done && !active ? <i className="fa-solid fa-check" /> : i + 1}</span>
                    <span className="text-[11px] leading-none">{d}</span>
                    <span className="text-[10px] font-semibold leading-none opacity-80">{filled}/{total}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 sm:p-8 mb-6">
          {step === 0 && <div className="text-center max-w-lg mx-auto mb-6"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold tracking-wider uppercase"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Langkah 1/{totalSteps} · Identitas</div><h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-3">{detail.template.label}</h3><p className="text-slate-500 text-sm mt-1">Silakan isi identitas dan beri penilaian — skala 1–4. <b className="text-slate-700">{detail.butir.length} butir</b>.</p>{RESPONDEN[K] && <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1.5"><i className="fa-solid fa-users text-[10px]" /> Responden: {RESPONDEN[K]}</p>}</div>}
          {step >= 1 && step <= dims.length && <div className="text-center max-w-lg mx-auto mb-6"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold tracking-wider uppercase"><i className="fa-solid fa-list-check text-[10px]" /> Langkah {step + 1}/{totalSteps} · {dims[step - 1]} <span className="opacity-60">· {dimProgress} terisi</span></div><h3 className="text-base sm:text-lg font-black text-slate-900 mt-2">{dims[step - 1]}</h3><p className="text-slate-500 text-xs mt-1">{currentDimButir.length} pernyataan · pilih 1–4 (1 di kiri)</p><div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[11px]"><span className="px-2 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold">1 Sangat Kurang</span><span className="px-2 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-bold">2 Kurang</span><span className="px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">3 Baik</span><span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">4 Sangat Baik</span></div></div>}
          {step === dims.length + 1 && <div className="text-center max-w-lg mx-auto mb-6"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold tracking-wider uppercase"><i className="fa-solid fa-comment-dots" /> Langkah {step + 1}/{totalSteps} · Terbuka</div><h3 className="text-lg font-black text-slate-900 mt-2">Pertanyaan Terbuka</h3><p className="text-slate-500 text-sm mt-1">Q21–Q25 — opsional, boleh dikosongkan.</p></div>}
          {step === dims.length + 2 && <div className="text-center max-w-lg mx-auto mb-6"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold tracking-wider uppercase"><i className="fa-solid fa-check" /> Langkah {step + 1}/{totalSteps} · Review</div><h3 className="text-lg font-black text-slate-900 mt-2">Review & Kirim</h3><p className="text-slate-500 text-sm mt-1">Periksa kembali sebelum mengirim.</p></div>}

          {err && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm mb-4">{err}</div>}
          {!periodeId && <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-4">Periode belum dipilih. Kembali ke beranda dan pilih periode aktif.</div>}

          {/* Step 0: Identitas — elegant cards + premium simple focus */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100 p-4 flex gap-3 items-start">
                <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm"><i className="fa-solid fa-id-card text-xs" /></span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 leading-none">Identitas responden</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">MHS boleh inisial. Tanda <span className="text-rose-500">*</span> wajib. Data hanya untuk rekap Monev RPL.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="group block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5"><span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center"><i className="fa-solid fa-user text-[11px]" /></span> Nama <span className="text-rose-500">*</span></span>
                  <input value={identitas.nama} onChange={(e) => setIdentitas({ ...identitas, nama: e.target.value })} placeholder="Nama lengkap / inisial" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition" />
                </label>
                <label className="group block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5"><span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center"><i className="fa-solid fa-briefcase text-[11px]" /></span> Jabatan <span className="text-rose-500">*</span></span>
                  <input value={identitas.jabatan} onChange={(e) => setIdentitas({ ...identitas, jabatan: e.target.value })} placeholder="Contoh: Kaprodi, Asesor" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition" />
                </label>
                <label className="group block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5"><span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center"><i className="fa-solid fa-building-columns text-[11px]" /></span> Unit <span className="text-rose-500">*</span></span>
                  <input value={identitas.unit} onChange={(e) => setIdentitas({ ...identitas, unit: e.target.value })} placeholder="FITK / Pascasarjana / Universitas" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition" />
                </label>
                {needProdi ? (
                  <>
                    <label className="group block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5"><span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><i className="fa-solid fa-graduation-cap text-[11px]" /></span> Fakultas <span className="text-rose-500">*</span></span>
                      <select value={identitas.fakultas} onChange={(e) => setIdentitas({ ...identitas, fakultas: e.target.value, prodi: "" })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition">
                        <option value="">Pilih Fakultas</option>
                        {fakultasList.map((f) => <option key={f.id} value={f.nama}>{f.nama}</option>)}
                      </select>
                    </label>
                    <label className="group block bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all sm:col-span-2">
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5"><span className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center"><i className="fa-solid fa-book-open text-[11px]" /></span> Program Studi <span className="text-rose-500">*</span></span>
                      <select value={identitas.prodi} onChange={(e) => setIdentitas({ ...identitas, prodi: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition">
                        <option value="">Pilih Prodi</option>
                        {prodiOpts.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </label>
                  </>
                ) : (
                  <div className="hidden sm:flex bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 items-center gap-3 text-xs text-slate-500">
                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center"><i className="fa-solid fa-shield-halved text-[11px]" /></span>
                    Privasi terjaga — identitas hanya untuk rekap.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dimensi steps — elegant cards + premium radio */}
          {step >= 1 && step <= dims.length && (
            <div className="space-y-4">
              <div id="questions-container" className="space-y-4">
                {currentDimButir.map((b) => {
                  const sel = skor[b.id];
                  const done = sel >= 1 && sel <= 4;
                  return (
                  <div key={b.id} className={`group relative bg-white border rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all ${done ? "border-indigo-200" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className={`absolute inset-x-0 top-0 h-1 rounded-t-[1.5rem] bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 ${done ? "opacity-100" : "opacity-0 group-hover:opacity-40"} transition-opacity`} />
                    <div className="flex gap-3 items-start">
                      <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${done ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-900 text-white"}`}>Q{b.nomor}</span>
                      <p className="flex-1 font-bold text-slate-800 text-sm sm:text-[15px] leading-relaxed pt-1">{b.teks}</p>
                      <span className={`hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${done ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>{done ? <><i className="fa-solid fa-check text-[10px]" /> Terisi</> : "Pilih 1–4"}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[1, 2, 3, 4].map((n) => {
                        const active = sel === n;
                        const cfg: Record<number, { txt: string; on: string; off: string }> = {
                          1: { txt: "Sangat Kurang", on: "border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-200", off: "border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:bg-slate-50" },
                          2: { txt: "Kurang", on: "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200", off: "border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:bg-slate-50" },
                          3: { txt: "Baik", on: "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200", off: "border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:bg-slate-50" },
                          4: { txt: "Sangat Baik", on: "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-200", off: "border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:bg-slate-50" },
                        };
                        const c = cfg[n];
                        return (
                          <label key={n} className="cursor-pointer">
                            <input type="radio" name={`q-${b.id}`} checked={active} onChange={() => setSkor((s) => ({ ...s, [b.id]: n }))} className="peer sr-only" />
                            <div className={`text-center p-3.5 rounded-2xl border-2 font-bold text-xs transition-all ${active ? c.on : c.off} ${active ? "scale-[1.02]" : ""}`}>
                              <div className="text-xl font-black leading-none">{n}</div>
                              <div className="mt-1 leading-tight">{c.txt}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Terbuka — elegant cards + premium focus */}
          {step === dims.length + 1 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-900 text-white p-4 flex gap-3 items-center">
                <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><i className="fa-solid fa-comment-dots text-xs" /></span>
                <div className="min-w-0">
                  <p className="text-xs font-black tracking-wide">Pertanyaan terbuka — opsional</p>
                  <p className="text-xs opacity-60 leading-relaxed">Q21–Q25 boleh dikosongkan. Dipakai untuk Temuan & RTL.</p>
                </div>
                <span className="hidden sm:inline-flex shrink-0 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold">5 soal</span>
              </div>
              {[
                ["q21", "21. Kekuatan penyelenggaraan RPL", "fa-star"],
                ["q22", "22. Kendala yang dihadapi", "fa-triangle-exclamation"],
                ["q23", "23. Perbaikan asesmen yang diharapkan", "fa-wrench"],
                ["q24", "24. Rekomendasi", "fa-lightbulb"],
                ["q25", "25. Ketidaksesuaian dengan pedoman (jika ada)", "fa-scale-balanced"],
              ].map(([k, label, icon]) => {
                const v = String((terbuka as any)[k] ?? "");
                const filled = v.trim().length > 0;
                return (
                <label key={k} className={`group block bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${filled ? "border-indigo-200" : "border-slate-200 hover:border-slate-300"}`}>
                  <span className="flex items-center justify-between gap-3 mb-3">
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${filled ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500"}`}><i className={`fa-solid ${icon} text-xs`} /></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 truncate">{label}</span>
                    </span>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border ${filled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>{filled ? "Terisi" : "Opsional"}</span>
                  </span>
                  <textarea value={v} onChange={(e) => setTerbuka({ ...terbuka, [k]: e.target.value })} rows={3} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition" placeholder="Tulis jawaban..." />
                </label>
                );
              })}
            </div>
          )}

          {/* Review — dirancang ulang: ringkasan per dimensi + identitas + terbuka */}
          {step === dims.length + 2 && (() => {
            const totalAnswered = Object.keys(skor).length;
            const totalButir = detail.butir.length;
            const terbukaCount = Object.values(terbuka).filter((v) => String(v).trim()).length;
            const avgPerDim: { dim: string; avg: number | null; label: string }[] = dims.map((d) => {
              const items = detail.grouped[d] ?? [];
              const vals = items.map((b) => skor[b.id]).filter((v) => v >= 1);
              const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
              const label = avg == null ? "-" : avg >= 3.5 ? "Sangat Baik" : avg >= 2.5 ? "Baik" : avg >= 1.5 ? "Kurang" : "Sangat Kurang";
              return { dim: d, avg, label };
            });
            const missingDims = dims.filter((d) => !dimDone(d));
            return (
            <div className="space-y-5">
              {/* hero */}
              <div className="rounded-[1.5rem] bg-gradient-to-br from-indigo-600 to-violet-600 p-5 sm:p-6 text-white shadow-lg shadow-indigo-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold tracking-widest uppercase opacity-80">Review & Kirim</p>
                    <h4 className="text-lg font-black mt-1 leading-tight">Periksa kembali jawaban Anda</h4>
                    <p className="text-sm opacity-90 mt-1">Pastikan setiap dimensi sudah terisi sebelum mengirim.</p>
                  </div>
                  <span className="shrink-0 w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center"><i className="fa-solid fa-clipboard-check text-lg" /></span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="bg-white/10 backdrop-blur rounded-2xl px-3 py-3 border border-white/15"><p className="text-[11px] font-semibold opacity-80">Terisi</p><p className="text-xl font-black">{totalAnswered}/{totalButir}</p><p className="text-[11px] opacity-80">{dims.length} dimensi</p></div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl px-3 py-3 border border-white/15"><p className="text-[11px] font-semibold opacity-80">Terbuka</p><p className="text-xl font-black">{terbukaCount}/5</p><p className="text-[11px] opacity-80">Q21-Q25</p></div>
                  <div className="bg-white/10 backdrop-blur rounded-2xl px-3 py-3 border border-white/15"><p className="text-[11px] font-semibold opacity-80">Status</p><p className="text-sm font-black flex items-center gap-1.5 mt-1">{missingDims.length ? <><i className="fa-solid fa-triangle-exclamation" /> Belum lengkap</> : <><i className="fa-solid fa-circle-check" /> Siap kirim</>}</p><p className="text-[11px] opacity-80">{missingDims.length ? `${missingDims.length} dimensi kosong` : "Semua dimensi terisi"}</p></div>
                </div>
              </div>

              {/* identitas */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3"><span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i className="fa-solid fa-id-card text-xs" /></span><h5 className="text-sm font-extrabold text-slate-900">Identitas Responden</h5><span className="ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">Lengkap</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nama</p><p className="font-semibold text-slate-800 truncate">{identitas.nama || "-"}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jabatan</p><p className="font-semibold text-slate-800 truncate">{identitas.jabatan || "-"}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unit</p><p className="font-semibold text-slate-800 truncate">{identitas.unit || "-"}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Periode</p>
                    {!periodeId ? (
                      <p className="font-semibold text-slate-400 text-xs">Belum dipilih</p>
                    ) : periodeInfo ? (
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm leading-tight truncate" title={`${periodeInfo.nama} — ${periodeInfo.tahun}`}>{periodeInfo.nama} — {periodeInfo.tahun}</p>
                        <p className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-bold border text-[10px] leading-none ${periodeInfo.status === "aktif" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : periodeInfo.status === "tutup" ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-amber-50 border-amber-200 text-amber-700"}`}>{periodeInfo.status}</span>
                          <span className="text-[11px] text-slate-400 font-mono truncate" title={periodeInfo.id}>{periodeInfo.id.slice(0, 8)}…</span>
                        </p>
                      </div>
                    ) : periodeErr ? (
                      <p className="font-mono text-xs font-semibold text-amber-700" title={periodeId}>{periodeId.slice(0, 8)}… <span className="font-sans font-normal text-amber-600">(tidak ditemukan)</span></p>
                    ) : (
                      <p className="text-xs text-slate-400 animate-pulse">Memuat periode…</p>
                    )}
                  </div>
                  {needProdi && <><div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fakultas</p><p className="font-semibold text-slate-800 truncate">{identitas.fakultas || "-"}</p></div><div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Program Studi</p><p className="font-semibold text-slate-800 truncate">{identitas.prodi || "-"}</p></div></>}
                </div>
              </div>

              {/* per dimensi */}
              <div className="space-y-3">
                <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><i className="fa-solid fa-layer-group text-xs" /></span><h5 className="text-sm font-extrabold text-slate-900">Rincian per Dimensi</h5><span className="text-xs text-slate-400">skala 1-4</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {avgPerDim.map((r) => {
                    const filled = dimFilled(r.dim);
                    const total = (detail.grouped[r.dim] ?? []).length;
                    const done = dimDone(r.dim);
                    const vals = (detail.grouped[r.dim] ?? []).map((b) => skor[b.id] ?? 0);
                    return (
                      <div key={r.dim} className={`rounded-2xl border p-4 ${done ? "bg-white border-slate-200" : "bg-amber-50/60 border-amber-200"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${done ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>{done ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-minus" />}</span> {r.dim}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{total} pernyataan · terisi <b className={done ? "text-emerald-700" : "text-amber-700"}>{filled}/{total}</b> · rata-rata <b className="text-slate-800">{r.avg == null ? "-" : r.avg.toFixed(2)}</b></p>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border ${r.label === "Sangat Baik" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : r.label === "Baik" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : r.label === "Kurang" ? "bg-orange-50 border-orange-200 text-orange-700" : r.label === "Sangat Kurang" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>{r.label}</span>
                        </div>
                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-1.5 rounded-full transition-all ${done ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${total ? (filled / total) * 100 : 0}%` }} /></div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {vals.map((v, idx) => (
                            <span key={idx} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border ${v === 4 ? "bg-emerald-600 text-white border-emerald-600" : v === 3 ? "bg-indigo-600 text-white border-indigo-600" : v === 2 ? "bg-orange-500 text-white border-orange-500" : v === 1 ? "bg-rose-500 text-white border-rose-500" : "bg-slate-100 text-slate-400 border-slate-200"}`}>{v || "-"}</span>
                          ))}
                        </div>
                        {!done && <button onClick={() => setStep(1 + dims.indexOf(r.dim))} className="mt-3 w-full py-2 bg-white border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-50">Lengkapi {r.dim} →</button>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* terbuka ringkas */}
              {(Object.values(terbuka).some((v) => String(v).trim())) && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Pertanyaan terbuka (Q21–Q25)</p>
                  <div className="space-y-2 text-sm">
                    {(["q21","q22","q23","q24","q25"] as const).map((k, i) => {
                      const v = String((terbuka as any)[k] ?? "").trim();
                      if (!v) return null;
                      return <div key={k} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"><span className="font-bold text-slate-700">Q{21+i}:</span> <span className="text-slate-600 line-clamp-3">{v}</span></div>;
                    })}
                  </div>
                </div>
              )}

              {missingDims.length > 0 && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-start gap-2"><i className="fa-solid fa-lock mt-0.5 text-xs" /><span>Lengkapi semua dimensi terlebih dahulu — dimensi yang belum terisi: <b>{missingDims.join(", ")}</b>.</span></div>}

              <button onClick={() => setShowConfirm(true)} disabled={submitting || !periodeId || missingDims.length > 0} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <i className="fa-solid fa-paper-plane" /> {submitting ? "Mengirim..." : "Kirim Jawaban Sekarang"}
              </button>
              <p className="text-center text-[11px] text-slate-400">Dengan mengirim, Anda menyetujui data direkap untuk Monev RPL UIN Raden Fatah Palembang.</p>
            </div>
            );
          })()}

          {/* Nav — sticky bottom actions, per-step hint */}
          {!canNext && step >= 1 && step <= dims.length && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Lengkapi semua {currentDimButir.length} pernyataan di dimensi <b>{dims[step - 1]}</b> untuk melanjutkan.</p>}
          {!canNext && step === 0 && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Lengkapi identitas{needProdi ? " (termasuk Fakultas & Prodi) " : " "}dan pastikan periode terpilih.</p>}
          <div className="flex gap-3 pt-4">
            {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="px-5 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2"><i className="fa-solid fa-arrow-left text-xs" /> Kembali</button>}
            {step < dims.length + 2 && (
              <button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2">
                {step === 0 ? "Lanjut ke dimensi" : step === dims.length ? "Lanjut ke pertanyaan terbuka" : step === dims.length + 1 ? "Lanjut ke review" : `Lanjut: ${dims[step] ?? "berikutnya"}`} <i className="fa-solid fa-arrow-right" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Modal konfirmasi kirim */}
      {showConfirm && (() => {
        const totalAnswered = Object.keys(skor).length;
        const totalButir = detail.butir.length;
        const avgAll = (() => { const vals = detail.butir.map((b) => skor[b.id]).filter((v) => v >= 1); return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : null; })();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button aria-label="Tutup" onClick={() => !submitting && setShowConfirm(false)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-white rounded-[1.75rem] shadow-2xl border border-slate-200 overflow-hidden animate-[pop_0.22s_ease-out]">
              <style>{`@keyframes pop{from{opacity:0;transform:scale(0.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><i className="fa-solid fa-shield-check text-xl" /></div>
                  <button onClick={() => !submitting && setShowConfirm(false)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"><i className="fa-solid fa-xmark text-sm" /></button>
                </div>
                <h3 className="text-lg font-black mt-4 leading-tight">Kirim jawaban sekarang?</h3>
                <p className="text-sm opacity-90 mt-1">Jawaban akan terekam dan tidak dapat diubah setelah dikirim.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-center"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Angket</p><p className="text-sm font-black text-slate-800">{K}</p><p className="text-[11px] text-slate-500">{detail.template.label}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-center"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Terisi</p><p className="text-sm font-black text-slate-800">{totalAnswered}/{totalButir}</p><p className="text-[11px] text-slate-500">{dims.length} dimensi</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-center"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-rata</p><p className="text-sm font-black text-indigo-600">{avgAll == null ? "-" : avgAll.toFixed(2)}</p><p className="text-[11px] text-slate-500">skala 1-4</p></div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Nama</span><b className="text-slate-800 truncate ml-2">{identitas.nama}</b></div>
                  <div className="flex justify-between"><span className="text-slate-500">Jabatan / Unit</span><span className="text-slate-800 truncate ml-2">{identitas.jabatan} / {identitas.unit}</span></div>
                  <div className="flex flex-wrap gap-1.5 pt-1">{dims.map((d) => { const f = dimFilled(d); const t = (detail.grouped[d] ?? []).length; const ok = dimDone(d); return <span key={d} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>{ok ? <i className="fa-solid fa-check text-[10px]" /> : <i className="fa-solid fa-minus text-[10px]" />} {d} {f}/{t}</span>; })}</div>
                </div>
                {err && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2.5 text-sm">{err}</div>}
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)} disabled={submitting} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold disabled:opacity-50">Batal</button>
                  <button onClick={doSubmit} disabled={submitting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"><i className={`fa-solid ${submitting ? "fa-spinner fa-spin" : "fa-paper-plane"} text-xs`} /> {submitting ? "Mengirim..." : "Ya, kirim"}</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
