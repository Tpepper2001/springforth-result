import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { 
  Loader2, School, LogOut, Users, Settings, CheckCircle, 
  Search, Menu, X, Upload, Shield, UserCog, Plus, BookOpen 
} from 'lucide-react';

// ==================== CONFIG & CLIENT ====================
const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
const RATINGS = ['5', '4', '3', '2', '1'];
const CENTRAL_ADMIN_EMAIL = 'admin@admin.com';

// ==================== GRADING LOGIC ====================
const getGrade = (score) => {
  const s = parseFloat(score) || 0;
  if (s >= 86) return { g: 'A*', r: 'Excellent' };
  if (s >= 76) return { g: 'A', r: 'Outstanding' };
  if (s >= 66) return { g: 'B', r: 'Very Good' };
  if (s >= 60) return { g: 'C', r: 'Good' };
  if (s >= 50) return { g: 'D', r: 'Fairly Good' };
  if (s >= 40) return { g: 'E', r: 'Below Expectation' };
  return { g: 'E*', r: 'Rarely' };
};

// ==================== PDF STYLES ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 20, fontSize: 7, fontFamily: 'Helvetica', color: '#000' },
  headerBox: { flexDirection: 'row', alignItems: 'center', borderBottom: '2pt solid #003366', paddingBottom: 5, marginBottom: 5 },
  schoolLogo: { width: 60, height: 60 },
  headerText: { flex: 1, textAlign: 'center' },
  schoolTitle: { fontSize: 18, fontWeight: 'bold', color: '#0066cc' },
  studentPhoto: { width: 60, height: 70, border: '1pt solid #000', justifyContent: 'center', alignItems: 'center' },
  bioRow: { flexDirection: 'row', backgroundColor: '#add8e6', padding: 3, border: '1pt solid #000', marginBottom: 2 },
  bioCell: { flex: 1, fontWeight: 'bold' },
  table: { width: '100%', borderLeft: '1pt solid #000', borderTop: '1pt solid #000' },
  tRow: { flexDirection: 'row', borderBottom: '1pt solid #000' },
  tHeader: { backgroundColor: '#add8e6', fontWeight: 'bold', textAlign: 'center' },
  tCell: { borderRight: '1pt solid #000', padding: 2, textAlign: 'center', width: 40 },
  tCellLeft: { borderRight: '1pt solid #000', padding: 2, textAlign: 'left', flex: 1 },
  verticalText: { fontSize: 5, width: 40, textAlign: 'center', borderRight: '1pt solid #000' },
  remarkBox: { border: '1pt solid #003366', padding: 5, marginTop: 5 },
  behaviorTable: { width: '100%', border: '1pt solid #000', marginTop: 5 },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTop: '1pt solid #000', paddingTop: 5 }
});

// ==================== PDF COMPONENT ====================
const ResultPDF = ({ school, student, results = [], comments, type = 'full' }) => {
  const totalScore = results.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);
  const avg = results.length > 0 ? (totalScore / results.length).toFixed(1) : 0;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerBox}>
          {school?.logo_url && <Image src={school.logo_url} style={pdfStyles.schoolLogo} />}
          <View style={pdfStyles.headerText}>
            <Text style={pdfStyles.schoolTitle}>{school?.name || 'THE CAVENDISH COLLEGE'}</Text>
            <Text>{school?.address || '26 KINSHASA ROAD, KADUNA'}</Text>
            <Text>PHONE: {school?.contact_info || '08144939839'}</Text>
            <Text style={{ fontWeight: 'bold', marginTop: 3 }}>
              {type === 'ca' ? 'TERM ONE (HALF TERM) REPORT' : 'TERM ONE (FULL TERM) REPORT'} 2025/2026 SESSION
            </Text>
          </View>
          <View style={pdfStyles.studentPhoto}><Text style={{fontSize: 5}}>PHOTO</Text></View>
        </View>

        <View style={pdfStyles.bioRow}>
          <Text style={pdfStyles.bioCell}>NAME: {student?.name?.toUpperCase()}</Text>
        </View>
        <View style={pdfStyles.bioRow}>
          <Text style={pdfStyles.bioCell}>ADM NO: {student?.admission_no}</Text>
          <Text style={pdfStyles.bioCell}>AVG SCORE: {avg}%</Text>
          <Text style={pdfStyles.bioCell}>CLASS SIZE: {student?.class_size || '24'}</Text>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tRow, pdfStyles.tHeader]}>
            <Text style={{ width: 20, borderRight: '1pt solid #000' }}>S/N</Text>
            <Text style={pdfStyles.tCellLeft}>SUBJECTS</Text>
            <Text style={pdfStyles.verticalText}>NOTE (5)</Text>
            <Text style={pdfStyles.verticalText}>CW (5)</Text>
            <Text style={pdfStyles.verticalText}>HW (5)</Text>
            <Text style={pdfStyles.verticalText}>TEST (15)</Text>
            <Text style={pdfStyles.verticalText}>CA1 (15)</Text>
            <Text style={pdfStyles.verticalText}>TOTAL (100)</Text>
            <Text style={pdfStyles.verticalText}>GRADE</Text>
          </View>
          {results.map((r, i) => (
            <View key={r.subject_id || i} style={pdfStyles.tRow}>
              <Text style={{ width: 20, borderRight: '1pt solid #000', textAlign: 'center' }}>{i + 1}</Text>
              <Text style={pdfStyles.tCellLeft}>{r.subjects?.name || 'Subject'}</Text>
              <Text style={pdfStyles.tCell}>{r.scores?.note || 0}</Text>
              <Text style={pdfStyles.tCell}>{r.scores?.cw || 0}</Text>
              <Text style={pdfStyles.tCell}>{r.scores?.hw || 0}</Text>
              <Text style={pdfStyles.tCell}>{r.scores?.test || 0}</Text>
              <Text style={pdfStyles.tCell}>{r.scores?.ca1 || 0}</Text>
              <Text style={pdfStyles.tCell}>{r.total || 0}%</Text>
              <Text style={pdfStyles.tCell}>{getGrade(r.total).g}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.behaviorTable}>
          <View style={[pdfStyles.tRow, pdfStyles.tHeader]}>
            <Text style={{ flex: 2, borderRight: '1pt solid #000' }}>BEHAVIOURAL TRAITS</Text>
            <Text style={{ flex: 1 }}>RATING (5-1)</Text>
          </View>
          {BEHAVIORS.map(b => (
            <View key={b} style={pdfStyles.tRow}>
              <Text style={{ flex: 2, borderRight: '1pt solid #000', paddingLeft: 3 }}>{b}</Text>
              <Text style={{ flex: 1, textAlign: 'center' }}>{comments?.behaviors?.[b] || '-'}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.remarkBox}>
          <Text style={{ fontWeight: 'bold' }}>FORM TUTOR'S COMMENT: <Text style={{ fontWeight: 'normal' }}>{comments?.tutor_comment || 'N/A'}</Text></Text>
          <Text style={{ fontWeight: 'bold', marginTop: 4 }}>PRINCIPAL'S COMMENT: <Text style={{ fontWeight: 'normal' }}>{comments?.principal_comment || 'N/A'}</Text></Text>
        </View>

        <View style={pdfStyles.sigRow}>
          <View style={{ textAlign: 'center' }}><Text>__________________</Text><Text>FORM TUTOR</Text></View>
          <View style={{ textAlign: 'center' }}><Text>__________________</Text><Text>ACTING PRINCIPAL</Text></View>
        </View>
      </Page>
    </Document>
  );
};

// ==================== DASHBOARDS ====================

const CentralAdminDashboard = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const load = useCallback(async () => {
    const { data: p } = await supabase.from('profiles').select('*, schools(name)');
    const { data: s } = await supabase.from('schools').select('*');
    setUsers(p || []); setSchools(s || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStaff = async (uid, updates) => {
    await supabase.from('profiles').update(updates).eq('id', uid);
    alert("Record Updated!"); load(); setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex justify-between items-center bg-indigo-900 text-white p-6 rounded-2xl mb-8">
        <h1 className="text-2xl font-black flex items-center gap-3"><Shield size={32}/> CENTRAL CONTROL</h1>
        <button onClick={onLogout} className="bg-white/20 px-6 py-2 rounded-xl font-bold hover:bg-white/30">Logout</button>
      </div>
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-black uppercase">
            <tr><th className="p-4">Name</th><th>School</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-bold">{u.full_name}</td>
                <td>{u.schools?.name || 'Unassigned'}</td>
                <td><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">{u.role}</span></td>
                <td><button onClick={() => setSelectedUser(u)} className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg"><UserCog/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black mb-6">Manage: {selectedUser.full_name}</h3>
            <div className="space-y-4">
              <select className="w-full border-2 p-3 rounded-xl" defaultValue={selectedUser.role} onChange={(e) => updateStaff(selectedUser.id, { role: e.target.value })}>
                <option value="teacher">Teacher</option><option value="admin">School Admin</option>
              </select>
              <select className="w-full border-2 p-3 rounded-xl" defaultValue={selectedUser.school_id} onChange={(e) => updateStaff(selectedUser.id, { school_id: e.target.value })}>
                <option value="">Select School</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={() => setSelectedUser(null)} className="w-full py-3 text-slate-400 font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TeacherDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState(null);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [commentData, setCommentData] = useState({ behaviors: {} });
  const [preview, setPreview] = useState(null);
  const [tab, setTab] = useState('scores');
  const [side, setSide] = useState(false);

  const init = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    const { data: c } = await supabase.from('classes').select('*').eq('school_id', profile.school_id);
    setSchool(s); setClassList(c || []);
  }, [profile.school_id]);

  useEffect(() => { init(); }, [init]);

  const loadClass = async (id) => {
    setSelectedClassId(id);
    const { data: st } = await supabase.from('students').select('*').eq('class_id', id);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', id);
    setStudents(st || []); setSubjects(sub || []); setSelectedStudent(null);
  };

  const selectStu = async (stu) => {
    setSelectedStudent(stu); setSide(false);
    const { data: rs } = await supabase.from('results').select('*, subjects(*)').eq('student_id', stu.id);
    const { data: co } = await supabase.from('comments').select('*').eq('student_id', stu.id).maybeSingle();
    
    const scoreMap = {};
    rs?.forEach(r => { scoreMap[r.subject_id] = r.scores; });
    setScores(scoreMap);
    setCommentData(co || { behaviors: {}, tutor_comment: '', submission_status: 'draft' });
  };

  const handleScoreChange = (subId, field, val) => {
    setScores(prev => ({
      ...prev,
      [subId]: { ...(prev[subId] || {}), [field]: val }
    }));
  };

  // Prepare current results array for PDF and Saving
  const currentMappedResults = useMemo(() => {
    return subjects.map(sub => {
      const s = scores[sub.id] || {};
      const total = (parseFloat(s.note)||0) + (parseFloat(s.cw)||0) + (parseFloat(s.hw)||0) + (parseFloat(s.test)||0) + (parseFloat(s.ca1)||0);
      return { subject_id: sub.id, subjects: sub, scores: s, total };
    });
  }, [subjects, scores]);

  const save = async () => {
    const upserts = currentMappedResults.map(r => ({
      student_id: selectedStudent.id,
      subject_id: r.subject_id,
      scores: r.scores,
      total: r.total
    }));

    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(upserts);
    await supabase.from('comments').upsert({ 
      student_id: selectedStudent.id, 
      school_id: school.id, 
      tutor_comment: commentData.tutor_comment, 
      behaviors: commentData.behaviors, 
      submission_status: 'pending' 
    });
    alert("Saved Successfully!");
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className={`fixed lg:static inset-y-0 left-0 w-72 bg-slate-900 text-white p-6 transition-transform z-40 ${side ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <h1 className="text-xl font-black text-blue-400 flex items-center gap-2 mb-8"><School/> PORTAL</h1>
        <select className="w-full bg-slate-800 p-3 rounded-xl mb-6 text-sm outline-none" onChange={(e)=>loadClass(e.target.value)}>
          <option value="">Select Class</option>
          {classList.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {selectedClassId && (
          <div className="space-y-1 overflow-y-auto max-h-[60vh]">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Students</p>
            {students.map(s => (
              <button key={s.id} onClick={()=>selectStu(s)} className={`w-full text-left p-3 rounded-xl text-sm transition ${selectedStudent?.id === s.id ? 'bg-blue-600' : 'hover:bg-white/5'}`}>{s.name}</button>
            ))}
          </div>
        )}
        <button onClick={onLogout} className="absolute bottom-6 left-6 text-red-400 font-bold flex items-center gap-2"><LogOut size={18}/> Logout</button>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        <div className="p-6 bg-white border-b flex items-center justify-between">
          <button onClick={()=>setSide(true)} className="lg:hidden"><Menu/></button>
          <h2 className="font-black text-lg">{selectedStudent?.name || "Select Student"}</h2>
          {selectedStudent && (
            <div className="flex gap-2">
              <button onClick={()=>setPreview('full')} className="bg-slate-100 px-4 py-2 rounded-xl font-bold text-xs">Preview Report</button>
              <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Save Data</button>
            </div>
          )}
        </div>

        {selectedStudent ? (
          <div className="p-8 max-w-4xl mx-auto w-full">
            <div className="flex gap-6 border-b mb-6 font-bold text-xs uppercase text-slate-400">
              <button onClick={()=>setTab('scores')} className={`pb-2 ${tab==='scores' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>Scores</button>
              <button onClick={()=>setTab('traits')} className={`pb-2 ${tab==='traits' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>Traits</button>
              <button onClick={()=>setTab('remarks')} className={`pb-2 ${tab==='remarks' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}>Comments</button>
            </div>

            {tab === 'scores' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-slate-400 uppercase">
                      <th className="pb-4">Subject</th><th>Note</th><th>CW</th><th>HW</th><th>Test</th><th>CA1</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {subjects.map(sub => (
                      <tr key={sub.id}>
                        <td className="py-3 font-bold text-sm">{sub.name}</td>
                        {['note', 'cw', 'hw', 'test', 'ca1'].map(f => (
                          <td key={f}><input type="number" className="w-12 border p-1 rounded text-center text-xs" 
                            value={scores[sub.id]?.[f] || ''} onChange={(e)=>handleScoreChange(sub.id, f, e.target.value)} /></td>
                        ))}
                        <td className="font-black text-blue-600">
                          {currentMappedResults.find(r => r.subject_id === sub.id)?.total || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'traits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BEHAVIORS.map(b => (
                  <div key={b} className="flex justify-between items-center p-4 bg-white border rounded-xl">
                    <span className="font-bold text-xs">{b}</span>
                    <select className="border p-1 rounded text-xs" value={commentData.behaviors?.[b] || ''} 
                      onChange={(e)=>setCommentData({...commentData, behaviors: {...commentData.behaviors, [b]: e.target.value}})}>
                      <option value="">-</option>
                      {RATINGS.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {tab === 'remarks' && (
              <textarea className="w-full border-2 p-4 h-40 rounded-2xl outline-none" 
                value={commentData.tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})} 
                placeholder="Enter tutor remarks..."/>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest">Select a student to begin</div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-4">
          <div className="bg-white p-4 flex justify-between rounded-t-2xl items-center">
            <button onClick={()=>setPreview(null)} className="font-bold text-red-500">✕ Close</button>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={currentMappedResults} comments={commentData} type={preview}/>} fileName="report.pdf">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Download</button>
            </PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 rounded-b-2xl"><ResultPDF school={school} student={selectedStudent} results={currentMappedResults} comments={commentData} type={preview}/></PDFViewer>
        </div>
      )}
    </div>
  );
};

// ==================== AUTH & ROOT ====================

const Auth = ({ onParent }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-black text-center mb-8 text-blue-600 italic">SPRINGFORTH</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input className="w-full border-2 p-4 rounded-2xl" type="email" placeholder="Email" onChange={e=>setForm({...form, email: e.target.value})} required />
          <input className="w-full border-2 p-4 rounded-2xl" type="password" placeholder="Password" onChange={e=>setForm({...form, password: e.target.value})} required />
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Login'}
          </button>
        </form>
        <button onClick={onParent} className="w-full mt-6 text-slate-400 text-xs font-bold uppercase tracking-widest">Parent Portal</button>
      </div>
    </div>
  );
};

const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId, userEmail) => {
    if (userEmail === CENTRAL_ADMIN_EMAIL) {
      setProfile({ role: 'central_admin' });
    } else {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      setProfile(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { 
      setSession(s); 
      if (s) loadProfile(s.user.id, s.user.email);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { 
      setSession(s); 
      if (s) loadProfile(s.user.id, s.user.email);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  
  if (profile?.role === 'central_admin') return <CentralAdminDashboard onLogout={() => supabase.auth.signOut()} />;
  return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;
