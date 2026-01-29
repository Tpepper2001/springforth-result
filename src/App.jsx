import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Loader2, Plus, School, LogOut, Users, Settings, Save, Eye, Trash2, FileText } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== PDF STYLES ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20, borderBottom: 2, paddingBottom: 10 },
  schoolName: { fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase' },
  table: { width: '100%', marginTop: 20, borderTop: 1 },
  row: { flexDirection: 'row', borderBottom: 1, padding: 5, alignItems: 'center' },
  cell: { flex: 1, textAlign: 'center' },
  bold: { fontWeight: 'bold' }
});

const ResultPDF = ({ school, student, results }) => {
  const config = school?.assessment_config || [];
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.schoolName}>{school?.name}</Text>
          <Text>{school?.address}</Text>
          <Text>{school?.current_term} - {school?.current_session} Session</Text>
        </View>
        <Text style={pdfStyles.bold}>Student: {student?.name}</Text>
        <Text>Admission No: {student?.admission_no}</Text>
        
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, { backgroundColor: '#f0f0f0' }]}>
            <Text style={{ width: 120 }}>Subject</Text>
            {config.map(c => <Text key={c.code} style={pdfStyles.cell}>{c.name}</Text>)}
            <Text style={pdfStyles.cell}>Total</Text>
          </View>
          {results.map(r => (
            <View key={r.id} style={pdfStyles.row}>
              <Text style={{ width: 120 }}>{r.subjects?.name}</Text>
              {config.map(c => <Text key={c.code} style={pdfStyles.cell}>{r.scores[c.code] || 0}</Text>)}
              <Text style={[pdfStyles.cell, pdfStyles.bold]}>{r.total}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// ==================== MAIN COMPONENT ====================
const Dashboard = ({ profile, onLogout }) => {
  const [activeTab, setActiveTab] = useState('entry');
  const [school, setSchool] = useState(null);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [studentResults, setStudentResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const fetchBaseData = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    setSchool(s);
    const { data: cls } = await supabase.from('classes').select('*').eq('school_id', profile.school_id).order('name');
    setClassList(cls || []);
  }, [profile.school_id]);

  useEffect(() => { fetchBaseData(); }, [fetchBaseData]);

  const loadClass = async (id) => {
    setSelectedClassId(id);
    setSelectedStudent(null);
    const { data: stu } = await supabase.from('students').select('*').eq('class_id', id).order('name');
    setStudents(stu || []);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', id).order('name');
    setSubjects(sub || []);
  };

  const loadStudent = async (stu) => {
    setSelectedStudent(stu);
    const { data: res } = await supabase.from('results').select('*, subjects(name)').eq('student_id', stu.id);
    const sm = {};
    res?.forEach(r => sm[r.subject_id] = r.scores);
    setScores(sm);
    setStudentResults(res || []);
  };

  const handleSave = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    const updates = subjects.map(s => {
      const currentScores = scores[s.id] || {};
      const total = Object.values(currentScores).reduce((a, b) => a + (parseFloat(b) || 0), 0);
      return { student_id: selectedStudent.id, subject_id: s.id, scores: currentScores, total };
    });
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(updates);
    setSaving(false);
    loadStudent(selectedStudent);
    alert("Results Saved!");
  };

  if (previewing) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
        <div className="p-4 bg-white flex justify-between items-center">
          <button onClick={() => setPreviewing(false)} className="font-bold text-blue-600">← Back</button>
          <PDFDownloadLink 
            document={<ResultPDF school={school} student={selectedStudent} results={studentResults} />} 
            fileName={`${selectedStudent.name}_Result.pdf`}
            className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
          >
            Download PDF
          </PDFDownloadLink>
        </div>
        <PDFViewer className="flex-1 w-full"><ResultPDF school={school} student={selectedStudent} results={studentResults} /></PDFViewer>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-slate-900 text-white flex flex-col p-4">
        <div className="flex items-center gap-2 font-bold text-xl mb-8"><School /> Portal</div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('entry')} className={`w-full text-left p-3 rounded flex items-center gap-2 ${activeTab === 'entry' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><FileText size={18}/> Results Entry</button>
          {profile.role === 'admin' && (
            <button onClick={() => setActiveTab('settings')} className={`w-full text-left p-3 rounded flex items-center gap-2 ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><Settings size={18}/> School Info</button>
          )}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-2 text-red-400 p-3 hover:bg-slate-800 rounded"><LogOut size={18}/> Logout</button>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white p-8 rounded shadow">
            <h2 className="text-xl font-bold mb-6">School Profile</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await supabase.from('schools').update({
                name: fd.get('name'), address: fd.get('address'),
                current_term: fd.get('term'), current_session: fd.get('session')
              }).eq('id', school.id);
              fetchBaseData();
              alert("School Updated!");
            }} className="space-y-4">
              <input name="name" defaultValue={school?.name} placeholder="School Name" className="w-full border p-2 rounded" />
              <input name="address" defaultValue={school?.address} placeholder="Address" className="w-full border p-2 rounded" />
              <div className="grid grid-cols-2 gap-4">
                <input name="term" defaultValue={school?.current_term} placeholder="Term" className="border p-2 rounded" />
                <input name="session" defaultValue={school?.current_session} placeholder="Session" className="border p-2 rounded" />
              </div>
              <button className="bg-blue-600 text-white px-6 py-2 rounded font-bold">Save Changes</button>
            </form>
          </div>
        )}

        {activeTab === 'entry' && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-3 space-y-4">
              <div className="bg-white p-4 rounded shadow">
                <label className="text-xs font-bold text-gray-400 uppercase">Select Class</label>
                <select className="w-full border p-2 rounded mt-1" value={selectedClassId} onChange={(e) => loadClass(e.target.value)}>
                  <option value="">Choose Class</option>
                  {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={async() => {
                  const n = prompt("New Class Name:");
                  if(n) { await supabase.from('classes').insert({name: n, school_id: profile.school_id}); fetchBaseData(); }
                }} className="text-xs text-blue-600 mt-2 font-bold">+ New Class</button>
              </div>

              <div className="bg-white p-4 rounded shadow h-[400px] overflow-auto">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Students</label>
                  {selectedClassId && <button onClick={async() => {
                    const n = prompt("Student Name:");
                    if(n) { 
                        await supabase.from('students').insert({name: n, school_id: profile.school_id, class_id: selectedClassId, admission_no: `ADM-${Date.now()}`}); 
                        loadClass(selectedClassId); 
                    }
                  }}><Plus size={16}/></button>}
                </div>
                {students.map(s => (
                  <div key={s.id} onClick={() => loadStudent(s)} className={`p-2 cursor-pointer rounded mb-1 flex justify-between group ${selectedStudent?.id === s.id ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-50'}`}>
                    <span>{s.name}</span>
                    <button onClick={async(e) => {
                        e.stopPropagation();
                        if(window.confirm("Delete Student?")) {
                            await supabase.from('students').delete().eq('id', s.id);
                            loadClass(selectedClassId);
                        }
                    }} className="hidden group-hover:block"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-9">
              {!selectedStudent ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded">
                  <Users size={48} />
                  <p>Select a student to enter scores</p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded shadow">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h1 className="text-2xl font-bold">{selectedStudent.name}</h1>
                      <p className="text-sm text-gray-500">{selectedStudent.admission_no}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setPreviewing(true)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded flex items-center gap-2 font-bold"><Eye size={18}/> Preview</button>
                      <button onClick={handleSave} disabled={saving} className="bg-green-600 text-white px-6 py-2 rounded flex items-center gap-2 font-bold">
                        {saving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Save Scores
                      </button>
                    </div>
                  </div>

                  <table className="w-full border">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="p-3 border">Subject</th>
                        {school?.assessment_config?.map(c => <th key={c.code} className="p-3 border text-center">{c.name} ({c.max})</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(sub => (
                        <tr key={sub.id}>
                          <td className="p-3 border font-medium">{sub.name}</td>
                          {school?.assessment_config?.map(c => (
                            <td key={c.code} className="p-3 border">
                              <input 
                                type="number" 
                                className="w-full text-center p-1 border rounded"
                                value={scores[sub.id]?.[c.code] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setScores(prev => ({...prev, [sub.id]: {...(prev[sub.id] || {}), [c.code]: val}}));
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
                    if(n) { await supabase.from('subjects').insert({name: n, class_id: selectedClassId}); loadClass(selectedClassId); }
                  }} className="mt-4 text-blue-600 font-bold flex items-center gap-1"><Plus size={16}/> Add Subject</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== AUTH ====================
const Auth = () => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });

  useEffect(() => { supabase.from('schools').select('id, name').then(({data}) => setSchools(data || [])); }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'school_reg') {
        const { data: auth, error: ae } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (ae) throw ae;
        const { data: s, error: se } = await supabase.from('schools').insert({ owner_id: auth.user.id, name: form.name }).select().single();
        if (se) throw se;
        await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'admin', school_id: s.id });
        alert("School Created! Please Login."); setMode('login');
      } else if (mode === 'teacher_reg') {
        const { data: auth, error: ae } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (ae) throw ae;
        await supabase.from('profiles').insert({ id: auth.user.id, full_name: form.name, role: 'teacher', school_id: form.schoolId });
        alert("Account Created! Please Login."); setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      }
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded shadow w-full max-w-md border-t-4 border-blue-600">
        <h1 className="text-2xl font-bold text-center mb-6">Springforth Results</h1>
        <div className="flex gap-4 mb-6 text-xs font-bold border-b pb-2 overflow-x-auto">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={mode === m ? 'text-blue-600 border-b-2 border-blue-600' : ''}>{m.replace('_',' ')}</button>
          ))}
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {mode !== 'login' && <input placeholder="Full Name" className="w-full p-2 border rounded" onChange={e => setForm({...form, name: e.target.value})} required />}
          <input type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={e => setForm({...form, email: e.target.value})} required />
          <input type="password" placeholder="Password" className="w-full p-2 border rounded" onChange={e => setForm({...form, password: e.target.value})} required />
          {mode === 'teacher_reg' && (
            <select className="w-full p-2 border rounded" onChange={e => setForm({...form, schoolId: e.target.value})} required>
              <option value="">Select Your School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">{loading ? '...' : 'Access Portal'}</button>
        </form>
      </div>
    </div>
  );
};

// ==================== APP ROOT ====================
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); if(!s) setLoading(false); });
    supabase.auth.onAuthStateChange((_event, s) => { setSession(s); if(!s) { setProfile(null); } });
  }, []);

  useEffect(() => {
    if (session) {
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({data}) => {
        setProfile(data); setLoading(false);
      });
    }
  }, [session]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!session) return <Auth />;
  if (!profile) return <div className="p-20 text-center"><button onClick={() => supabase.auth.signOut()} className="bg-red-500 text-white p-2">Session Error. Click to Logout & Retry</button></div>;

  return <Dashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;