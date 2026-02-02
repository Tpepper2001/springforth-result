import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { Loader2, School, LogOut, Users, CheckCircle, Search, Menu, X, Upload, Shield, UserCog, Plus, BookOpen, Trash2, GraduationCap } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
const RATINGS = ['5', '4', '3', '2', '1'];
const CENTRAL_ADMIN_EMAIL = 'admin@admin.com';

// ==================== CAVENDISH GRADING LOGIC (40/60 SYSTEM) ====================
const getGrade = (score) => {
  if (score >= 86) return { g: 'A*', r: 'Excellent' };
  if (score >= 76) return { g: 'A', r: 'Outstanding' };
  if (score >= 66) return { g: 'B', r: 'Very Good' };
  if (score >= 60) return { g: 'C', r: 'Good' };
  if (score >= 50) return { g: 'D', r: 'Fairly Good' };
  if (score >= 40) return { g: 'E', r: 'Below Expectation' };
  return { g: 'E*', r: 'Rarely' };
};

// ==================== PDF STYLES ====================
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
  tCellLeft: { borderRight: '1pt solid #000', padding: 2, textAlign: 'left', width: 150 },
  verticalText: { fontSize: 6, width: 40, textAlign: 'center' },
  remarkBox: { border: '1pt solid red', padding: 5, marginTop: 5 },
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
          <Text style={pdfStyles.bioCell}>CLASS: {student?.classes?.name}</Text>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tRow, pdfStyles.tHeader]}>
            <Text style={{ width: 20, borderRight: '1pt solid #000' }}>S/N</Text>
            <Text style={pdfStyles.tCellLeft}>SUBJECTS</Text>
            <Text style={pdfStyles.verticalText}>CA (40%)</Text>
            <Text style={pdfStyles.verticalText}>EXAM (60%)</Text>
            <Text style={pdfStyles.verticalText}>TOTAL (100%)</Text>
            <Text style={pdfStyles.verticalText}>GRADE</Text>
            <Text style={{ flex: 1 }}>REMARKS</Text>
          </View>
          {results.map((r, i) => (
            <View key={r.id || i} style={pdfStyles.tRow}>
              <Text style={{ width: 20, borderRight: '1pt solid #000', textAlign: 'center' }}>{i + 1}</Text>
              <Text style={pdfStyles.tCellLeft}>{r.subjects?.name}</Text>
              <Text style={pdfStyles.tCell}>{r.scores?.ca || 0}</Text>
              <Text style={pdfStyles.tCell}>{r.scores?.exam || 0}</Text>
              <Text style={pdfStyles.tCell}>{r.total || 0}%</Text>
              <Text style={pdfStyles.tCell}>{getGrade(r.total).g}</Text>
              <Text style={{ flex: 1, paddingLeft: 3 }}>{getGrade(r.total).r}</Text>
            </View>
          ))}
        </View>

        <Text style={{ marginTop: 5, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#add8e6' }}>STUDENTS BEHAVIOURAL REPORT</Text>
        <View style={pdfStyles.behaviorTable}>
          {BEHAVIORS.map(b => (
            <View key={b} style={pdfStyles.tRow}>
              <Text style={{ flex: 2, borderRight: '1pt solid #000', paddingLeft: 3 }}>{b}</Text>
              <Text style={{ flex: 1, borderRight: '1pt solid #000', textAlign: 'center' }}>{comments?.behaviors?.[b] || '-'}</Text>
              <Text style={{ flex: 1, paddingLeft: 3 }}>Rating Scale (1-5)</Text>
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

// ==================== CENTRAL ADMIN ====================
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
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', uid);
      if (error) throw error;
      alert("Staff Record Updated!"); load(); setSelectedUser(null);
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex justify-between items-center bg-indigo-900 text-white p-6 rounded-2xl mb-8">
        <h1 className="text-2xl font-black flex items-center gap-3"><Shield size={32}/> CENTRAL CONTROL</h1>
        <button onClick={onLogout} className="bg-white/20 px-6 py-2 rounded-xl font-bold">Logout</button>
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
            <h3 className="text-xl font-black mb-6">Manage Staff: {selectedUser.full_name}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400">ASSIGN ROLE</label>
                <select className="w-full border-2 p-3 rounded-xl mt-1" defaultValue={selectedUser.role} onChange={(e) => updateStaff(selectedUser.id, { role: e.target.value })}>
                  <option value="teacher">Teacher</option><option value="admin">School Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">TRANSFER SCHOOL</label>
                <select className="w-full border-2 p-3 rounded-xl mt-1" defaultValue={selectedUser.school_id} onChange={(e) => updateStaff(selectedUser.id, { school_id: e.target.value })}>
                  <option value="">Select School</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={() => setSelectedUser(null)} className="w-full py-3 text-slate-400 font-bold mt-4">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== TEACHER DASHBOARD ====================
const TeacherDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState(null);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [currentResults, setCurrentResults] = useState([]);
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

  const selectStu = async (s) => {
    setSelectedStudent(s); setSide(false);
    const { data: rs } = await supabase.from('results').select('*, subjects(name)').eq('student_id', s.id);
    const { data: co } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle();
    setCurrentResults(rs || []);
    setScores(rs?.reduce((a, r) => ({ ...a, [r.subject_id]: r.scores }), {}) || {});
    setCommentData(co || { behaviors: {}, submission_status: 'draft' });
  };

  const handleScoreChange = (subId, field, val) => {
    const current = scores[subId] || {};
    setScores({ ...scores, [subId]: { ...current, [field]: val } });
  };

  const save = async () => {
    const ups = subjects.map(s => {
      const sc = scores[s.id] || {};
      const total = (parseFloat(sc.ca)||0) + (parseFloat(sc.exam)||0);
      return { student_id: selectedStudent.id, subject_id: s.id, scores: sc, total };
    });
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(ups);
    await supabase.from('comments').upsert({ 
      student_id: selectedStudent.id, 
      school_id: school.id, 
      tutor_comment: commentData.tutor_comment, 
      behaviors: commentData.behaviors, 
      submission_status: 'pending' 
    });
    alert("Results Uploaded!"); selectStu(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-white">
      <div className={`fixed lg:static inset-y-0 left-0 w-72 bg-slate-900 text-white p-6 transition-transform z-40 ${side ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-10"><h1 className="text-xl font-black text-blue-400 flex items-center gap-2"><School/> {school?.name}</h1><button onClick={()=>setSide(false)} className="lg:hidden"><X/></button></div>
        <select className="w-full bg-slate-800 p-3 rounded-xl text-sm mb-6" onChange={(e)=>loadClass(e.target.value)}>
          <option value="">Select Class</option>
          {classList.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {students.map(s => (
          <div key={s.id} onClick={()=>selectStu(s)} className={`p-3 cursor-pointer rounded-xl mb-1 text-sm ${selectedStudent?.id === s.id ? 'bg-blue-600 shadow-lg' : 'hover:bg-white/5'}`}>{s.name}</div>
        ))}
        <button onClick={onLogout} className="mt-auto flex items-center gap-3 text-red-400 font-bold p-3 hover:bg-red-400/10 rounded-xl w-full transition"><LogOut size={20}/> Logout</button>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50">
        <div className="p-6 bg-white border-b flex items-center gap-4 shadow-sm">
          <button onClick={()=>setSide(true)} className="lg:hidden"><Menu/></button>
          <div className="flex-1"><h2 className="text-xl font-black">{selectedStudent?.name || "Teacher Portal"}</h2></div>
          {selectedStudent && <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Save Changes</button>}
          {selectedStudent && <button onClick={()=>setPreview('full')} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold">Preview Result</button>}
        </div>

        {selectedStudent && (
          <div className="p-8 max-w-4xl mx-auto w-full">
            <div className="flex gap-4 mb-8">
              <button onClick={()=>setTab('scores')} className={`px-6 py-2 rounded-full font-bold ${tab==='scores' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>Scores (40/60)</button>
              <button onClick={()=>setTab('traits')} className={`px-6 py-2 rounded-full font-bold ${tab==='traits' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>Traits</button>
              <button onClick={()=>setTab('remarks')} className={`px-6 py-2 rounded-full font-bold ${tab==='remarks' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>Comments</button>
            </div>

            {tab === 'scores' && (
              <div className="bg-white rounded-3xl shadow-sm border p-6">
                <table className="w-full">
                  <thead className="text-[10px] text-slate-400 uppercase font-black">
                    <tr><th className="text-left pb-4">Subject</th><th>CA (40)</th><th>Exam (60)</th><th>Total</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {subjects.map(sub => (
                      <tr key={sub.id}>
                        <td className="py-4 font-bold">{sub.name}</td>
                        <td><input type="number" className="w-20 border rounded-lg p-2 text-center" value={scores[sub.id]?.ca || ''} onChange={(e)=>handleScoreChange(sub.id, 'ca', e.target.value)} /></td>
                        <td><input type="number" className="w-20 border rounded-lg p-2 text-center" value={scores[sub.id]?.exam || ''} onChange={(e)=>handleScoreChange(sub.id, 'exam', e.target.value)} /></td>
                        <td className="font-black text-blue-600 text-center">{(parseFloat(scores[sub.id]?.ca)||0) + (parseFloat(scores[sub.id]?.exam)||0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'traits' && (
              <div className="grid grid-cols-2 gap-4">
                {BEHAVIORS.map(b => (
                  <div key={b} className="p-4 bg-white rounded-2xl border flex justify-between items-center">
                    <span className="font-black text-xs">{b}</span>
                    <select className="border p-2 rounded-lg" value={commentData.behaviors?.[b] || ''} onChange={(e)=>setCommentData({...commentData, behaviors: {...commentData.behaviors, [b]: e.target.value}})}>
                      <option value="">Rating</option>
                      {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {tab === 'remarks' && (
              <div className="bg-white p-6 rounded-3xl border">
                <textarea className="w-full h-40 border-2 rounded-2xl p-4" placeholder="Tutor's Comment..." value={commentData.tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})} />
              </div>
            )}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-4">
          <div className="bg-white p-4 flex justify-between rounded-t-3xl">
            <button onClick={()=>setPreview(null)} className="font-black text-red-500">✕ Close</button>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={currentResults} comments={commentData} />} fileName="result.pdf" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Download PDF</PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 rounded-b-3xl border-none"><ResultPDF school={school} student={selectedStudent} results={currentResults} comments={commentData} /></PDFViewer>
        </div>
      )}
    </div>
  );
};

// ==================== SCHOOL ADMIN DASHBOARD ====================
const AdminDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState(null);
  const [tab, setTab] = useState('review');
  const [dataList, setDataList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [commentData, setCommentData] = useState({});

  const loadAll = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    const { data: cl } = await supabase.from('classes').select('*').eq('school_id', profile.school_id);
    setSchool(s); setClasses(cl || []);
    if (tab === 'review') {
        const { data: st } = await supabase.from('students').select('*, classes(name)').eq('school_id', profile.school_id);
        setDataList(st || []);
    } else if (tab === 'classes') {
        setDataList(cl || []);
    } else if (tab === 'subjects') {
        const { data: sub } = await supabase.from('subjects').select('*, classes(name)').eq('classes.school_id', profile.school_id);
        setDataList(sub || []);
    }
  }, [profile.school_id, tab]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addClass = async () => {
    const n = prompt("Enter Class Name (e.g., Year 7 Gold):");
    if(n) { await supabase.from('classes').insert({ name: n, school_id: profile.school_id }); loadAll(); }
  };

  const addSubject = async () => {
    const n = prompt("Enter Subject Name:");
    const cid = prompt("Enter Class ID (Refer to classes list):");
    if(n && cid) { await supabase.from('subjects').insert({ name: n, class_id: cid }); loadAll(); }
  };

  const addStudent = async () => {
    const n = prompt("Student Full Name:");
    const adm = prompt("Admission Number:");
    const cid = prompt("Class ID:");
    if(n && adm && cid) {
        await supabase.from('students').insert({ name: n, admission_no: adm, class_id: cid, school_id: profile.school_id, gender: 'Male' });
        loadAll();
    }
  };

  const deleteItem = async (table, id) => {
    if(window.confirm("Are you sure?")) { await supabase.from(table).delete().eq('id', id); loadAll(); }
  };

  const approveResult = async () => {
    await supabase.from('comments').update({ submission_status: 'approved', principal_comment: commentData.principal_comment }).eq('student_id', selectedStudent.id);
    alert("Result Approved & Published!"); setShowModal(false); loadAll();
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-indigo-950 text-white p-6 flex flex-col">
        <h1 className="font-black text-xl mb-10 flex items-center gap-2 text-indigo-400"><Shield/> ADMIN</h1>
        <button onClick={()=>setTab('review')} className={`p-4 text-left rounded-xl mb-2 font-bold ${tab==='review' ? 'bg-white/10' : ''}`}>Pending Results</button>
        <button onClick={()=>setTab('classes')} className={`p-4 text-left rounded-xl mb-2 font-bold ${tab==='classes' ? 'bg-white/10' : ''}`}>Manage Classes</button>
        <button onClick={()=>setTab('subjects')} className={`p-4 text-left rounded-xl mb-2 font-bold ${tab==='subjects' ? 'bg-white/10' : ''}`}>Manage Subjects</button>
        <button onClick={()=>setTab('setup')} className={`p-4 text-left rounded-xl mb-2 font-bold ${tab==='setup' ? 'bg-white/10' : ''}`}>School Setup</button>
        <button onClick={onLogout} className="mt-auto p-4 flex items-center gap-3 text-red-400 font-black"><LogOut/> Logout</button>
      </div>

      <div className="flex-1 p-10 overflow-auto">
        <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black capitalize">{tab} Management</h2>
            {tab === 'classes' && <button onClick={addClass} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"><Plus/> Add Class</button>}
            {tab === 'subjects' && <button onClick={addSubject} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"><Plus/> Add Subject</button>}
            {tab === 'review' && <button onClick={addStudent} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"><Plus/> Add Student</button>}
        </div>

        {tab === 'setup' ? (
          <div className="bg-white p-12 rounded-[40px] shadow-xl text-center max-w-md mx-auto">
            {school?.logo_url && <img src={school.logo_url} className="h-24 mx-auto mb-6" alt="logo"/>}
            <label className="bg-slate-50 p-8 rounded-3xl border-4 border-dashed block cursor-pointer">
                <Upload className="mx-auto mb-2 text-slate-400"/>
                <span className="font-black text-slate-500 uppercase text-xs">Upload School Logo</span>
                <input type="file" className="hidden" onChange={async (e) => {
                    const file = e.target.files[0];
                    const name = `logo-${Date.now()}`;
                    const { data } = await supabase.storage.from('school-logos').upload(name, file);
                    if(data) {
                        const { data: { publicUrl } } = supabase.storage.from('school-logos').getPublicUrl(data.path);
                        await supabase.from('schools').update({ logo_url: publicUrl }).eq('id', school.id);
                        loadAll();
                    }
                }}/>
            </label>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-[10px] uppercase font-black">
                    <tr>
                        <th className="p-4">Name/ID</th>
                        <th>Class/Info</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {dataList.map(item => (
                        <tr key={item.id} className="border-b hover:bg-slate-50 transition">
                            <td className="p-4 font-bold">{item.name || item.admission_no}</td>
                            <td className="text-slate-500 text-sm">{item.classes?.name || `ID: ${item.id}`}</td>
                            <td className="p-4 flex gap-4">
                                {tab === 'review' ? (
                                    <button onClick={async ()=>{
                                        const { data: co } = await supabase.from('comments').select('*').eq('student_id', item.id).maybeSingle();
                                        setSelectedStudent(item); setCommentData(co || {}); setShowModal(true);
                                    }} className="text-indigo-600 font-bold text-xs uppercase">Review Result</button>
                                ) : (
                                    <button onClick={()=>deleteItem(tab, item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white p-8 rounded-[40px] max-w-2xl w-full">
                  <h3 className="text-2xl font-black mb-6">Reviewing: {selectedStudent.name}</h3>
                  <textarea className="w-full border-2 p-4 h-40 rounded-2xl mb-6" placeholder="Principal's Final Comment..." value={commentData.principal_comment || ''} onChange={(e)=>setCommentData({...commentData, principal_comment: e.target.value})} />
                  <div className="flex gap-4">
                      <button onClick={approveResult} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black">Approve & Publish</button>
                      <button onClick={()=>setShowModal(false)} className="px-8 text-slate-400 font-bold">Cancel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// ==================== AUTH & PORTALS ====================
const Auth = ({ onParent }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);

  useEffect(() => { supabase.from('schools').select('id, name').then(({data}) => setSchools(data || [])); }, []);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if(error) throw error;
      } else {
        const { data: { user }, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if(error) throw error;
        if (mode === 'school_reg') {
          const { data: s } = await supabase.from('schools').insert({ owner_id: user.id, name: form.name }).select().single();
          await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'admin', school_id: s.id });
        } else {
          await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'teacher', school_id: form.schoolId });
        }
        alert("Success! Please check your email for verification.");
      }
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[50px] shadow-2xl max-w-md w-full border-t-[12px] border-blue-600">
        <h1 className="text-4xl font-black text-center mb-10 tracking-tighter text-blue-600 italic">SPRINGFORTH</h1>
        <div className="flex gap-4 mb-8 border-b text-[10px] font-black uppercase tracking-widest pb-3">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={mode === m ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}>{m.replace('_',' ')}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode !== 'login' && <input className="w-full border-2 p-4 rounded-2xl outline-none" placeholder="Full Name" onChange={(e)=>setForm({...form, name: e.target.value})} required />}
          <input className="w-full border-2 p-4 rounded-2xl outline-none" type="email" placeholder="Email" onChange={(e)=>setForm({...form, email: e.target.value})} required />
          <input className="w-full border-2 p-4 rounded-2xl outline-none" type="password" placeholder="Password" onChange={(e)=>setForm({...form, password: e.target.value})} required />
          {mode === 'teacher_reg' && (
            <select className="w-full border-2 p-4 rounded-2xl bg-white outline-none font-bold" onChange={(e)=>setForm({...form, schoolId: e.target.value})} required>
              <option value="">Select School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Enter Portal'}
          </button>
        </form>
        <button onClick={onParent} className="w-full bg-slate-50 py-4 rounded-2xl mt-8 font-black uppercase text-slate-400 flex justify-center items-center gap-3"><Search size={18}/> Parent Portal</button>
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
    if (st && st.comments?.[0]?.submission_status === 'approved') setData(st);
    else alert("Result not yet approved or student ID not found.");
    setLoading(false);
  };

  if (data) return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <button onClick={()=>setData(null)} className="p-6 bg-slate-100 font-black text-slate-600">← BACK TO SEARCH</button>
      <PDFViewer className="flex-1 border-none"><ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} /></PDFViewer>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[50px] shadow-2xl max-sm w-full text-center border">
        <GraduationCap size={80} className="mx-auto text-blue-600 mb-8 bg-blue-50 p-5 rounded-[30px]"/>
        <h2 className="text-3xl font-black mb-8">Parent Portal</h2>
        <input className="w-full border-2 p-5 rounded-3xl mb-4 text-center font-black tracking-widest outline-none focus:border-blue-600 text-lg uppercase" placeholder="ADM-XXXX" onChange={(e)=>setId(e.target.value)} />
        <button onClick={lookup} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : 'View Result'}
        </button>
        <button onClick={onBack} className="mt-8 text-slate-400 block w-full text-xs font-black uppercase">Back to Staff Login</button>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================
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
    supabase.auth.getSession().then(({ data: { session: s } }) => { 
      setSession(s); if (!s) setLoading(false); else loadProfile(s.user.id, s.user.email);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { 
      setSession(s); if (!s) { setProfile(null); setView('auth'); setLoading(false); } else loadProfile(s.user.id, s.user.email);
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  if (profile?.role === 'central_admin') return <CentralAdminDashboard onLogout={() => supabase.auth.signOut()} />;
  if (profile?.role === 'admin') return <AdminDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
  return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;
