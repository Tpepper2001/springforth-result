import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { Loader2, School, LogOut, Users, CheckCircle, Search, Menu, X, Upload, Shield, UserCog, Plus, BookOpen, Trash2, GraduationCap, MapPin, Phone } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
const RATINGS = ['5', '4', '3', '2', '1'];
const CENTRAL_ADMIN_EMAIL = 'admin@admin.com';

// ==================== GRADING LOGIC (40/60) ====================
const getGrade = (score) => {
  if (score >= 80) return { g: 'A', r: 'Excellent' };
  if (score >= 70) return { g: 'B', r: 'Very Good' };
  if (score >= 60) return { g: 'C', r: 'Good' };
  if (score >= 50) return { g: 'P', r: 'Pass' };
  return { g: 'F', r: 'Needs Improvement' };
};

// ==================== PROFESSIONAL PDF STYLES ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1e293b' },
  header: { borderBottom: '2pt solid #4338ca', paddingBottom: 15, marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  logo: { width: 70, height: 70, marginRight: 20 },
  schoolInfo: { flex: 1 },
  schoolName: { fontSize: 22, fontWeight: 'bold', color: '#4338ca', marginBottom: 4 },
  reportTitle: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  bioGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 25, backgroundColor: '#f8fafc', padding: 15, borderRadius: 8 },
  bioItem: { width: '50%', marginBottom: 6 },
  label: { color: '#64748b', fontSize: 8, textTransform: 'uppercase' },
  value: { fontWeight: 'bold', fontSize: 10 },
  table: { marginTop: 10 },
  th: { backgroundColor: '#4338ca', color: '#fff', flexDirection: 'row', padding: 8, fontWeight: 'bold' },
  tr: { flexDirection: 'row', borderBottom: '1pt solid #e2e8f0', padding: 8, alignItems: 'center' },
  td: { flex: 1 },
  tdSubject: { flex: 2, fontWeight: 'bold' },
  center: { textAlign: 'center' },
  behaviorSection: { marginTop: 30 },
  behaviorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  behaviorCard: { width: '31%', padding: 8, border: '1pt solid #e2e8f0', borderRadius: 4 },
  footer: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', borderTop: '1pt solid #e2e8f0', paddingTop: 20 },
  sig: { width: 150, textAlign: 'center' }
});

const ResultPDF = ({ school, student, results = [], comments }) => {
  const totalPoints = results.reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0);
  const avg = results.length > 0 ? (totalPoints / results.length).toFixed(1) : 0;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {school?.logo_url && <Image src={school.logo_url} style={pdfStyles.logo} />}
          <View style={pdfStyles.schoolInfo}>
            <Text style={pdfStyles.schoolName}>{school?.name?.toUpperCase() || 'SPRINGFORTH ACADEMY'}</Text>
            <Text>{school?.address || 'School Address Not Set'}</Text>
            <Text>{school?.contact_info || 'Contact Info Not Set'}</Text>
            <Text style={pdfStyles.reportTitle}>Official Progress Transcript</Text>
          </View>
        </View>

        <View style={pdfStyles.bioGrid}>
          <View style={pdfStyles.bioItem}><Text style={pdfStyles.label}>Student</Text><Text style={pdfStyles.value}>{student?.name}</Text></View>
          <View style={pdfStyles.bioItem}><Text style={pdfStyles.label}>Admission No</Text><Text style={pdfStyles.value}>{student?.admission_no}</Text></View>
          <View style={pdfStyles.bioItem}><Text style={pdfStyles.label}>Academic Class</Text><Text style={pdfStyles.value}>{student?.classes?.name}</Text></View>
          <View style={pdfStyles.bioItem}><Text style={pdfStyles.label}>Summary</Text><Text style={pdfStyles.value}>{avg}% Grade: {getGrade(avg).g}</Text></View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.th}>
            <Text style={pdfStyles.tdSubject}>Course Subject</Text>
            <Text style={[pdfStyles.td, pdfStyles.center]}>CA (40)</Text>
            <Text style={[pdfStyles.td, pdfStyles.center]}>EXAM (60)</Text>
            <Text style={[pdfStyles.td, pdfStyles.center]}>TOTAL</Text>
          </View>
          {results.map((r, i) => (
            <View key={i} style={pdfStyles.tr}>
              <Text style={pdfStyles.tdSubject}>{r.subjects?.name}</Text>
              <Text style={[pdfStyles.td, pdfStyles.center]}>{r.scores?.ca || 0}</Text>
              <Text style={[pdfStyles.td, pdfStyles.center]}>{r.scores?.exam || 0}</Text>
              <Text style={[pdfStyles.td, pdfStyles.center]}>{r.total || 0}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.behaviorSection}>
          <Text style={[pdfStyles.label, { marginBottom: 10 }]}>Behavioral Assessment</Text>
          <View style={pdfStyles.behaviorGrid}>
            {BEHAVIORS.map(b => (
              <View key={b} style={pdfStyles.behaviorCard}>
                <Text style={{ fontSize: 7, color: '#64748b' }}>{b}</Text>
                <Text style={{ fontWeight: 'bold' }}>Rating: {comments?.behaviors?.[b] || '0'}/5</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f8fafc', borderRadius: 5 }}>
          <Text style={pdfStyles.label}>Form Tutor Remark</Text>
          <Text style={{ marginTop: 4 }}>{comments?.tutor_comment || '---'}</Text>
          <Text style={[pdfStyles.label, { marginTop: 10 }]}>Principal Review</Text>
          <Text style={{ marginTop: 4 }}>{comments?.principal_comment || 'Awaiting Principal Approval'}</Text>
        </View>

        <View style={pdfStyles.footer}>
          <View style={pdfStyles.sig}><Text>________________</Text><Text style={pdfStyles.label}>Tutor Signature</Text></View>
          <View style={pdfStyles.sig}><Text>________________</Text><Text style={pdfStyles.label}>Principal Signature</Text></View>
        </View>
      </Page>
    </Document>
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
  const [preview, setPreview] = useState(false);
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

  const deleteRecord = async (table, id) => {
    if (window.confirm("Confirm deletion of this record?")) {
      await supabase.from(table).delete().eq('id', id);
      if (table === 'classes') init();
      else loadClass(selectedClassId);
    }
  };

  const selectStu = async (s) => {
    setSelectedStudent(s); setSide(false);
    const { data: rs } = await supabase.from('results').select('*, subjects(name)').eq('student_id', s.id);
    const { data: co } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle();
    setCurrentResults(rs || []);
    setScores(rs?.reduce((a, r) => ({ ...a, [r.subject_id]: r.scores }), {}) || {});
    setCommentData(co || { behaviors: {}, submission_status: 'draft' });
  };

  const saveResults = async () => {
    const ups = subjects.map(s => {
      const sc = scores[s.id] || { ca: 0, exam: 0 };
      return { student_id: selectedStudent.id, subject_id: s.id, scores: sc, total: (parseFloat(sc.ca)||0) + (parseFloat(sc.exam)||0) };
    });
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(ups);
    await supabase.from('comments').upsert({ student_id: selectedStudent.id, school_id: school.id, tutor_comment: commentData.tutor_comment, behaviors: commentData.behaviors, submission_status: 'pending' });
    alert("Records Updated!"); selectStu(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className={`fixed lg:static inset-y-0 left-0 w-72 bg-indigo-950 text-white p-6 transition-transform z-40 ${side ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-8"><h1 className="text-xl font-black text-indigo-300 flex items-center gap-2"><School/> TEACHER</h1><button onClick={()=>setSide(false)} className="lg:hidden"><X/></button></div>
        
        <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase text-indigo-400"><span>Academic Classes</span><button onClick={async ()=>{const n = prompt("Class Name:"); if(n) {await supabase.from('classes').insert({name:n, school_id:profile.school_id}); init();}}}><Plus size={14}/></button></div>
        <div className="space-y-1 mb-8">
            {classList.map(c => (
                <div key={c.id} className="flex items-center justify-between group">
                    <button onClick={()=>loadClass(c.id)} className={`flex-1 text-left p-2 rounded-lg text-sm ${selectedClassId === c.id ? 'bg-indigo-600' : 'hover:bg-white/5'}`}>{c.name}</button>
                    <button onClick={()=>deleteRecord('classes', c.id)} className="opacity-0 group-hover:opacity-100 p-2 text-indigo-400 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
            ))}
        </div>

        {selectedClassId && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase text-indigo-400">
              <span className="flex items-center gap-2"><Users size={12}/> Students</span>
              <button onClick={async ()=>{const n = prompt("Name:"); if(n) {await supabase.from('students').insert({name:n, class_id:selectedClassId, school_id:profile.school_id, admission_no:`ADM-${Math.floor(Math.random()*9999)}`}); loadClass(selectedClassId);}}}><Plus size={14}/></button>
            </div>
            <div className="space-y-1 mb-6">
              {students.map(s => (
                <div key={s.id} className="flex items-center justify-between group">
                    <button onClick={()=>selectStu(s)} className={`flex-1 text-left p-2 rounded-lg text-sm ${selectedStudent?.id === s.id ? 'bg-indigo-500' : 'hover:bg-white/5'}`}>{s.name}</button>
                    <button onClick={()=>deleteRecord('students', s.id)} className="opacity-0 group-hover:opacity-100 p-2 text-indigo-400 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase text-indigo-400"><span>Course Subjects</span><button onClick={async ()=>{const n = prompt("Subject Name:"); if(n) {await supabase.from('subjects').insert({name:n, class_id:selectedClassId}); loadClass(selectedClassId);}}}><Plus size={14}/></button></div>
            <div className="space-y-1">
              {subjects.map(sub => (
                <div key={sub.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/5 text-sm">
                    <span className="flex items-center gap-2"><BookOpen size={12} className="text-indigo-400"/> {sub.name}</span>
                    <button onClick={()=>deleteRecord('subjects', sub.id)} className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={onLogout} className="mt-8 flex items-center gap-3 text-red-400 font-bold p-3 hover:bg-red-400/10 rounded-xl w-full transition"><LogOut size={20}/> Logout</button>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 bg-white border-b flex items-center gap-4 shadow-sm">
          <button onClick={()=>setSide(true)} className="lg:hidden"><Menu/></button>
          <div className="flex-1"><h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedStudent?.name || "Dashboard"}</h2></div>
          {selectedStudent && <div className="flex gap-3"><button onClick={()=>setPreview(true)} className="bg-slate-100 text-slate-600 px-5 py-2 rounded-xl font-bold flex items-center gap-2"><Search size={18}/> Preview</button><button onClick={saveResults} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100">Save Progress</button></div>}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            {selectedStudent ? (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex gap-8 border-b">
                        {['scores', 'traits'].map(t => <button key={t} onClick={()=>setTab(t)} className={`pb-4 font-black uppercase text-xs tracking-widest ${tab===t ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>{t}</button>)}
                    </div>
                    {tab==='scores' && (
                        <div className="bg-white p-8 rounded-3xl border shadow-sm">
                            <table className="w-full text-left">
                                <thead className="text-[10px] font-black uppercase text-slate-400 border-b"><tr><th className="pb-4">Subject</th><th className="pb-4">CA (40%)</th><th className="pb-4">Exam (60%)</th><th className="pb-4">Total</th></tr></thead>
                                <tbody>
                                    {subjects.map(sub => (
                                        <tr key={sub.id} className="border-b last:border-0">
                                            <td className="py-5 font-bold text-slate-700">{sub.name}</td>
                                            <td><input type="number" className="w-24 border-2 rounded-xl p-2 focus:border-indigo-500 outline-none" value={scores[sub.id]?.ca || ''} onChange={(e)=>setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), ca: e.target.value}})} /></td>
                                            <td><input type="number" className="w-24 border-2 rounded-xl p-2 focus:border-indigo-500 outline-none" value={scores[sub.id]?.exam || ''} onChange={(e)=>setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), exam: e.target.value}})} /></td>
                                            <td className="font-black text-indigo-600">{(parseFloat(scores[sub.id]?.ca)||0) + (parseFloat(scores[sub.id]?.exam)||0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {tab==='traits' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {BEHAVIORS.map(b => (
                                    <div key={b} className="p-4 bg-white rounded-2xl border flex justify-between items-center">
                                        <span className="text-xs font-black text-slate-500 uppercase">{b}</span>
                                        <select className="border-2 rounded-xl p-1 font-bold outline-none focus:border-indigo-500" value={commentData.behaviors?.[b] || ''} onChange={(e)=>setCommentData({...commentData, behaviors: {...commentData.behaviors, [b]: e.target.value}})}>
                                            <option value="">-</option>{RATINGS.map(r=><option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <textarea className="w-full p-6 border-2 rounded-3xl h-40 outline-none focus:border-indigo-500 shadow-sm" placeholder="Write Form Tutor Remark..." value={commentData.tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})} />
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <CheckCircle size={80} className="mb-4 opacity-10"/>
                    <p className="font-black uppercase tracking-widest text-sm">Select a student or class to begin entry</p>
                </div>
            )}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col p-4 backdrop-blur-md">
          <div className="bg-white p-4 flex justify-between rounded-t-3xl border-b shadow-xl">
            <button onClick={()=>setPreview(false)} className="text-red-500 font-black flex items-center gap-2"><X size={20}/> CLOSE PREVIEW</button>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={currentResults} comments={commentData} />} fileName={`Transcript_${selectedStudent?.name}.pdf`} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-900/20 uppercase text-xs">Download Transcript</PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 rounded-b-3xl border-none"><ResultPDF school={school} student={selectedStudent} results={currentResults} comments={commentData} /></PDFViewer>
        </div>
      )}
    </div>
  );
};

// ==================== SCHOOL ADMIN DASHBOARD ====================
const AdminDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState({});
  const [tab, setTab] = useState('review');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [commentData, setCommentData] = useState({});

  const load = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    const { data: st } = await supabase.from('students').select('*, classes(name)').eq('school_id', profile.school_id);
    setSchool(s || {}); setStudents(st || []);
  }, [profile.school_id]);

  useEffect(() => { load(); }, [load]);

  const updateProfile = async () => {
    await supabase.from('schools').update({ name: school.name, address: school.address, contact_info: school.contact_info }).eq('id', school.id);
    alert("School Profile Updated!");
  };

  const onLogoUpload = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    const path = `logo-${Date.now()}`;
    const { data } = await supabase.storage.from('school-logos').upload(path, file);
    if(data) {
        const { data: { publicUrl } } = supabase.storage.from('school-logos').getPublicUrl(data.path);
        await supabase.from('schools').update({ logo_url: publicUrl }).eq('id', school.id);
        load();
    }
  };

  const approve = async () => {
    await supabase.from('comments').update({ submission_status: 'approved', principal_comment: commentData.principal_comment }).eq('student_id', selectedStudent.id);
    alert("Transcript Approved!"); setSelectedStudent(null); load();
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h1 className="text-xl font-black mb-10 flex items-center gap-2"><Shield className="text-indigo-400"/> SYSTEM</h1>
        <button onClick={()=>setTab('review')} className={`p-4 text-left rounded-2xl mb-2 flex items-center gap-3 font-bold ${tab==='review' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-white/5'}`}><CheckCircle size={20}/> Approvals</button>
        <button onClick={()=>setTab('setup')} className={`p-4 text-left rounded-2xl mb-2 flex items-center gap-3 font-bold ${tab==='setup' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-white/5'}`}><School size={20}/> Settings</button>
        <button onClick={onLogout} className="mt-auto p-4 flex items-center gap-3 text-red-400 font-bold hover:bg-red-400/10 rounded-2xl transition"><LogOut size={20}/> Logout</button>
      </div>
      <div className="flex-1 p-10 overflow-y-auto">
        {tab === 'setup' ? (
          <div className="max-w-2xl bg-white p-12 rounded-[40px] shadow-sm border mx-auto">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-2 text-slate-800">School Identity</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                {school.logo_url ? <img src={school.logo_url} className="h-20 w-20 rounded-xl object-contain bg-white shadow-sm border" alt="logo"/> : <div className="h-20 w-20 bg-white rounded-xl flex items-center justify-center border shadow-sm"><School className="text-slate-300"/></div>}
                <label className="flex-1 cursor-pointer">
                    <span className="flex items-center gap-2 bg-white border-2 p-3 rounded-2xl font-black text-xs uppercase justify-center hover:bg-indigo-50 transition border-indigo-100 text-indigo-600"><Upload size={16}/> Update School Logo</span>
                    <input type="file" className="hidden" onChange={onLogoUpload} accept="image/*" />
                </label>
              </div>
              <div className="space-y-4">
                <label className="block"><span className="text-[10px] font-black uppercase text-slate-400 ml-1">Official Name</span><input className="w-full border-2 p-4 rounded-2xl mt-1 outline-none focus:border-indigo-500 font-bold" value={school.name || ''} onChange={(e)=>setSchool({...school, name: e.target.value})} /></label>
                <label className="block"><span className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><MapPin size={12}/> Street Address</span><input className="w-full border-2 p-4 rounded-2xl mt-1 outline-none focus:border-indigo-500 font-bold" value={school.address || ''} onChange={(e)=>setSchool({...school, address: e.target.value})} /></label>
                <label className="block"><span className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Phone size={12}/> Contact Line</span><input className="w-full border-2 p-4 rounded-2xl mt-1 outline-none focus:border-indigo-500 font-bold" value={school.contact_info || ''} onChange={(e)=>setSchool({...school, contact_info: e.target.value})} /></label>
              </div>
              <button onClick={updateProfile} className="w-full bg-indigo-600 text-white py-5 rounded-[25px] font-black shadow-xl shadow-indigo-100 uppercase tracking-widest hover:scale-[1.01] transition">Sync Identity Updates</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[35px] border shadow-sm overflow-hidden">
            <div className="p-8 border-b bg-slate-50 font-black text-slate-700 flex items-center justify-between"><span>Active Review Pipeline</span><span className="bg-white border text-[10px] px-3 py-1 rounded-full">{students.length} PENDING</span></div>
            <div className="divide-y">
                {students.map(s => (
                <div key={s.id} onClick={async () => {const { data: co } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle(); setSelectedStudent(s); setCommentData(co || {}); }} className="p-6 hover:bg-indigo-50/30 cursor-pointer flex justify-between items-center transition">
                    <div><p className="font-black text-slate-800">{s.name}</p><p className="text-xs font-bold text-slate-400 uppercase">{s.classes?.name}</p></div>
                    <span className="text-indigo-600 font-black text-xs uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl">Process Transcript →</span>
                </div>
                ))}
            </div>
          </div>
        )}
      </div>
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-10 rounded-[45px] w-full max-w-xl shadow-2xl">
            <h3 className="text-2xl font-black mb-2 text-slate-800">Final Validation</h3>
            <p className="text-sm font-bold text-slate-400 uppercase mb-8">Validating Transcript for: {selectedStudent.name}</p>
            <textarea className="w-full border-2 p-6 h-40 rounded-3xl mb-8 outline-none focus:border-indigo-500 shadow-sm" placeholder="Append Principal's formal commentary..." value={commentData.principal_comment || ''} onChange={(e)=>setCommentData({...commentData, principal_comment: e.target.value})} />
            <div className="flex gap-4">
              <button onClick={approve} className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-lg shadow-indigo-100 uppercase tracking-widest">Approve & Release</button>
              <button onClick={()=>setSelectedStudent(null)} className="px-8 font-black text-slate-300 uppercase text-sm">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== SYSTEM CORE ====================
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
      alert("System Registry Updated!"); load(); setSelectedUser(null);
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-[35px] mb-8 shadow-2xl">
        <h1 className="text-2xl font-black flex items-center gap-3"><Shield className="text-indigo-400" size={32}/> GLOBAL OVERSEER</h1>
        <button onClick={onLogout} className="bg-white/10 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/20 transition">Logout</button>
      </div>
      <div className="bg-white rounded-[40px] shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] font-black uppercase tracking-widest"><tr><th className="p-6">Employee</th><th>Institution</th><th>Clearance</th><th>Ops</th></tr></thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="p-6 font-black text-slate-700">{u.full_name}</td>
                <td className="font-bold text-slate-500">{u.schools?.name || '---'}</td>
                <td><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-tighter">{u.role}</span></td>
                <td><button onClick={() => setSelectedUser(u)} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition"><UserCog size={20}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white p-10 rounded-[45px] w-full max-w-sm shadow-2xl border-4 border-indigo-50">
            <h3 className="text-xl font-black mb-8 text-center">User Credentials</h3>
            <div className="space-y-6">
              <label className="block"><span className="text-[10px] font-black text-slate-400 uppercase ml-1">Access Level</span>
                <select className="w-full border-2 p-4 rounded-2xl font-bold mt-1" defaultValue={selectedUser.role} onChange={(e) => updateStaff(selectedUser.id, { role: e.target.value })}>
                    <option value="teacher">Teacher</option><option value="admin">Principal Admin</option>
                </select>
              </label>
              <label className="block"><span className="text-[10px] font-black text-slate-400 uppercase ml-1">Institution Binding</span>
                <select className="w-full border-2 p-4 rounded-2xl font-bold mt-1" defaultValue={selectedUser.school_id} onChange={(e) => updateStaff(selectedUser.id, { school_id: e.target.value })}>
                    <option value="">Detached</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <button onClick={() => setSelectedUser(null)} className="w-full py-4 text-slate-300 font-black uppercase text-xs tracking-widest mt-4">Dismiss</button>
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
      if (mode === 'login') await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      else {
        const { data: { user } } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (mode === 'school_reg') {
          const { data: s } = await supabase.from('schools').insert({ owner_id: user.id, name: form.name }).select().single();
          await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'admin', school_id: s.id });
        } else {
          await supabase.from('profiles').insert({ id: user.id, full_name: form.name, role: 'teacher', school_id: form.schoolId });
        }
        alert("Account Created! Check email.");
      }
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[55px] shadow-2xl max-w-md w-full border-t-8 border-indigo-600">
        <h1 className="text-4xl font-black text-center mb-10 text-indigo-600 italic tracking-tighter">SPRINGFORTH</h1>
        <div className="flex gap-4 mb-8 border-b text-[10px] font-black uppercase pb-4 overflow-x-auto">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={mode === m ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}>{m.replace('_',' ')}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode !== 'login' && <input className="w-full border-2 p-4 rounded-3xl outline-none" placeholder="Full Professional Name" onChange={(e)=>setForm({...form, name: e.target.value})} required />}
          <input className="w-full border-2 p-4 rounded-3xl outline-none" type="email" placeholder="Email Address" onChange={(e)=>setForm({...form, email: e.target.value})} required />
          <input className="w-full border-2 p-4 rounded-3xl outline-none" type="password" placeholder="Secure Password" onChange={(e)=>setForm({...form, password: e.target.value})} required />
          {mode === 'teacher_reg' && (
            <select className="w-full border-2 p-4 rounded-3xl bg-white font-bold outline-none" onChange={(e)=>setForm({...form, schoolId: e.target.value})} required>
              <option value="">Binding Institution</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-indigo-100 uppercase tracking-widest mt-4">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Enter Environment'}
          </button>
        </form>
        <button onClick={onParent} className="w-full bg-slate-50 py-5 rounded-3xl mt-8 font-black uppercase text-slate-400 flex justify-center items-center gap-3 transition hover:bg-slate-100"><Search size={18}/> Parent Gateway</button>
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
    else alert("Transcript not finalized or ID invalid.");
    setLoading(false);
  };

  if (data) return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <button onClick={()=>setData(null)} className="p-8 bg-slate-900 text-white font-black flex items-center gap-4 uppercase tracking-[0.2em] text-xs">← Return to Search Gateway</button>
      <PDFViewer className="flex-1 border-none"><ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} /></PDFViewer>
    </div>
  );

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
      <div className="bg-white p-14 rounded-[60px] shadow-2xl max-w-md w-full text-center">
        <GraduationCap size={75} className="mx-auto text-indigo-600 mb-8 p-4 bg-indigo-50 rounded-[25px]"/>
        <h2 className="text-3xl font-black mb-2 text-slate-800 tracking-tight">Parent Gateway</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Transcript Retrieval Service</p>
        <input className="w-full border-2 p-6 rounded-[30px] mb-4 text-center font-black tracking-[0.2em] text-xl uppercase outline-none focus:border-indigo-600" placeholder="ADM-XXXX" onChange={(e)=>setId(e.target.value)} />
        <button onClick={lookup} className="w-full bg-indigo-600 text-white py-6 rounded-[30px] font-black shadow-2xl shadow-indigo-200 transition active:scale-95 uppercase tracking-widest">
          {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Access Transcript'}
        </button>
        <button onClick={onBack} className="mt-10 text-slate-400 block w-full text-xs font-black uppercase hover:underline tracking-[0.2em]">Staff Login</button>
      </div>
    </div>
  );
};

// ==================== APP BOOTSTRAP ====================
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" size={50}/></div>;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  if (profile?.role === 'central_admin') return <CentralAdminDashboard onLogout={() => supabase.auth.signOut()} />;
  if (profile?.role === 'admin') return <AdminDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
  return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;
