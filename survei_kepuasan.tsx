import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  BarChart3, 
  Users, 
  Star, 
  ArrowLeft, 
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Lock,
  User,
  Check,
  AlertCircle
} from 'lucide-react';

const SURVEY_DIMENSIONS = [
  {
    id: 'dim1',
    title: 'Dimensi Input (Persiapan & Fasilitas)',
    description: 'Penilaian terhadap kesiapan sumber daya, fasilitas, dan kejelasan informasi sebelum layanan dimulai.',
    questions: [
      { id: 'q_i1', text: 'Bagaimana penilaian Anda terhadap kesiapan dan kebersihan fasilitas layanan?' },
      { id: 'q_i2', text: 'Seberapa jelas dan mudah dipahami informasi awal yang diberikan kepada Anda?' },
      { id: 'q_i3', text: 'Bagaimana kemudahan prosedur atau persyaratan untuk memulai layanan?' },
      { id: 'q_i4', text: 'Bagaimana sikap dan keramahan petugas saat pertama kali Anda berinteraksi?' },
      { id: 'q_i5', text: 'Bagaimana ketersediaan dan keandalan sistem pendaftaran/antrean yang ada?' }
    ]
  },
  {
    id: 'dim2',
    title: 'Dimensi Proses (Pelaksanaan Layanan)',
    description: 'Penilaian terhadap jalannya proses pelayanan, kompetensi, dan responsivitas tim kami.',
    questions: [
      { id: 'q_p1', text: 'Bagaimana kecepatan pelayanan jika dibandingkan dengan standar waktu yang dijanjikan?' },
      { id: 'q_p2', text: 'Bagaimana ketepatan waktu dan kedisiplinan petugas dalam memberikan layanan?' },
      { id: 'q_p3', text: 'Seberapa jelas alur dan tahapan selama proses layanan berlangsung?' },
      { id: 'q_p4', text: 'Bagaimana tingkat profesionalisme dan kompetensi petugas dalam menangani kebutuhan Anda?' },
      { id: 'q_p5', text: 'Seberapa responsif petugas dalam menanggapi pertanyaan, keluhan, atau hambatan teknis?' },
      { id: 'q_p6', text: 'Bagaimana kelancaran komunikasi antara petugas dan pengguna layanan?' },
      { id: 'q_p7', text: 'Bagaimana transparansi informasi mengenai proses dan langkah-langkah layanan?' },
      { id: 'q_p8', text: 'Bagaimana tingkat kepedulian (empati) petugas terhadap kondisi dan kebutuhan spesifik Anda?' },
      { id: 'q_p9', text: 'Seberapa andal alat, aplikasi, atau sistem yang digunakan selama proses berlangsung?' },
      { id: 'q_p10', text: 'Bagaimana tingkat kenyamanan dan keamanan Anda selama berinteraksi dalam proses layanan ini?' }
    ]
  }
];

const ALL_QUESTIONS = SURVEY_DIMENSIONS.flatMap(dim => dim.questions);

const SCALE_LABELS = {
  1: 'Kurang Baik',
  2: 'Cukup',
  3: 'Baik',
  4: 'Sangat Baik'
};

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

export default function App() {
  // Navigation States
  const [view, setView] = useState('welcome'); // 'welcome', 'survey', 'success', 'login', 'admin'
  const [adminMenu, setAdminMenu] = useState('dashboard'); // 'dashboard', 'responses'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Survey States
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [submittedData, setSubmittedData] = useState([]);
  const [validationError, setValidationError] = useState('');

  // Form States (Login)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const savedData = localStorage.getItem('surveyResponses');
    if (savedData) {
      setSubmittedData(JSON.parse(savedData));
    }
    
    // Check if previously logged in (mock session)
    const session = sessionStorage.getItem('adminAuth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle window resize for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setLoginError('');
      setUsername('');
      setPassword('');
      setView('admin');
    } else {
      setLoginError('Username atau password tidak valid. (Gunakan: admin / password123)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    setView('welcome');
    setAdminMenu('dashboard');
  };

  const handleOptionSelect = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    setValidationError('');
  };

  const handleNextStep = () => {
    const currentDim = SURVEY_DIMENSIONS[currentStep];
    const unanswered = currentDim.questions.filter(q => !responses[q.id]);
    
    if (unanswered.length > 0) {
      setValidationError(`Silakan lengkapi ${unanswered.length} pertanyaan lagi di bagian ini sebelum melanjutkan.`);
      return;
    }
    setValidationError('');
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setValidationError('');
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmitSurvey = () => {
    const currentDim = SURVEY_DIMENSIONS[currentStep];
    const unanswered = currentDim.questions.filter(q => !responses[q.id]);
    
    if (unanswered.length > 0) {
      setValidationError(`Silakan lengkapi ${unanswered.length} pertanyaan terakhir untuk menyelesaikan survei.`);
      return;
    }

    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString('id-ID'),
      answers: responses
    };
    
    const updatedData = [...submittedData, newEntry];
    setSubmittedData(updatedData);
    localStorage.setItem('surveyResponses', JSON.stringify(updatedData));
    
    setView('success');
  };

  const resetSurvey = () => {
    setView('welcome');
    setCurrentStep(0);
    setResponses({});
  };

  const renderWelcome = () => (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in-up px-4 text-center">
      <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-200">
        <ShieldCheck size={40} />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
        Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">SurveyFlow</span>
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed">
        Bantu kami meningkatkan kualitas layanan dengan memberikan umpan balik Anda. 
        Pendapat Anda sangat berharga dan waktu pengisian hanya memakan waktu 1-2 menit.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <button
          onClick={() => setView('survey')}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1"
        >
          <span>Mulai Survei</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in-up">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Login Admin</h2>
          <p className="text-slate-500 mt-2 text-sm">Masuk untuk melihat hasil dan analitik.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {loginError && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold transition-colors mt-4"
          >
            Masuk ke Dashboard
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => setView('welcome')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            &larr; Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );

  const renderSurvey = () => {
    const currentDim = SURVEY_DIMENSIONS[currentStep];
    const progress = ((currentStep + 1) / SURVEY_DIMENSIONS.length) * 100;

    return (
      <div className="max-w-4xl mx-auto animate-fade-in-up py-8 px-4 sm:px-0">
        {/* Progress Header */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-indigo-600 tracking-wider uppercase">
              Bagian {currentStep + 1} dari {SURVEY_DIMENSIONS.length}: {currentDim.title.split(' ')[0]} {currentDim.title.split(' ')[1]}
            </span>
            <span className="text-sm text-slate-500 font-medium">{Math.round(progress)}% Selesai</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Dimension Header */}
        <div className="bg-white rounded-t-3xl shadow-sm border border-slate-200 p-8 sm:p-10 border-b-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
           <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{currentDim.title}</h2>
            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">{currentDim.description}</p>
           </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-b-3xl shadow-xl border border-slate-200 p-8 sm:p-10 mb-8">
          <div className="space-y-10">
            {currentDim.questions.map((q, idx) => {
              const isAnswered = !!responses[q.id];
              return (
                <div key={q.id} className="relative">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-start">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-sm mr-3 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{q.text}</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 ml-0 sm:ml-11">
                    {[1, 2, 3, 4].map((rating) => {
                      const isSelected = responses[q.id] === rating;
                      return (
                        <button
                          type="button"
                          key={rating}
                          onClick={() => handleOptionSelect(q.id, rating)}
                          className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 group text-center
                            ${isSelected 
                              ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                              : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                            }`}
                        >
                          <span className={`font-bold text-xl mb-1 ${isSelected ? 'text-indigo-700' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                            {rating}
                          </span>
                          <span className={`font-medium text-xs ${isSelected ? 'text-indigo-900' : 'text-slate-500'}`}>
                            {SCALE_LABELS[rating]}
                          </span>
                          
                          {isSelected && (
                            <div className="absolute top-2 right-2 text-indigo-600 animate-in zoom-in duration-200">
                              <Check size={16} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {validationError && (
            <div className="mt-10 bg-red-50 text-red-700 p-5 rounded-xl border border-red-100 flex items-center animate-shake">
              <AlertCircle size={24} className="mr-3 flex-shrink-0" />
              <span className="font-semibold">{validationError}</span>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all
              ${currentStep === 0 
                ? 'text-slate-300 cursor-not-allowed opacity-50' 
                : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm'}`}
          >
            <ChevronLeft size={20} />
            <span>Sebelumnya</span>
          </button>

          {currentStep < SURVEY_DIMENSIONS.length - 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md transform active:scale-95"
            >
              <span>Lanjut ke {SURVEY_DIMENSIONS[currentStep + 1].title.split(' ')[1]}</span>
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitSurvey}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 transform active:scale-95"
            >
              <span>Kirim Survei</span>
              <CheckCircle2 size={20} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in-up px-4">
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-xl text-center">
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slight">
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Survei Berhasil Dikirim!</h2>
        <p className="text-slate-600 text-lg mb-10 leading-relaxed">
          Terima kasih telah meluangkan waktu untuk berpartisipasi. Masukan Anda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan.
        </p>
        <button
          onClick={resetSurvey}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-8 py-4 rounded-xl font-bold transition-colors w-full sm:w-auto"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );

  const calculateAverages = () => {
    if (submittedData.length === 0) return { total: 0, overall: 0, breakdownDim: {} };

    let totalScore = 0;
    
    // Track scores per dimension
    const dimScores = {};
    SURVEY_DIMENSIONS.forEach(dim => {
      dimScores[dim.id] = { totalSum: 0, maxPossible: dim.questions.length * 4 * submittedData.length };
    });

    submittedData.forEach(entry => {
      let entryTotal = 0;
      
      SURVEY_DIMENSIONS.forEach(dim => {
        let dimEntrySum = 0;
        dim.questions.forEach(q => {
          const val = entry.answers[q.id] || 0;
          dimEntrySum += val;
          entryTotal += val;
        });
        dimScores[dim.id].totalSum += dimEntrySum;
      });
      
      totalScore += (entryTotal / ALL_QUESTIONS.length);
    });

    const breakdownDim = {};
    SURVEY_DIMENSIONS.forEach(dim => {
      // Calculate average (1-4) for this dimension
      const dimAverage = (dimScores[dim.id].totalSum / (dim.questions.length * submittedData.length)).toFixed(2);
      breakdownDim[dim.id] = dimAverage;
    });

    return {
      total: submittedData.length,
      overall: (totalScore / submittedData.length).toFixed(2),
      breakdownDim
    };
  };

  const renderDashboardContent = (stats) => {
    const getPercent = (val) => (val / 4) * 100;

    return (
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Ringkasan Eksekutif</h2>
          <p className="text-slate-500 mt-1">Performa layanan berdasarkan umpan balik pengguna.</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-5">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={32} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Responden</p>
              <h4 className="text-4xl font-extrabold text-slate-900">{stats.total}</h4>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-5">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Star size={32} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Skor Rata-rata</p>
              <h4 className="text-4xl font-extrabold text-slate-900">
                {stats.overall} <span className="text-lg text-slate-400 font-medium">/ 4.0</span>
              </h4>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-5">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <BarChart3 size={32} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Indeks Kepuasan</p>
              <h4 className="text-4xl font-extrabold text-slate-900">
                {stats.total > 0 ? ((stats.overall / 4) * 100).toFixed(0) : 0}%
              </h4>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown per Dimension */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center">
            <ClipboardList className="mr-3 text-indigo-600" size={24} />
            Indeks Kepuasan per Dimensi
          </h3>
          
          {stats.total === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <BarChart3 size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Belum ada data survei yang masuk.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {SURVEY_DIMENSIONS.map((dim) => {
                const dimScore = stats.breakdownDim[dim.id];
                const dimPercent = getPercent(dimScore);
                
                return (
                  <div key={dim.id} className="relative">
                    <div className="flex justify-between items-end mb-2">
                      <div className="pr-4">
                        <span className="text-xs font-bold text-indigo-500 tracking-wider uppercase block mb-1">
                          {dim.questions.length} Pertanyaan
                        </span>
                        <span className="font-semibold text-slate-800 text-lg">{dim.title}</span>
                      </div>
                      <div className="text-right flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-slate-900">{dimScore}</span>
                        <span className="text-sm text-slate-500 font-medium">/ 4.0</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-4 rounded-full transition-all duration-1000 ease-out relative
                          ${dimPercent >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 
                            dimPercent >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                            'bg-gradient-to-r from-red-400 to-red-500'}`}
                        style={{ width: `${dimPercent}%` }}
                      >
                         <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 translate-x-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResponsesContent = () => (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Data Responden</h2>
        <p className="text-slate-500 mt-1">Daftar lengkap hasil survei yang telah dikirimkan.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 min-w-[1200px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 font-semibold sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  ID Responden / Waktu
                </th>
                {SURVEY_DIMENSIONS.map((dim, dIdx) => (
                  <th key={dim.id} colSpan={dim.questions.length} className={`px-6 py-5 font-semibold text-center border-b-2 ${dIdx % 2 === 0 ? 'border-indigo-400 bg-indigo-50/50' : 'border-blue-400 bg-blue-50/50'}`}>
                    {dim.title.split(' ')[1]} ({dim.questions.length} Soal)
                  </th>
                ))}
                <th className="px-6 py-5 font-semibold text-center sticky right-0 bg-slate-50 z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">Skor Akhir</th>
              </tr>
              <tr>
                 <th className="px-6 py-2 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"></th>
                 {ALL_QUESTIONS.map((q, i) => (
                    <th key={q.id} className="px-2 py-2 font-medium text-center text-xs border-r border-slate-100 last:border-0" title={q.text}>
                      Q{i + 1}
                    </th>
                 ))}
                 <th className="px-6 py-2 sticky right-0 bg-slate-50 z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submittedData.length === 0 ? (
                <tr>
                  <td colSpan={ALL_QUESTIONS.length + 2} className="px-6 py-12 text-center text-slate-500">
                    Belum ada responden yang mengisi survei.
                  </td>
                </tr>
              ) : (
                submittedData.slice().reverse().map((entry) => {
                  let total = 0;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors">
                        <div className="font-bold text-slate-900">#RES-{entry.id.toString().slice(-5)}</div>
                        <div className="text-xs text-slate-400 mt-1">{entry.date}</div>
                      </td>
                      {ALL_QUESTIONS.map((q, i) => {
                        const val = entry.answers[q.id];
                        total += (val || 0);
                        return (
                          <td key={q.id} className="px-2 py-4 text-center border-r border-slate-50 last:border-0">
                            {val ? (
                               <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs
                                ${val === 4 ? 'bg-emerald-100 text-emerald-700' : 
                                  val === 3 ? 'bg-blue-100 text-blue-700' : 
                                  val === 2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {val}
                              </span>
                            ) : (
                               <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors">
                        <span className="font-extrabold text-slate-800 text-base bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                          {(total / ALL_QUESTIONS.length).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAdminLayout = () => {
    const stats = calculateAverages();

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Overlay */}
        {isSidebarOpen && window.innerWidth < 768 && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-20"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside 
          className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out flex flex-col
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:w-64 lg:w-72 border-r border-slate-800`}
        >
          <div className="h-20 flex items-center px-6 bg-slate-950/50 border-b border-slate-800 justify-between md:justify-start">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <ShieldCheck size={20} />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">AdminPanel</span>
            </div>
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 mt-2">Menu Utama</p>
            <nav className="space-y-1">
              <button
                onClick={() => { setAdminMenu('dashboard'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium
                  ${adminMenu === 'dashboard' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => { setAdminMenu('responses'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium
                  ${adminMenu === 'responses' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <ClipboardList size={20} />
                <span>Data Responden</span>
              </button>
            </nav>
          </div>

          <div className="p-4 bg-slate-950/50 border-t border-slate-800">
            <div className="flex items-center px-4 py-3 mb-4 rounded-xl bg-slate-800/50">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 mr-3">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Administrator</p>
                <p className="text-xs text-slate-400">System Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-300 px-4 py-3 rounded-xl font-medium transition-colors group"
            >
              <LogOut size={18} className="group-hover:animate-pulse" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* Main Admin Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
          {/* Admin Header */}
          <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 shrink-0">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mr-4 p-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
                {adminMenu === 'dashboard' ? 'Dashboard Statistik' : 'Kelola Data Responden'}
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setView('survey')}
                className="flex items-center space-x-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-lg transition-colors border border-indigo-100"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Pratinjau Survei</span>
                <span className="sm:hidden">Survei</span>
              </button>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {adminMenu === 'dashboard' ? renderDashboardContent(stats) : renderResponsesContent()}
            </div>
          </div>
        </main>
      </div>
    );
  };

  // Conditional rendering based on view state
  if (view === 'admin') {
    if (!isAuthenticated) {
      setView('login');
      return null;
    }
    return renderAdminLayout();
  }

  // Public Layout (Header + Content + Footer)
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-bounce-slight {
          animation: bounceSlight 2s infinite ease-in-out;
        }
        @keyframes bounceSlight {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(0); }
        }
      `}</style>
      
      {/* Public Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => setView('welcome')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all">
              <ShieldCheck size={18} />
            </div>
            <span className="font-extrabold text-xl text-slate-800 tracking-tight">SurveyFlow</span>
          </div>
          
          {view !== 'login' && view !== 'admin' && (
            <button
              onClick={() => {
                if (isAuthenticated) setView('admin');
                else setView('login');
              }}
              className="flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-indigo-50 px-4 py-2 rounded-xl"
            >
              <Lock size={16} />
              <span className="hidden sm:inline">Masuk Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-5xl mx-auto py-8 lg:py-12">
        {view === 'welcome' && renderWelcome()}
        {view === 'login' && renderLogin()}
        {view === 'survey' && renderSurvey()}
        {view === 'success' && renderSuccess()}
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-sm font-medium">
        <p>&copy; {new Date().getFullYear()} SurveyFlow. Desain Elegan & Responsif.</p>
      </footer>
    </div>
  );
}