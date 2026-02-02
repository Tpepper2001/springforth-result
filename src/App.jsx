import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { Loader2, School, LogOut, Users, Settings, CheckCircle, Search, Menu, X, Upload, Shield, UserCog, Plus, BookOpen } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
const RATINGS = ['5', '4', '3', '2', '1'];
const CENTRAL_ADMIN_EMAIL = 'admin@admin.com';

const getGrade = (score) => {
  if (score >= 86) return { g: 'A*', r: 'Excellent' };
  if (score >= 76) return { g: 'A', r: 'Outstanding' };
  if (score >= 66) return { g: 'B', r: 'Very Good' };
  if (score >= 60) return { g: 'C', r: 'Good' };
  if (score >= 50) return { g: 'D', r: 'Fairly Good' };
  if (score >= 40) return { g: 'E', r: 'Below Expectation' };
  return { g: 'E*', r: 'Rarely' };
};

const pdfStyles = StyleSheet.create({
  page: { padding: 20, fontSize: 7, fontFamily: 'Helvetica', color: '#000', border: '2pt solid red' },
  headerBox: { flexDirection: 'row', alignItems: 'center', borderBottom: '2pt solid #003366', paddingBottom: 5, marginBottom: 5 },
  schoolLogo: { width: 60, height: 60 },
  headerText: { flex: 1, textAlign: 'center' },
  schoolTitle: { fontSize: 18, fontWeight: 'bold', color: '#0066cc' },
  studentPhoto: { width: 60, height: 70, border: '1pt solid #000' },
  bioRow: { flexDirection: 'row', backgroundColor: '#add8e6', padding: 3, border: '1pt solid #000', marginBottom: 2 },
  bioCell: { flex: 1, fontWeight: 'bold' },
  table: { width: '100%', borderLeft: '1pt solid #000', borderTop: '1pt solid #000' },
  tRow: { flexDirection: 'row', borderBottom: '1pt solid #000' },
  tHeader: { backgroundColor: '#add8e6', fontWeight: 'bold', textAlign: 'center' },
  tCell: { borderRight: '1pt solid #000', padding: 2, textAlign: 'center' },
  tCellLeft: { borderRight: '1pt solid #000', padding: 2, textAlign: 'left', width: 100 },
  verticalText: { fontSize: 5, width: 25, textAlign: 'center' },
  remarkBox: { border: '1pt solid red', padding: 5, marginTop: 5 },
  behaviorTable: { width: '100%', border: '1pt solid #000', marginTop: 5 },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTop: '1pt solid #000', paddingTop: 5 }
});

const ResultPDF = ({ school, student, results, comments, type = 'full' }) => {
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
              {type === 'ca' ? 'TERM ONE (HALF TERM) REPORT' : 'TERM ONE (FULL TERM) REPORT'} 2025/2026 ACADEMIC SESSION
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
          <Text style={pdfStyles.bioCell}>CLASS SIZE: 24</Text>
        </View>
        <View style={pdfStyles.bioRow}>
          <Text style={pdfStyles.bioCell}>CLASS: {student?.classes?.name}</Text>
          <Text style={pdfStyles.bioCell}>OVERALL GRADE: {getGrade(avg).g}</Text>
          <Text style={pdfStyles.bioCell}>GENDER: {student?.gender === 'Male' ? 'M' : 'F'}</Text>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tRow, pdfStyles.tHeader]}>
            <Text style={{ width: 20, borderRight: '1pt solid #000' }}>S/N</Text>
            <Text style={pdfStyles.tCellLeft}>SUBJECTS</Text>
            <Text style={pdfStyles.verticalText}>NOTE (5%)</Text>
            <Text style={pdfStyles.verticalText}>CW (5%)</Text>
            <Text style={pdfStyles.verticalText}>HW (5%)</Text>
            <Text style={pdfStyles.verticalText}>TEST (15%)</Text>
            <Text style={pdfStyles.verticalText}>CA1 (15%)</Text>
            <Text style={pdfStyles.verticalText}>TOTAL (100%)</Text>
            <Text style={pdfStyles.verticalText}>GRADE</Text>
            <Text style={{ flex: 1 }}>REMARKS</Text>
          </View>
          {results.map((r, i) => {
            const sc = r.scores || {};
            const total = (parseFloat(sc.note)||0) + (parseFloat(sc.cw)||0) + (parseFloat(sc.hw)||0) + (parseFloat(sc.test)||0) + (parseFloat(sc.ca1)||0);
            const normalized = ((total / 45) * 100).toFixed(0);
            return (
              <View key={r.id} style={pdfStyles.tRow}>
                <Text style={{ width: 20, borderRight: '1pt solid #000', textAlign: 'center' }}>{i + 1}</Text>
                <Text style={pdfStyles.tCellLeft}>{r.subjects?.name}</Text>
                <Text style={pdfStyles.tCell}>{sc.note}</Text>
                <Text style={pdfStyles.tCell}>{sc.cw}</Text>
                <Text style={pdfStyles.tCell}>{sc.hw}</Text>
                <Text style={pdfStyles.tCell}>{sc.test}</Text>
                <Text style={pdfStyles.tCell}>{sc.ca1}</Text>
                <Text style={pdfStyles.tCell}>{normalized}%</Text>
                <Text style={pdfStyles.tCell}>{getGrade(normalized).g}</Text>
                <Text style={{ flex: 1, paddingLeft: 3 }}>{getGrade(normalized).r}</Text>
              </View>
            );
          })}
        </View>

        <Text style={{ marginTop: 5, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#add8e6' }}>STUDENTS BEHAVIOURAL REPORT</Text>
        <View style={pdfStyles.behaviorTable}>
          {BEHAVIORS.map(b => (
            <View key={b} style={pdfStyles.tRow}>
              <Text style={{ flex: 2, borderRight: '1pt solid #000', paddingLeft: 3 }}>{b}</Text>
              <Text style={{ flex: 1, borderRight: '1pt solid #000', textAlign: 'center' }}>{comments?.behaviors?.[b] || '-'}</Text>
              <Text style={{ flex: 1, paddingLeft: 3 }}>Excellent Degree</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.remarkBox}>
          <Text style={{ fontWeight: 'bold' }}>FORM TUTOR'S COMMENT: <Text style={{ fontWeight: 'normal' }}>{comments?.tutor_comment}</Text></Text>
          <Text style={{ fontWeight: 'bold', marginTop: 4 }}>PRINCIPAL'S COMMENT: <Text style={{ fontWeight: 'normal' }}>{comments?.principal_comment}</Text></Text>
        </View>

        <View style={pdfStyles.sigRow}>
          <View style={{ textAlign: 'center' }}><Text>__________________</Text><Text>FORM TUTOR</Text></View>
          <View style={{ textAlign: 'center' }}><Text>__________________</Text><Text>ACTING PRINCIPAL</Text></View>
        </View>
      </Page>
    </Document>
  );
};

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
        <button onClick={onLogout} className="bg-white/20 px-6 py-2 rounded-xl font-bold">Logout</button>
      </div>
      <div className="bg-white rounded-3xl shadow border overflow-hidden">
        {users.map(u => (
          <div key={u.id} className="p-4 border-b flex justify-between items-center hover:bg-slate-50 transition">
            <div><p className="font-bold">{u.full_name}</p><p className="text-xs text-slate-400">{u.schools?.name || 'Unassigned'} • {u.role}</p></div>
            <button onClick={() => setSelectedUser(u)} className="p-2 bg-slate-100 rounded-lg"><UserCog/></button>
          </div>
        ))}
      </div>
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black mb-6">Manage Staff: {selectedUser.full_name}</h3>
            <div className="space-y-4">
              <select className="w-full border-2 p-3 rounded-xl" defaultValue={selectedUser.role} onChange={(e) => updateStaff(selectedUser.id, { role: e.target.value })}>
                <option value="teacher">Teacher</option><option value="admin">Admin</option>
              </select>
              <select className="w-full border-2 p-3 rounded-xl" defaultValue={selectedUser.school_id} onChange={(e) => updateStaff(selectedUser.id, { school_id: e.target.value })}>
                <option value="">Transfer School</option>
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
  const [results, setResults] = useState([]);
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

  const selectStu = async (s) => {
    setSelectedStudent(s); setSide(false);
    const { data: rs } = await supabase.from('results').select('*, subjects(name)').eq('student_id', s.id);
    const { data: co } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle();
    setResults(rs || []);
    setScores(rs?.reduce((a, r) => ({ ...a, [r.subject_id]: r.scores }), {}) || {});
    setCommentData(co || { behaviors: {}, submission_status: 'draft' });
  };

  const save = async () => {
    const ups = subjects.map(s => {
      const sc = scores[s.id] || {};
      const total = (parseFloat(sc.note)||0) + (parseFloat(sc.cw)||0) + (parseFloat(sc.hw)||0) + (parseFloat(sc.test)||0) + (parseFloat(sc.ca1)||0);
      return { student_id: selectedStudent.id, subject_id: s.id, scores: sc, total };
    });
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(ups);
    await supabase.from('comments').upsert({ student_id: selectedStudent.id, school_id: school.id, tutor_comment: commentData.tutor_comment, behaviors: commentData.behaviors, submission_status: 'pending' });
    alert("Saved!"); selectStu(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className={`fixed lg:static inset-y-0 left-0 w-72 bg-slate-900 text-white p-6 transition-transform z-40 ${side ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-10"><h1 className="text-xl font-black text-blue-400 flex items-center gap-2"><School/> Portal</h1><button onClick={()=>setSide(false)} className="lg:hidden"><X/></button></div>
        <select className="w-full bg-slate-800 p-3 rounded-xl mb-6 text-sm outline-none" onChange={(e)=>loadClass(e.target.value)}>
          <option value="">Select Class</option>
          {classList.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {selectedClassId && (
          <div className="flex-1 overflow-auto">
            <div className="flex justify-between items-center mb-4"><span className="text-[10px] text-slate-500 font-black uppercase">Students</span><button onClick={()=>{
              const n = prompt("Name:"); if(n) supabase.from('students').insert({ name: n, admission_no: 'SF-'+Math.floor(1000+Math.random()*9000), class_id: selectedClassId, school_id: profile.school_id, gender: 'Male' }).then(()=>loadClass(selectedClassId));
            }}><Plus size={16}/></button></div>
            {students.map(s => (
              <div key={s.id} onClick={()=>selectStu(s)} className={`p-3 cursor-pointer rounded-xl mb-1 text-sm ${selectedStudent?.id === s.id ? 'bg-blue-600' : 'hover:bg-white/5'}`}>{s.name}</div>
            ))}
          </div>
        )}
        <button onClick={onLogout} className="mt-auto flex items-center gap-3 text-red-400 font-bold p-3"><LogOut size={20}/> Logout</button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 bg-white border-b flex items-center gap-4">
          <button onClick={()=>setSide(true)} className="lg:hidden"><Menu/></button>
          <div className="flex-1 font-black">{selectedStudent?.name || "Select Student"}</div>
          {selectedStudent && (
            <div className="flex gap-2">
              <button onClick={()=>setPreview('ca')} className="bg-slate-100 p-2 rounded-xl">Mid-term Preview</button>
              <button onClick={()=>setPreview('full')} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold">PDF Full</button>
              <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Upload Results</button>
            </div>
          )}
        </div>
        {selectedStudent ? (
          <div className="p-8 flex-1 overflow-auto space-y-8">
            <div className="flex gap-8 border-b font-black text-xs uppercase tracking-widest text-slate-400">
              <button onClick={()=>setTab('scores')} className={tab==='scores' ? 'text-blue-600 border-b-4 border-blue-600 pb-4' : 'pb-4'}>Scores</button>
              <button onClick={()=>setTab('traits')} className={tab==='traits' ? 'text-blue-600 border-b-4 border-blue-600' : 'pb-4'}>Behavior</button>
              <button onClick={()=>setTab('remarks')} className={tab==='remarks' ? 'text-blue-600 border-b-4 border-blue-600' : 'pb-4'}>Remarks</button>
            </div>
            {tab === 'scores' && (
              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <button onClick={()=>{
                  const n = prompt("Subject:"); if(n) supabase.from('subjects').insert({ name: n, class_id: selectedClassId }).then(()=>loadClass(selectedClassId));
                }} className="flex items-center gap-2 text-blue-600 font-bold mb-4"><BookOpen size={16}/> Add Subject</button>
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase text-slate-400"><tr><th>Subject</th><th>Note(5)</th><th>CW(5)</th><th>HW(5)</th><th>Test(15)</th><th>CA1(15)</th></tr></thead>
                  <tbody>
                    {subjects.map(sub => (
                      <tr key={sub.id} className="border-t">
                        <td className="py-4 font-bold">{sub.name}</td>
                        {['note', 'cw', 'hw', 'test', 'ca1'].map(f => (
                          <td key={f}><input type="number" className="w-12 border p-1 rounded" value={scores[sub.id]?.[f] || ''} onChange={(e)=>{
                            setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), [f]: e.target.value}});
                          }}/></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab === 'traits' && (
              <div className="grid grid-cols-2 gap-4">
                {BEHAVIORS.map(b => (
                  <div key={b} className="p-4 bg-white border rounded-2xl flex justify-between items-center">
                    <span className="font-bold text-xs">{b}</span>
                    <select className="border p-2 rounded-lg text-xs" value={commentData.behaviors?.[b] || ''} onChange={(e)=>setCommentData({...commentData, behaviors: {...commentData.behaviors, [b]: e.target.value}})}>
                      <option value="">Rate</option>{RATINGS.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
            {tab === 'remarks' && <textarea className="w-full border-2 p-6 h-40 rounded-3xl outline-none focus:border-blue-600" value={commentData.tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})} placeholder="Tutor Remarks..."/>}
          </div>
        ) : <div className="flex-1 flex items-center justify-center text-slate-300 font-black uppercase tracking-widest">Select Student</div>}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-4">
          <div className="bg-white p-4 flex justify-between rounded-t-3xl items-center"><button onClick={()=>setPreview(null)} className="font-black text-red-500">✕ CLOSE</button><PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={results} comments={commentData} type={preview}/>} fileName="result.pdf"><button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black">DOWNLOAD PDF</button></PDFDownloadLink></div>
          <PDFViewer className="flex-1 rounded-b-3xl border-none"><ResultPDF school={school} student={selectedStudent} results={results} comments={commentData} type={preview}/></PDFViewer>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState(null);
  const [activeTab, setActiveTab] = useState('setup');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [commentData, setCommentData] = useState({});

  const load = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    const { data: st } = await supabase.from('students').select('*').eq('school_id', profile.school_id);
    setSchool(s); setStudents(st || []);
  }, [profile.school_id]);

  useEffect(() => { load(); }, [load]);

  const approve = async () => {
    await supabase.from('comments').update({ submission_status: 'approved', principal_comment: commentData.principal_comment }).eq('student_id', selectedStudent.id);
    alert("Approved!"); setSelectedStudent(null); load();
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-indigo-950 text-white p-6 flex flex-col">
        <h1 className="font-black text-xl mb-10 flex items-center gap-3 text-indigo-400"><Shield/> ADMIN</h1>
        <button onClick={()=>setActiveTab('review')} className={`p-4 text-left rounded-2xl flex items-center gap-3 mb-2 font-bold transition ${activeTab === 'review' ? 'bg-white/10' : ''}`}><CheckCircle size={20}/> Approvals</button>
        <button onClick={()=>setActiveTab('setup')} className={`p-4 text-left rounded-2xl flex items-center gap-3 mb-2 font-bold transition ${activeTab === 'setup' ? 'bg-white/10' : ''}`}><Upload size={20}/> Logo Setup</button>
        <button onClick={onLogout} className="mt-auto p-4 text-red-400 font-black"><LogOut size={20}/> Logout</button>
      </div>
      <div className="flex-1 p-10 overflow-auto">
        {activeTab === 'setup' ? (
          <div className="bg-white p-12 rounded-[40px] shadow-xl text-center max-w-md mx-auto border">
            {school?.logo_url && <img src={school.logo_url} alt="Logo" className="h-32 mx-auto mb-8"/>}
            <label className="bg-indigo-50 p-10 rounded-[30px] border-4 border-dashed border-indigo-200 block cursor-pointer">
              <Upload className="mx-auto mb-4 text-indigo-400"/>
              <p className="font-black text-indigo-600 uppercase text-xs">Update School Logo</p>
              <input type="file" className="hidden" onChange={(e)=>{
                const f = e.target.files[0]; if(!f) return;
                const n = `logo-${school.id}`;
                supabase.storage.from('school-logos').upload(n, f, { upsert: true }).then(() => {
                  const { data: { publicUrl } } = supabase.storage.from('school-logos').getPublicUrl(n);
                  supabase.from('schools').update({ logo_url: publicUrl }).eq('id', school.id).then(load);
                });
              }} accept="image/*"/>
            </label>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border">
            <div className="p-6 border-b bg-slate-50 font-black">Student Approval Requests</div>
            {students.map(s => (
              <div key={s.id} onClick={async () => {
                const { data: co } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle();
                setSelectedStudent(s); setCommentData(co || {});
              }} className="p-6 border-b hover:bg-slate-50 flex justify-between cursor-pointer">
                <span className="font-bold">{s.name}</span><span className="text-xs font-black text-indigo-600">Review →</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white p-10 rounded-[40px] w-full max-w-2xl shadow-2xl">
            <h3 className="text-2xl font-black mb-6">Review: {selectedStudent.name}</h3>
            <textarea className="w-full border-2 p-6 h-40 rounded-3xl mb-6" placeholder="Principal's Remark..." value={commentData.principal_comment || ''} onChange={(e)=>setCommentData({...commentData, principal_comment: e.target.value})} />
            <div className="flex gap-4"><button onClick={approve} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">Approve & Publish</button><button onClick={()=>setSelectedStudent(null)} className="px-10 text-slate-400 font-bold">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const Auth = ({ onParent }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });
  const [busy, setBusy] = useState(false);
  const [schools, setSchools] = useState([]);
  useEffect(() => { supabase.from('schools').select('id, name').then(({data}) => setSchools(data || [])); }, []);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === 'login') await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      else {
        const { data: { user } } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (mode === 'school_reg') {
          const { data: s } = await supabase.from('schools').insert({ owner_id: user.id, name: form.name }).select().single();
          await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'admin', school_id: s.id });
        } else await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'teacher', school_id: form.schoolId });
        alert("Verify email then login.");
      }
    } catch (err) { alert(err.message); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[50px] shadow-2xl max-w-md w-full border-t-[10px] border-blue-600">
        <h1 className="text-3xl font-black text-center mb-8 italic text-blue-600">SPRINGFORTH</h1>
        <div className="flex gap-4 mb-8 border-b text-[10px] font-black uppercase tracking-widest pb-3">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={mode === m ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}>{m.replace('_',' ')}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode !== 'login' && <input className="w-full border-2 p-4 rounded-2xl outline-none" placeholder="Full Name" onChange={(e)=>setForm({...form, name: e.target.value})} required />}
          <input className="w-full border-2 p-4 rounded-2xl outline-none" type="email" placeholder="Email" onChange={(e)=>setForm({...form, email: e.target.value})} required />
          <input className="w-full border-2 p-4 rounded-2xl outline-none" type="password" placeholder="Password" onChange={(e)=>setForm({...form, password: e.target.value})} required />
          {mode === 'teacher_reg' && <select className="w-full border-2 p-4 rounded-2xl bg-white outline-none" onChange={(e)=>setForm({...form, schoolId: e.target.value})} required><option value="">Select School</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest">{busy ? <Loader2 className="animate-spin mx-auto"/> : 'Access Portal'}</button>
        </form>
        <button onClick={onParent} className="w-full bg-slate-50 py-4 rounded-2xl mt-8 font-black uppercase text-slate-400 flex justify-center items-center gap-3"><Search size={18}/> Student Portal</button>
      </div>
    </div>
  );
};

const ParentPortal = ({ onBack }) => {
  const [id, setId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const lookup = async () => {
    setLoading(true);
    const { data: st } = await supabase.from('students').select('*, schools(*), classes(*), results(*, subjects(*)), comments(*)').eq('admission_no', id).maybeSingle();
    if (st && st.comments?.[0]?.submission_status === 'approved') setData(st); else alert("Not found."); setLoading(false);
  };
  if (data) return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <button onClick={()=>setData(null)} className="p-6 bg-slate-100 font-black">← BACK</button>
      <PDFViewer className="flex-1 border-none"><ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} /></PDFViewer>
    </div>
  );
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl max-w-sm w-full text-center border">
        <Search size={80} className="mx-auto text-blue-600 mb-8 bg-blue-50 p-5 rounded-[30px]"/>
        <h2 className="text-3xl font-black mb-3">Parent Portal</h2>
        <input className="w-full border-2 p-5 rounded-3xl mb-4 text-center font-black tracking-widest text-lg" placeholder="ADM-XXXX" onChange={(e)=>setId(e.target.value)} />
        <button onClick={lookup} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'View Report'}</button>
        <button onClick={onBack} className="mt-8 text-slate-400 block w-full text-xs font-black uppercase">Login</button>
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
    if (userEmail === CENTRAL_ADMIN_EMAIL) { setProfile({ role: 'central_admin' }); setLoading(false); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data); setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); if (!s) setLoading(false); else loadProfile(s.user.id, s.user.email); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { setSession(s); if (!s) { setProfile(null); setView('auth'); setLoading(false); } else loadProfile(s.user.id, s.user.email); });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  if (profile?.role === 'central_admin') return <CentralAdminDashboard onLogout={() => supabase.auth.signOut()} />;
  if (profile?.role === 'admin') return <AdminDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
  return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;
