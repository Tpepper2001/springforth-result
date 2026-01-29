import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image as PDFImage } from '@react-pdf/renderer';
import { Loader2, Plus, School, LogOut, Users, BookOpen, Save } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  header: { marginBottom: 20, borderBottomWidth: 1, paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  table: { width: '100%', marginTop: 20, borderTopWidth: 1 },
  row: { flexDirection: 'row', borderBottomWidth: 1, padding: 5 },
  cell: { flex: 1, textAlign: 'center' }
});

const ResultPDF = ({ school, student, results, config }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>{school?.name}</Text>
        <Text style={{textAlign: 'center'}}>{school?.address}</Text>
      </View>
      <Text>Student: {student?.name} | Class: {student?.classes?.name}</Text>
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.row, {backgroundColor: '#eee'}]}>
          <Text style={{width: 100}}>Subject</Text>
          {config?.map(c => <Text key={c.code} style={pdfStyles.cell}>{c.name}</Text>)}
          <Text style={pdfStyles.cell}>Total</Text>
        </View>
        {results?.map(r => (
          <View key={r.id} style={pdfStyles.row}>
            <Text style={{width: 100}}>{r.subjects?.name}</Text>
            {config?.map(c => <Text key={c.code} style={pdfStyles.cell}>{r.scores[c.code] || 0}</Text>)}
            <Text style={pdfStyles.cell}>{r.total}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

const TeacherDashboard = ({ profile, onLogout }) => {
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [school, setSchool] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchSchoolData = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    setSchool(s);
    const { data: cls } = await supabase.from('classes').select('*').eq('school_id', s.id);
    setClassList(cls || []);
  }, [profile.school_id]);

  useEffect(() => { fetchSchoolData(); }, [fetchSchoolData]);

  const loadClassData = async (id) => {
    setSelectedClassId(id);
    setSelectedStudent(null);
    const { data: stu } = await supabase.from('students').select('*').eq('class_id', id);
    setStudents(stu || []);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', id);
    setSubjects(sub || []);
  };

  const loadStudentResults = async (stu) => {
    setSelectedStudent(stu);
    const { data: res } = await supabase.from('results').select('*').eq('student_id', stu.id);
    const sm = {};
    res?.forEach(r => sm[r.subject_id] = r.scores);
    setScores(sm);
  };

  const saveResults = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    const payload = subjects.map(s => ({
      student_id: selectedStudent.id,
      subject_id: s.id,
      scores: scores[s.id] || {},
      total: Object.values(scores[s.id] || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0)
    }));
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(payload);
    setSaving(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Teacher Portal</h2>
        
        <label className="text-[10px] uppercase text-slate-400">Manage Classes</label>
        <select className="bg-slate-800 p-2 rounded mt-1 mb-4 w-full" value={selectedClassId} onChange={(e) => loadClassData(e.target.value)}>
          <option value="">Select Class</option>
          {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <button onClick={async() => {
          const n = prompt("New Class Name:");
          if(n) { await supabase.from('classes').insert({name: n, school_id: school.id}); fetchSchoolData(); }
        }} className="text-xs bg-slate-800 p-2 rounded hover:bg-slate-700">+ New Class</button>

        <div className="mt-8 flex-1 overflow-auto">
          <label className="text-[10px] uppercase text-slate-400">Students ({students.length})</label>
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudentResults(s)} className={`p-2 cursor-pointer rounded mt-1 text-sm ${selectedStudent?.id === s.id ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
              {s.name}
            </div>
          ))}
          {selectedClassId && (
             <button onClick={async() => {
               const n = prompt("Student Name:");
               if(n) { await supabase.from('students').insert({name: n, school_id: school.id, class_id: selectedClassId, admission_no: `ADM-${Date.now()}`}); loadClassData(selectedClassId); }
             }} className="w-full text-xs mt-4 text-blue-400 font-bold">+ Add Student</button>
          )}
        </div>

        <button onClick={onLogout} className="mt-auto flex items-center gap-2 text-red-400"><LogOut size={16}/> Logout</button>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {!selectedStudent ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Users size={48} />
            <p className="mt-2">Select a class and student to begin</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">{selectedStudent.name}</h1>
              <button onClick={saveResults} disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" /> : <Save size={18}/>} Save Scores
              </button>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-3 border">Subject</th>
                  {school?.assessment_config?.map(c => <th key={c.code} className="p-3 border text-center">{c.name} ({c.max})</th>)}
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td className="p-3 border font-medium">{s.name}</td>
                    {school?.assessment_config?.map(c => (
                      <td key={c.code} className="p-3 border">
                        <input type="number" className="w-full text-center p-1 border rounded" value={scores[s.id]?.[c.code] || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setScores(prev => ({...prev, [s.id]: {...(prev[s.id] || {}), [c.code]: val}}));
                          }} 
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={async() => {
              const n = prompt("New Subject:");
              if(n) { await supabase.from('subjects').insert({name: n, class_id: selectedClassId}); loadClassData(selectedClassId); }
            }} className="mt-4 text-blue-600 font-bold">+ Add Subject to this Class</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ... Auth Component (Keep updated registration logic from before)
const Auth = ({ onParent }) => {
    const [mode, setMode] = useState('login'); 
    const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.from('schools').select('id, name').then(({data}) => setSchools(data || []));
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            if (mode === 'school_reg') {
                const { data: auth, error: ae } = await supabase.auth.signUp({ email: form.email, password: form.password });
                if (ae) throw ae;
                const { data: s, error: se } = await supabase.from('schools').insert({ owner_id: auth.user.id, name: form.name }).select().single();
                if (se) throw se;
                await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'admin', school_id: s.id });
                alert("School Created! Log in now."); setMode('login');
            } else if (mode === 'teacher_reg') {
                 if (!form.schoolId) throw new Error("Select a school");
                 const { data: auth, error: ae } = await supabase.auth.signUp({ email: form.email, password: form.password });
                 if (ae) throw ae;
                 await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'teacher', school_id: form.schoolId });
                 alert("Account Created! Log in now."); setMode('login');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
                if (error) throw error;
            }
        } catch (err) { alert(err.message); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="bg-white p-8 rounded shadow w-full max-w-md border-t-4 border-blue-600">
                <h1 className="text-2xl font-bold text-center mb-6">Springforth Results</h1>
                <div className="flex gap-4 mb-6 text-xs font-bold border-b pb-2">
                    {['login', 'school_reg', 'teacher_reg'].map(m => (
                        <button key={m} onClick={()=>setMode(m)} className={mode===m?'text-blue-600 border-b border-blue-600':''}>{m.replace('_',' ')}</button>
                    ))}
                </div>
                <form onSubmit={handleAuth} className="space-y-4">
                    {mode !== 'login' && <input placeholder="Full Name" className="w-full p-2 border rounded" onChange={e=>setForm({...form, name:e.target.value})} required />}
                    <input type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={e=>setForm({...form, email:e.target.value})} required />
                    <input type="password" placeholder="Password" className="w-full p-2 border rounded" onChange={e=>setForm({...form, password:e.target.value})} required />
                    {mode === 'teacher_reg' && (
                        <select className="w-full p-2 border rounded" onChange={e=>setForm({...form, schoolId:e.target.value})} required>
                            <option value="">Select School</option>
                            {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                    <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded font-bold">{loading?'...':'Enter Portal'}</button>
                </form>
                {mode==='login' && <button onClick={onParent} className="w-full mt-4 bg-green-600 text-white py-2 rounded font-bold">Parent Access</button>}
            </div>
        </div>
    );
};

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); if(!s) setLoading(false); });
    supabase.auth.onAuthStateChange((_event, s) => { setSession(s); if(!s) { setProfile(null); setView('auth'); } });
  }, []);

  useEffect(() => {
    if (session) {
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({data}) => {
        setProfile(data); setLoading(false);
      });
    }
  }, [session]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (view === 'parent') return <div className="p-10">Parent portal goes here (see previous code for details)</div>;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  if (!profile) return <div className="p-20 text-center"><button onClick={()=>supabase.auth.signOut()} className="bg-red-500 text-white p-2">No Profile Found. Sign Out & Retry</button></div>;

  // In this version, both Admins and Teachers use the same "TeacherDashboard" 
  // because you want them to be able to manage students and classes freely.
  return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;