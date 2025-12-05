import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage } from '@react-pdf/renderer';
import { 
  School, Users, BookOpen, GraduationCap, FileText, 
  ArrowRight, Plus, Trash2, UserPlus, Upload, 
  LayoutDashboard, LogOut, Search, MapPin, AlertCircle, Layers, Lock, User
} from 'lucide-react';

// ==========================================
// 0. SUPABASE CONFIGURATION
// ==========================================
const supabaseUrl = 'https://lckdmbegwmvtxjuddxcc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxja2RtYmVnd212dHhqdWRkeGNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTI3MjcsImV4cCI6MjA4MDUyODcyN30.MzrMr8q3UuozyrEjoRGyfDlkgIvWv9IKKdjDx6aJMsw';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. PDF STYLES & COMPONENT (Unchanged)
// ==========================================
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica', color: '#333' },
  header: { flexDirection: 'row', marginBottom: 20, borderBottom: '2px solid #1e40af', paddingBottom: 10 },
  logo: { width: 60, height: 60, marginRight: 15, borderRadius: 4 },
  schoolInfo: { justifyContent: 'center' },
  schoolName: { fontSize: 18, color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase' },
  schoolMeta: { fontSize: 9, color: '#555', marginTop: 2 },
  gridBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 4, marginBottom: 15, flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33%', marginBottom: 5 },
  label: { fontSize: 8, color: '#64748b', fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  table: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 20 },
  row: { flexDirection: 'row', borderBottom: '1px solid #e2e8f0' },
  headerRow: { backgroundColor: '#eff6ff', borderBottom: '1px solid #1e40af' },
  cell: { padding: 6, fontSize: 9, textAlign: 'center' },
  cellLeft: { textAlign: 'left', paddingLeft: 10 },
  wSub: { width: '35%' },
  wSmall: { width: '10%' },
  wRem: { flex: 1 },
  commentSection: { marginBottom: 20 },
  commentBox: { borderLeft: '2px solid #1e40af', paddingLeft: 8, marginBottom: 10, backgroundColor: '#f8fafc', padding: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  signBox: { width: '40%', borderTop: '1px solid #94a3b8', paddingTop: 8, alignItems: 'center' }
});

const ResultPDF = ({ school, student, results, termInfo }) => {
  const totalScore = results.reduce((acc, curr) => acc + (parseFloat(curr.ca_score + curr.exam_score) || 0), 0);
  const average = (totalScore / (results.length || 1)).toFixed(1);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {school.logo_url && <PDFImage src={school.logo_url} style={pdfStyles.logo} />}
          <View style={pdfStyles.schoolInfo}>
            <Text style={pdfStyles.schoolName}>{school.name}</Text>
            <Text style={pdfStyles.schoolMeta}>{school.address}</Text>
            <Text style={pdfStyles.schoolMeta}>{school.contact}</Text>
            <Text style={[pdfStyles.schoolMeta, {color: '#1e40af', fontWeight: 'bold', marginTop: 4}]}>
              {termInfo.term} • {termInfo.session}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.gridBox}>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Name</Text><Text style={pdfStyles.value}>{student.name}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Adm No</Text><Text style={pdfStyles.value}>{student.admission_no}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Class</Text><Text style={pdfStyles.value}>{student.class_name}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Gender</Text><Text style={pdfStyles.value}>{student.gender}</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Average</Text><Text style={pdfStyles.value}>{average}%</Text></View>
          <View style={pdfStyles.gridItem}><Text style={pdfStyles.label}>Total</Text><Text style={pdfStyles.value}>{totalScore}</Text></View>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, pdfStyles.headerRow]}>
            <Text style={[pdfStyles.cell, pdfStyles.cellLeft, pdfStyles.wSub, {fontWeight: 'bold', color: '#1e40af'}]}>SUBJECT</Text>
            <Text style={[pdfStyles.cell, pdfStyles.wSmall, {fontWeight: 'bold'}]}>CA</Text>
            <Text style={[pdfStyles.cell, pdfStyles.wSmall, {fontWeight: 'bold'}]}>EXAM</Text>
            <Text style={[pdfStyles.cell, pdfStyles.wSmall, {fontWeight: 'bold'}]}>TOTAL</Text>
            <Text style={[pdfStyles.cell, pdfStyles.cellLeft, pdfStyles.wRem, {fontWeight: 'bold'}]}>REMARK</Text>
          </View>
          {results.map((s, i) => {
             const total = (parseFloat(s.ca_score)||0) + (parseFloat(s.exam_score)||0);
             const remark = total >= 70 ? 'Excellent' : total >= 60 ? 'V.Good' : total >= 50 ? 'Good' : 'Pass';
             return (
              <View key={i} style={[pdfStyles.row, {backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc'}]}>
                <Text style={[pdfStyles.cell, pdfStyles.cellLeft, pdfStyles.wSub]}>{s.subject}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.wSmall]}>{s.ca_score}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.wSmall]}>{s.exam_score}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.wSmall, {fontWeight: 'bold'}]}>{total}</Text>
                <Text style={[pdfStyles.cell, pdfStyles.cellLeft, pdfStyles.wRem, {fontSize: 8, color: '#555'}]}>{remark}</Text>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

// ==========================================
// 2. AUTH & PARENT COMPONENTS
// ==========================================

const AuthScreen = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        // 1. Sign up auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        // 2. Create School
        const { data: schoolData, error: schoolError } = await supabase.from('schools').insert([{ name: schoolName }]).select().single();
        if (schoolError) throw schoolError;

        // 3. Create Profile (Admin)
        const { error: profileError } = await supabase.from('profiles').insert([{
          id: authData.user.id,
          school_id: schoolData.id,
          full_name: fullName,
          role: 'admin'
        }]);
        if (profileError) throw profileError;

        alert('Registration successful! Please log in.');
        setIsSignup(false);
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-xl text-white"><LayoutDashboard size={32}/></div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">{isSignup ? 'Register School' : 'Staff Login'}</h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignup && (
            <>
              <input required placeholder="School Name" className="w-full p-3 border rounded-xl" value={schoolName} onChange={e=>setSchoolName(e.target.value)}/>
              <input required placeholder="Your Full Name" className="w-full p-3 border rounded-xl" value={fullName} onChange={e=>setFullName(e.target.value)}/>
            </>
          )}
          <input required type="email" placeholder="Email Address" className="w-full p-3 border rounded-xl" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input required type="password" placeholder="Password" className="w-full p-3 border rounded-xl" value={password} onChange={e=>setPassword(e.target.value)}/>
          
          <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
            {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Login')}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-indigo-600 cursor-pointer" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'Already have an account? Login' : 'New School? Register here'}
        </div>
        <div className="mt-8 border-t pt-4 text-center">
            <button onClick={()=>onLogin('parent')} className="text-slate-500 text-sm hover:text-slate-800 flex items-center justify-center gap-2 w-full">
               <User size={16}/> Parent? Check Result here
            </button>
        </div>
      </div>
    </div>
  );
};

const ParentPortal = ({ onBack }) => {
  const [admNo, setAdmNo] = useState('');
  const [pin, setPin] = useState('');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkResult = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Fetch Student & School
    const { data: student, error } = await supabase
      .from('students').select(`*, schools(*)`).eq('admission_no', admNo).single(); // Add .eq('parent_pin', pin) for security

    if (student) {
        // Fetch Results
        const { data: results } = await supabase.from('results').select('*').eq('student_id', student.id);
        setResultData({ student, school: student.schools, results });
    } else {
        alert('Student not found. Check Admission Number.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
       <div className="w-full max-w-4xl">
          <button onClick={onBack} className="mb-4 text-slate-500 flex items-center gap-2"><ArrowRight className="rotate-180" size={16}/> Back to Login</button>
          
          {!resultData ? (
             <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md mx-auto mt-10">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Parent Portal</h2>
                <p className="text-center text-slate-500 mb-6">Enter details to view term results</p>
                <form onSubmit={checkResult} className="space-y-4">
                   <input required placeholder="Admission Number" className="w-full p-3 border rounded-xl" value={admNo} onChange={e=>setAdmNo(e.target.value)}/>
                   <input required type="password" placeholder="Access PIN (Optional)" className="w-full p-3 border rounded-xl" value={pin} onChange={e=>setPin(e.target.value)}/>
                   <button disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700">
                      {loading ? 'Searching...' : 'Check Result'}
                   </button>
                </form>
             </div>
          ) : (
             <div className="bg-slate-800 h-[80vh] rounded-3xl overflow-hidden shadow-2xl">
                 <PDFViewer width="100%" height="100%">
                    <ResultPDF school={resultData.school} student={resultData.student} results={resultData.results} termInfo={{term:'Current', session:'2025'}} />
                 </PDFViewer>
             </div>
          )}
       </div>
    </div>
  );
};

// ==========================================
// 3. MAIN DASHBOARD (Admin/Teacher)
// ==========================================

const Dashboard = ({ session }) => {
  const [profile, setProfile] = useState(null);
  const [step, setStep] = useState(1);
  const [schoolData, setSchoolData] = useState({ name: '', address: '' });
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState([]); // Temporary holder for scores being edited

  // Fetch Initial Data
  useEffect(() => {
    const init = async () => {
      // 1. Get Profile
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(prof);

      if (prof?.school_id) {
        // 2. Get School
        const { data: sch } = await supabase.from('schools').select('*').eq('id', prof.school_id).single();
        setSchoolData(sch);

        // 3. Get Classes
        const { data: cls } = await supabase.from('classes').select('*').eq('school_id', prof.school_id);
        setClasses(cls || []);

        // 4. Get Students
        const { data: stu } = await supabase.from('students').select('*').eq('school_id', prof.school_id);
        setStudents(stu || []);
      }
    };
    init();
  }, [session]);

  const handleLogout = async () => await supabase.auth.signOut();

  // Database Actions
  const saveSchool = async () => {
    await supabase.from('schools').update({ name: schoolData.name, address: schoolData.address }).eq('id', profile.school_id);
    alert('Saved!');
  };

  const addClass = async (name) => {
    const { data } = await supabase.from('classes').insert([{ school_id: profile.school_id, name }]).select();
    setClasses([...classes, ...data]);
  };

  const addStudent = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { data } = await supabase.from('students').insert([{
        school_id: profile.school_id,
        name: fd.get('name'),
        admission_no: fd.get('adm'),
        class_name: fd.get('class'),
        gender: fd.get('gender')
    }]).select();
    setStudents([...students, ...data]);
    e.target.reset();
  };

  const loadStudentResults = async (studentId) => {
     // 1. Find Student
     const stu = students.find(s => s.id === studentId);
     setSelectedStudent(stu);

     // 2. Fetch existing results or init new ones (Mocking subjects for simplicity here)
     // In real app, fetch subjects from 'class_subjects' table first
     const subjects = ['Mathematics', 'English', 'Science', 'History']; 
     
     // Check DB for existing results
     const { data: existing } = await supabase.from('results').select('*').eq('student_id', studentId);
     
     const merged = subjects.map(sub => {
         const found = existing?.find(r => r.subject === sub);
         return found || { subject: sub, ca_score: 0, exam_score: 0 };
     });
     setScores(merged);
  };

  const saveResults = async () => {
     // Upsert results
     const payload = scores.map(s => ({
         student_id: selectedStudent.id,
         subject: s.subject,
         ca_score: s.ca_score,
         exam_score: s.exam_score,
         term: 'Term 1',
         session: '2025'
     }));
     
     // Note: In production, you need an ID to upsert correctly, or delete/insert. 
     // For this demo, we just insert simply.
     await supabase.from('results').delete().eq('student_id', selectedStudent.id);
     await supabase.from('results').insert(payload);
     alert('Results Saved to Database!');
  };

  if (!profile) return <div className="h-screen flex items-center justify-center">Loading Profile...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col">
        <div className="font-bold text-xl text-indigo-900 mb-8 flex items-center gap-2"><LayoutDashboard/> SchoolOS</div>
        
        <nav className="space-y-2 flex-1">
          {['admin', 'principal'].includes(profile.role) && (
            <>
               <button onClick={()=>setStep(1)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${step===1?'bg-indigo-50 text-indigo-700 font-bold':'text-slate-600 hover:bg-slate-50'}`}><School size={18}/> Profile</button>
               <button onClick={()=>setStep(2)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${step===2?'bg-indigo-50 text-indigo-700 font-bold':'text-slate-600 hover:bg-slate-50'}`}><BookOpen size={18}/> Classes</button>
               <button onClick={()=>setStep(3)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${step===3?'bg-indigo-50 text-indigo-700 font-bold':'text-slate-600 hover:bg-slate-50'}`}><UserPlus size={18}/> Students</button>
            </>
          )}
          <button onClick={()=>setStep(4)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 ${step===4?'bg-indigo-50 text-indigo-700 font-bold':'text-slate-600 hover:bg-slate-50'}`}><FileText size={18}/> Results</button>
        </nav>

        <div className="border-t pt-4">
           <div className="text-xs font-bold text-slate-400 uppercase mb-1">{profile.role}</div>
           <div className="text-sm font-bold mb-4">{profile.full_name}</div>
           <button onClick={handleLogout} className="text-red-500 flex items-center gap-2 text-sm font-bold"><LogOut size={16}/> Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
         {/* Step 1: School Profile (Admin Only) */}
         {step === 1 && (
            <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm">
               <h2 className="text-2xl font-bold mb-6">School Settings</h2>
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">School Name</label>
                     <input className="w-full p-3 border rounded-xl" value={schoolData.name} onChange={e=>setSchoolData({...schoolData, name:e.target.value})}/>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">Address</label>
                     <input className="w-full p-3 border rounded-xl" value={schoolData.address} onChange={e=>setSchoolData({...schoolData, address:e.target.value})}/>
                  </div>
                  <button onClick={saveSchool} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Save Changes</button>
               </div>
            </div>
         )}

         {/* Step 2: Classes */}
         {step === 2 && (
            <div className="max-w-4xl">
               <h2 className="text-2xl font-bold mb-6">Manage Classes</h2>
               <div className="flex gap-2 mb-6">
                  <input id="newCls" className="p-3 border rounded-xl flex-1" placeholder="New Class Name (e.g. Year 7)"/>
                  <button onClick={()=>{
                     const val = document.getElementById('newCls').value;
                     if(val) { addClass(val); document.getElementById('newCls').value=''; }
                  }} className="bg-indigo-600 text-white px-6 rounded-xl font-bold">Add Class</button>
               </div>
               <div className="grid grid-cols-3 gap-4">
                  {classes.map(c => (
                     <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border font-bold text-slate-700">{c.name}</div>
                  ))}
               </div>
            </div>
         )}

         {/* Step 3: Students */}
         {step === 3 && (
            <div className="max-w-5xl">
               <h2 className="text-2xl font-bold mb-6">Enrollment</h2>
               <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
                  <form onSubmit={addStudent} className="grid grid-cols-4 gap-4">
                     <input name="name" placeholder="Student Name" className="col-span-2 p-3 border rounded-xl" required/>
                     <input name="adm" placeholder="Adm No" className="p-3 border rounded-xl" required/>
                     <select name="gender" className="p-3 border rounded-xl"><option value="M">Male</option><option value="F">Female</option></select>
                     <select name="class" className="col-span-4 p-3 border rounded-xl" required>
                        <option value="">Select Class...</option>
                        {classes.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                     </select>
                     <button className="col-span-4 bg-emerald-600 text-white py-3 rounded-xl font-bold">Register Student</button>
                  </form>
               </div>
               <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b">
                        <tr><th className="p-4">Name</th><th className="p-4">Adm No</th><th className="p-4">Class</th></tr>
                     </thead>
                     <tbody>
                        {students.map(s => (
                           <tr key={s.id} className="border-b hover:bg-slate-50">
                              <td className="p-4">{s.name}</td><td className="p-4">{s.admission_no}</td><td className="p-4">{s.class_name}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* Step 4: Results */}
         {step === 4 && (
            <div className="flex gap-6 h-[calc(100vh-100px)]">
               <div className="w-1/3 bg-white p-6 rounded-2xl shadow-sm overflow-y-auto">
                  <h3 className="font-bold mb-4">Select Student</h3>
                  <div className="space-y-2">
                     {students.map(s => (
                        <button key={s.id} onClick={()=>loadStudentResults(s.id)} 
                           className={`w-full text-left p-3 rounded-lg border ${selectedStudent?.id===s.id?'border-indigo-500 bg-indigo-50':'border-slate-100'}`}>
                           <div className="font-bold">{s.name}</div>
                           <div className="text-xs text-slate-500">{s.class_name}</div>
                        </button>
                     ))}
                  </div>
               </div>

               {selectedStudent && (
                  <div className="w-2/3 flex flex-col gap-4">
                     <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="font-bold mb-4">Enter Scores: {selectedStudent.name}</h3>
                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                           {scores.map((score, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                 <span className="w-32 font-bold text-sm">{score.subject}</span>
                                 <input type="number" placeholder="CA" className="w-20 p-2 border rounded" 
                                    value={score.ca_score} 
                                    onChange={(e)=>{
                                       const newScores = [...scores];
                                       newScores[idx].ca_score = e.target.value;
                                       setScores(newScores);
                                    }}/>
                                 <input type="number" placeholder="Exam" className="w-20 p-2 border rounded" 
                                    value={score.exam_score} 
                                    onChange={(e)=>{
                                       const newScores = [...scores];
                                       newScores[idx].exam_score = e.target.value;
                                       setScores(newScores);
                                    }}/>
                              </div>
                           ))}
                        </div>
                        <button onClick={saveResults} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold w-full">Save to Database</button>
                     </div>
                     <div className="flex-1 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                         <PDFViewer width="100%" height="100%">
                            <ResultPDF school={schoolData} student={selectedStudent} results={scores} termInfo={{term:'Term 1', session:'2025'}} />
                         </PDFViewer>
                     </div>
                  </div>
               )}
            </div>
         )}
      </main>
    </div>
  );
};

// ==========================================
// 4. APP ROOT
// ==========================================
const App = () => {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('auth'); // auth, parent, dashboard

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setView('dashboard');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setView('dashboard');
      else if (view !== 'parent') setView('auth');
    });

    return () => subscription.unsubscribe();
  }, []);

  if (view === 'parent') return <ParentPortal onBack={()=>setView('auth')} />;
  if (!session) return <AuthScreen onLogin={(v) => setView(v)} />;
  return <Dashboard session={session} />;
};

export default App;
