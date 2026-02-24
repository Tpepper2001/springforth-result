import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image, pdf } from '@react-pdf/renderer';
import { Loader2, School, LogOut, Users, CheckCircle, Search, Menu, X, Upload, Shield, UserCog, Plus, BookOpen, Trash2, GraduationCap, MapPin, Phone, Archive } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// ==================== CONFIGURATION ====================
const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['RESPECT', 'RESPONSIBILITY', 'EMPATHY', 'SELF DISCIPLINE', 'COOPERATION', 'LEADERSHIP', 'HONESTY'];
const RATINGS = ['5', '4', '3', '2', '1'];
const CENTRAL_ADMIN_EMAIL = 'admin@admin.com';

// ==================== GRADING LOGIC ====================
const getGrade = (score, max) => {
  const percent = (score / max) * 100;
  if (percent >= 80) return { g: 'A', r: 'Excellent' };
  if (percent >= 70) return { g: 'B', r: 'Very Good' };
  if (percent >= 60) return { g: 'C', r: 'Good' };
  if (percent >= 50) return { g: 'P', r: 'Pass' };
  return { g: 'F', r: 'Needs Improvement' };
};

// ==================== PDF STYLES ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#334155' },
  header: { borderBottom: '2pt solid #4338ca', paddingBottom: 15, marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  logo: { width: 65, height: 65, marginRight: 15 },
  schoolInfo: { flex: 1 },
  schoolName: { fontSize: 20, fontWeight: 'bold', color: '#4338ca', marginBottom: 2 },
  subHeader: { fontSize: 8, color: '#64748b', marginBottom: 2 },
  reportBadge: { marginTop: 5, fontSize: 8, fontWeight: 'bold', color: '#4338ca' },
  bioSection: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  bioBox: { flex: 1, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, border: '0.5pt solid #e2e8f0' },
  bioRow: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 70, color: '#64748b', fontSize: 7, textTransform: 'uppercase', fontWeight: 'bold' },
  value: { flex: 1, fontWeight: 'bold', fontSize: 9, color: '#1e293b' },
  table: { marginTop: 5, border: '0.5pt solid #e2e8f0', borderRadius: 4, overflow: 'hidden' },
  th: { backgroundColor: '#4338ca', color: '#ffffff', flexDirection: 'row', padding: 8, fontWeight: 'bold', fontSize: 8 },
  tr: { flexDirection: 'row', borderBottom: '0.5pt solid #e2e8f0', padding: 7, alignItems: 'center' },
  tdSubject: { flex: 3, fontWeight: 'bold' },
  td: { flex: 1, textAlign: 'center' },
  behaviorTitle: { fontSize: 8, fontWeight: 'bold', color: '#4338ca', marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
  behaviorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  behaviorItem: { width: '23%', padding: 6, backgroundColor: '#f8fafc', borderRadius: 4, border: '0.5pt solid #e2e8f0' },
  remarksBox: { marginTop: 20, padding: 12, border: '0.5pt solid #e2e8f0', borderRadius: 8, backgroundColor: '#ffffff' },
  remarksHeader: { fontSize: 7, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  remarksText: { fontSize: 9, lineHeight: 1.4, color: '#334155' },
  footer: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 20 },
  sigLine: { borderTop: '0.5pt solid #334155', width: 140, textAlign: 'center', paddingTop: 5 },
  sigText: { fontSize: 7, color: '#64748b', textTransform: 'uppercase' },
  footnote: { fontSize: 6, color: '#ef4444', textAlign: 'center', marginTop: 15, fontStyle: 'italic' }
});

const ResultPDF = ({ school, student, results = [], comments, type = 'full' }) => {
  const isMid = type === 'mid';
  const totalScore = results.reduce((acc, r) => acc + (parseFloat(isMid ? r.scores?.ca : r.total) || 0), 0);
  const possible = (results?.length || 0) * (isMid ? 40 : 100);
  const avg = results?.length > 0 ? ((totalScore / possible) * 100).toFixed(1) : 0;
  const isApproved = comments?.submission_status === 'approved';

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {school?.logo_url && <Image src={school.logo_url} style={pdfStyles.logo} />}
          <View style={pdfStyles.schoolInfo}>
            <Text style={pdfStyles.schoolName}>{school?.name?.toUpperCase() || 'SPRINGFORTH ACADEMY'}</Text>
            <Text style={pdfStyles.subHeader}>{school?.address || 'Address Not Configured'}</Text>
            <Text style={pdfStyles.subHeader}>{school?.contact_info || 'Contact Not Configured'}</Text>
            <Text style={pdfStyles.reportBadge}>{isMid ? 'MID-TERM CA REPORT' : 'TERMINAL ACADEMIC REPORT'}</Text>
          </View>
        </View>

        <View style={pdfStyles.bioSection}>
          <View style={pdfStyles.bioBox}>
            <View style={pdfStyles.bioRow}><Text style={pdfStyles.label}>Student</Text><Text style={pdfStyles.value}>{student?.name}</Text></View>
            <View style={pdfStyles.bioRow}><Text style={pdfStyles.label}>Adm No</Text><Text style={pdfStyles.value}>{student?.admission_no}</Text></View>
            <View style={pdfStyles.bioRow}><Text style={pdfStyles.label}>Class</Text><Text style={pdfStyles.value}>{student?.classes?.name || '---'}</Text></View>
          </View>
          <View style={pdfStyles.bioBox}>
            <View style={pdfStyles.bioRow}><Text style={pdfStyles.label}>Average</Text><Text style={pdfStyles.value}>{avg}%</Text></View>
            <View style={pdfStyles.bioRow}><Text style={pdfStyles.label}>Grade</Text><Text style={pdfStyles.value}>{getGrade(totalScore, possible).g}</Text></View>
            <View style={pdfStyles.bioRow}><Text style={pdfStyles.label}>Term</Text><Text style={pdfStyles.value}>2025/2026 Session</Text></View>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.th}>
            <Text style={pdfStyles.tdSubject}>Academic Subjects</Text>
            <Text style={pdfStyles.td}>CA (40)</Text>
            {!isMid && <Text style={pdfStyles.td}>EXAM (60)</Text>}
            <Text style={pdfStyles.td}>TOTAL</Text>
            <Text style={pdfStyles.td}>GRADE</Text>
          </View>
          {results.map((r, i) => {
            const rowTotal = isMid ? r.scores?.ca : r.total;
            const rowMax = isMid ? 40 : 100;
            return (
              <View key={i} style={pdfStyles.tr}>
                <Text style={pdfStyles.tdSubject}>{r.subjects?.name || 'Subject'}</Text>
                <Text style={pdfStyles.td}>{r.scores?.ca || 0}</Text>
                {!isMid && <Text style={pdfStyles.td}>{r.scores?.exam || 0}</Text>}
                <Text style={pdfStyles.td}>{rowTotal || 0}</Text>
                <Text style={pdfStyles.td}>{getGrade(rowTotal, rowMax).g}</Text>
              </View>
            );
          })}
        </View>

        <Text style={pdfStyles.behaviorTitle}>Behavioral Traits & Personal Development</Text>
        <View style={pdfStyles.behaviorGrid}>
          {BEHAVIORS.map(b => (
            <View key={b} style={pdfStyles.behaviorItem}>
              <Text style={{ fontSize: 6, color: '#64748b', marginBottom: 2 }}>{b}</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 9 }}>{comments?.behaviors?.[b] || '-'}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.remarksBox}>
          <Text style={pdfStyles.remarksHeader}>Form Tutor's Remark</Text>
          <Text style={pdfStyles.remarksText}>{comments?.tutor_comment || '---'}</Text>
        </View>

        <View style={pdfStyles.remarksBox}>
          <Text style={pdfStyles.remarksHeader}>Principal's Remark</Text>
          <Text style={pdfStyles.remarksText}>{comments?.principal_comment || (isApproved ? 'Approved' : '---')}</Text>
        </View>

        <View style={pdfStyles.footer}>
          <View style={pdfStyles.sigLine}><Text style={pdfStyles.sigText}>Form Tutor</Text></View>
          <View style={pdfStyles.sigLine}><Text style={pdfStyles.sigText}>Principal</Text></View>
        </View>
        
        {!isApproved && <Text style={pdfStyles.footnote}>* result not approved</Text>}
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
  const [preview, setPreview] = useState(null);
  const [tab, setTab] = useState('scores');
  const [side, setSide] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const init = useCallback(async () => {
    let schoolId = profile?.school_id;
    if (!schoolId) {
      const { data: fallbackSchools } = await supabase.from('schools').select('id').limit(1);
      if (fallbackSchools && fallbackSchools.length > 0) schoolId = fallbackSchools[0].id;
    }
    if (!schoolId) return;
    const { data: s } = await supabase.from('schools').select('*').eq('id', schoolId).maybeSingle();
    const { data: c } = await supabase.from('classes').select('*').eq('school_id', schoolId).order('name');
    setSchool(s); setClassList(c || []);
  }, [profile.school_id]);

  useEffect(() => { init(); }, [init]);

  const loadClass = async (id) => {
    setSelectedClassId(id);
    const { data: st } = await supabase.from('students').select('*, classes(name)').eq('class_id', id);
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

  const saveResults = async () => {
    try {
        const ups = subjects.map(s => {
          const sc = scores[s.id] || { ca: 0, exam: 0 };
          return { student_id: selectedStudent.id, subject_id: s.id, scores: sc, total: (parseFloat(sc.ca)||0) + (parseFloat(sc.exam)||0) };
        });
        await supabase.from('results').delete().eq('student_id', selectedStudent.id);
        await supabase.from('results').insert(ups);
        
        const commentPayload = { 
          student_id: selectedStudent.id, 
          school_id: school.id, 
          tutor_comment: commentData.tutor_comment, 
          behaviors: commentData.behaviors, 
          submission_status: 'pending' 
        };
        if (commentData.id) commentPayload.id = commentData.id;

        await supabase.from('comments').upsert(commentPayload, { onConflict: 'student_id' });
        
        alert("Saved Successfully!"); selectStu(selectedStudent);
    } catch (e) { alert("Error saving: " + e.message); }
  };

  const downloadAllMidtermsAsZip = async () => {
    if (!selectedClassId || students.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const currentClassName = classList.find(c => c.id === selectedClassId)?.name || 'Class';

      // Fetch ALL results and comments for this class's students
      const { data: allResults } = await supabase.from('results').select('*, subjects(*)').in('student_id', students.map(s => s.id));
      const { data: allComments } = await supabase.from('comments').select('*').in('student_id', students.map(s => s.id));

      for (const student of students) {
        const studentResults = allResults.filter(r => r.student_id === student.id);
        const studentComments = allComments.find(c => c.student_id === student.id) || { behaviors: {} };
        
        const blob = await pdf(
          <ResultPDF 
            school={school} 
            student={student} 
            results={studentResults} 
            comments={studentComments} 
            type="mid" 
          />
        ).toBlob();
        
        zip.file(`${student.name.replace(/\s+/g, '_')}_MidTerm.pdf`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${currentClassName}_MidTerm_Results.zip`);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className={`fixed lg:static inset-y-0 left-0 w-72 bg-indigo-950 text-white p-6 transition-transform z-40 ${side ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-8"><h1 className="text-xl font-black text-indigo-300 flex items-center gap-2"><School/> TEACHER</h1><button onClick={()=>setSide(false)} className="lg:hidden"><X/></button></div>
        
        <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase text-indigo-400">
          <span>Classes</span>
          <button onClick={async ()=>{
            const n = prompt("Enter Class Name:"); 
            if(!n) return;
            const targetId = profile?.school_id || school?.id;
            const { error } = await supabase.from('classes').insert({ name: n, school_id: targetId });
            if(error) alert(error.message); else await init();
          }}><Plus size={14}/></button>
        </div>

        <div className="space-y-1 mb-8">
            {classList.map(c => (<div key={c.id} className="flex items-center justify-between group"><button onClick={()=>loadClass(c.id)} className={`flex-1 text-left p-2 rounded-lg text-sm ${selectedClassId === c.id ? 'bg-indigo-600' : 'hover:bg-white/5'}`}>{c.name}</button><button onClick={async ()=>{if(window.confirm("Delete Class?")){await supabase.from('classes').delete().eq('id', c.id); await init();}}} className="opacity-0 group-hover:opacity-100 p-2 text-red-400"><Trash2 size={14}/></button></div>))}
        </div>

        {selectedClassId && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase text-indigo-400"><span><Users size={12} className="inline mr-1"/> Students</span><button onClick={async ()=>{const n = prompt("Name:"); if(n) { const targetId = profile?.school_id || school?.id; const { error } = await supabase.from('students').insert([{name:n, class_id:selectedClassId, school_id: targetId, admission_no:`ADM-${Math.floor(Math.random()*9999)}`}]); if(error) alert(error.message); else await loadClass(selectedClassId);}}}><Plus size={14}/></button></div>
            <div className="space-y-1 mb-6">{students.map(s => (<div key={s.id} className="flex items-center justify-between group"><button onClick={()=>selectStu(s)} className={`flex-1 text-left p-2 rounded-lg text-sm ${selectedStudent?.id === s.id ? 'bg-indigo-500' : 'hover:bg-white/5'}`}>{s.name}</button><button onClick={async ()=>{if(window.confirm("Delete Student?")){await supabase.from('students').delete().eq('id', s.id); await loadClass(selectedClassId);}}} className="opacity-0 group-hover:opacity-100 p-2 text-red-400"><Trash2 size={14}/></button></div>))}</div>
            <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase text-indigo-400"><span><BookOpen size={12} className="inline mr-1"/> Subjects</span><button onClick={async ()=>{const n = prompt("Subject Name:"); if(n) { const { error } = await supabase.from('subjects').insert([{name:n, class_id:selectedClassId}]); if(error) alert(error.message); else await loadClass(selectedClassId);}}}><Plus size={14}/></button></div>
            <div className="space-y-1">{subjects.map(sub => (<div key={sub.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/5 text-sm"><span>{sub.name}</span><button onClick={async ()=>{if(window.confirm("Delete Subject?")){await supabase.from('subjects').delete().eq('id', sub.id); await loadClass(selectedClassId);}}} className="opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={14}/></button></div>))}</div>
          </div>
        )}
        <button onClick={onLogout} className="mt-8 flex items-center gap-3 text-red-400 font-bold p-3 hover:bg-red-400/10 rounded-xl w-full transition"><LogOut size={20}/> Logout</button>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 bg-white border-b flex items-center gap-4">
          <button onClick={()=>setSide(true)} className="lg:hidden"><Menu/></button>
          <div className="flex-1 text-indigo-900 font-bold uppercase tracking-widest text-sm">{school?.name || "Loading Institution..."}</div>
          
          {selectedClassId && !selectedStudent && (
             <button 
               onClick={downloadAllMidtermsAsZip} 
               disabled={isZipping}
               className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-tighter flex items-center gap-2"
             >
               {isZipping ? <Loader2 className="animate-spin" size={14}/> : <Archive size={14}/>}
               {isZipping ? 'Generating ZIP...' : 'Download All Mid-term (ZIP)'}
             </button>
          )}

          {selectedStudent && (
            <div className="flex gap-2">
              <button onClick={()=>setPreview('mid')} className="bg-slate-100 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-tighter">Mid-Term Preview</button>
              <button onClick={()=>setPreview('full')} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-tighter">Full Report Preview</button>
              <button onClick={saveResults} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100">Save Progress</button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-8">
            {selectedStudent ? (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex gap-8 border-b">{['scores', 'traits'].map(t => <button key={t} onClick={()=>setTab(t)} className={`pb-4 font-black uppercase text-xs tracking-widest ${tab===t ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>{t}</button>)}</div>
                    {tab==='scores' && (
                        <div className="bg-white p-8 rounded-3xl border shadow-sm">
                            <table className="w-full text-left">
                                <thead className="text-[10px] font-black uppercase text-slate-400 border-b"><tr><th className="pb-4">Subject</th><th className="pb-4">CA (40%)</th><th className="pb-4">Exam (60%)</th><th className="pb-4">Total</th></tr></thead>
                                <tbody>{subjects.map(sub => (<tr key={sub.id} className="border-b last:border-0"><td className="py-5 font-bold text-slate-700">{sub.name}</td><td><input type="number" className="w-24 border-2 rounded-xl p-2 focus:border-indigo-500 outline-none" value={scores[sub.id]?.ca || ''} onChange={(e)=>setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), ca: e.target.value}})} /></td><td><input type="number" className="w-24 border-2 rounded-xl p-2 focus:border-indigo-500 outline-none" value={scores[sub.id]?.exam || ''} onChange={(e)=>setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), exam: e.target.value}})} /></td><td className="font-black text-indigo-600">{(parseFloat(scores[sub.id]?.ca)||0) + (parseFloat(scores[sub.id]?.exam)||0)}</td></tr>))}</tbody>
                            </table>
                        </div>
                    )}
                    {tab==='traits' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">{BEHAVIORS.map(b => (<div key={b} className="p-4 bg-white rounded-2xl border flex justify-between items-center"><span className="text-xs font-black text-slate-500 uppercase">{b}</span><select className="border-2 rounded-xl p-1 font-bold outline-none focus:border-indigo-500" value={commentData.behaviors?.[b] || ''} onChange={(e)=>setCommentData({...commentData, behaviors: {...commentData.behaviors, [b]: e.target.value}})}><option value="">-</option>{RATINGS.map(r=><option key={r} value={r}>{r}</option>)}</select></div>))}</div>
                            <textarea className="w-full p-6 border-2 rounded-3xl h-40 outline-none focus:border-indigo-500 shadow-sm" placeholder="Form Tutor Remark..." value={commentData.tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})} />
                        </div>
                    )}
                </div>
            ) : (<div className="h-full flex flex-col items-center justify-center text-slate-300"><CheckCircle size={80} className="mb-4 opacity-10"/><p className="font-black uppercase tracking-widest text-sm">Select a student or class to begin</p></div>)}
        </div>
      </div>
      {preview && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col p-4 backdrop-blur-md">
          <div className="bg-white p-4 flex justify-between rounded-t-3xl border-b shadow-xl">
            <button onClick={()=>setPreview(null)} className="text-red-500 font-black flex items-center gap-2"><X size={20}/> CLOSE PREVIEW</button>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={currentResults} comments={commentData} type={preview} />} fileName={`Transcript_${selectedStudent?.name}.pdf`} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg uppercase text-xs">Download Result</PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 rounded-b-3xl border-none"><ResultPDF school={school} student={selectedStudent} results={currentResults} comments={commentData} type={preview} /></PDFViewer>
        </div>
      )}
    </div>
  );
};

// ==================== ADMIN DASHBOARD ====================
const AdminDashboard = ({ profile, onLogout }) => {
  const [school, setSchool] = useState({});
  const [tab, setTab] = useState('review');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [commentData, setCommentData] = useState({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    const { data: st } = await supabase.from('students').select('*, classes(name)').eq('school_id', profile.school_id);
    setSchool(s || {}); setStudents(st || []);
  }, [profile.school_id]);

  useEffect(() => { load(); }, [load]);

  const approve = async () => {
    await supabase.from('comments').update({ submission_status: 'approved', principal_comment: commentData.principal_comment }).eq('student_id', selectedStudent.id);
    alert("Result Approved!"); setSelectedStudent(null); await load();
  };

  const onLogoUpload = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    setLoading(true);
    try {
        const path = `logo-${Date.now()}`;
        const { data, error } = await supabase.storage.from('school-logos').upload(path, file);
        if(error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('school-logos').getPublicUrl(data.path);
        await supabase.from('schools').update({ logo_url: publicUrl }).eq('id', school.id);
        await load();
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h1 className="text-xl font-black mb-10 flex items-center gap-2"><Shield className="text-indigo-400"/> ADMIN</h1>
        <button onClick={()=>setTab('review')} className={`p-4 text-left rounded-2xl mb-2 flex items-center gap-3 font-bold transition ${tab==='review' ? 'bg-indigo-600' : 'hover:bg-white/5'}`}><CheckCircle size={20}/> Approvals</button>
        <button onClick={()=>setTab('setup')} className={`p-4 text-left rounded-2xl mb-2 flex items-center gap-3 font-bold transition ${tab==='setup' ? 'bg-indigo-600' : 'hover:bg-white/5'}`}><School size={20}/> Profile</button>
        <button onClick={onLogout} className="mt-auto p-4 flex items-center gap-3 text-red-400 font-bold"><LogOut size={20}/> Logout</button>
      </div>
      <div className="flex-1 p-10 overflow-y-auto">
        {tab === 'setup' ? (
          <div className="max-w-2xl bg-white p-10 rounded-3xl shadow-sm border mx-auto">
            <h2 className="text-2xl font-black mb-6">School Profile</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border-2 border-dashed">
                {school.logo_url ? <img src={school.logo_url} className="h-16 w-16 object-contain" alt="logo"/> : <School size={32}/>}
                <label className="flex-1 cursor-pointer">
                    <span className="flex items-center gap-2 bg-white border p-3 rounded-xl font-black text-xs uppercase justify-center shadow-sm">
                      {loading ? <Loader2 className="animate-spin"/> : <><Upload size={16}/> Update Logo</>}
                    </span>
                    <input type="file" className="hidden" onChange={onLogoUpload} accept="image/*" />
                </label>
              </div>
              <input className="w-full border-2 p-3 rounded-xl" placeholder="School Name" value={school.name || ''} onChange={(e)=>setSchool({...school, name: e.target.value})} />
              <input className="w-full border-2 p-3 rounded-xl" placeholder="Address" value={school.address || ''} onChange={(e)=>setSchool({...school, address: e.target.value})} />
              <input className="w-full border-2 p-3 rounded-xl" placeholder="Contact" value={school.contact_info || ''} onChange={(e)=>setSchool({...school, contact_info: e.target.value})} />
              <button onClick={async ()=>{await supabase.from('schools').update(school).eq('id', school.id); alert("Updated!");}} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Save Changes</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm">
            <div className="p-6 border-b font-black text-slate-700">Pending Approvals</div>
            {students.map(s => (<div key={s.id} onClick={async () => {const { data: co } = await supabase.from('comments').select('*').eq('student_id', s.id).maybeSingle(); setSelectedStudent(s); setCommentData(co || {}); }} className="p-6 border-b hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition"><div><p className="font-bold">{s.name}</p><p className="text-[10px] uppercase text-slate-400">{s.classes?.name}</p></div><span className="text-indigo-600 font-bold text-xs">Review →</span></div>))}
          </div>
        )}
      </div>
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-xl">
            <h3 className="text-xl font-black mb-4">Approval: {selectedStudent.name}</h3>
            <div className="mb-4 p-4 bg-indigo-50 rounded-2xl italic text-sm">"{commentData.tutor_comment || 'No tutor remark'}"</div>
            <textarea className="w-full border-2 p-4 h-40 rounded-xl mb-6 outline-none focus:border-indigo-500" placeholder="Principal's remark..." value={commentData.principal_comment || ''} onChange={(e)=>setCommentData({...commentData, principal_comment: e.target.value})} />
            <div className="flex gap-4"><button onClick={approve} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase text-xs">Approve & Publish</button><button onClick={()=>setSelectedStudent(null)} className="px-6 font-bold text-slate-400 uppercase text-xs">Cancel</button></div>
          </div>
        </div>
      )}
    </div>
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
    const { error } = await supabase.from('profiles').update(updates).eq('id', uid);
    if (error) alert(error.message); else { alert("Updated!"); load(); setSelectedUser(null); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl mb-8 shadow-xl"><h1 className="text-2xl font-black flex items-center gap-3"><Shield className="text-indigo-400"/> GLOBAL CORE</h1><button onClick={onLogout} className="bg-white/10 px-6 py-2 rounded-xl font-bold">Logout</button></div>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b text-[10px] font-black uppercase"><tr><th className="p-4">User</th><th>School</th><th>Role</th><th>Action</th></tr></thead><tbody>{users.map(u => (<tr key={u.id} className="border-b hover:bg-slate-50"><td className="p-4 font-bold">{u.full_name}</td><td>{u.schools?.name || 'None'}</td><td><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase">{u.role}</span></td><td><button onClick={() => setSelectedUser(u)} className="p-2 text-indigo-600"><UserCog size={18}/></button></td></tr>))}</tbody></table></div>
      {selectedUser && (<div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50"><div className="bg-white p-8 rounded-3xl w-full max-w-sm"><h3 className="text-lg font-black mb-6 uppercase text-center">Manage Privileges</h3><div className="space-y-4"><select className="w-full border-2 p-3 rounded-xl font-bold" defaultValue={selectedUser.role} onChange={(e) => updateStaff(selectedUser.id, { role: e.target.value })}><option value="teacher">Teacher</option><option value="admin">School Admin</option></select><select className="w-full border-2 p-3 rounded-xl font-bold" defaultValue={selectedUser.school_id} onChange={(e) => updateStaff(selectedUser.id, { school_id: e.target.value })}><option value="">No School</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button onClick={() => setSelectedUser(null)} className="w-full py-4 text-slate-400 font-bold uppercase text-xs">Close</button></div></div></div>)}
    </div>
  );
};

// ==================== AUTH & PORTALS ====================
const Auth = ({ onParent }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);

  useEffect(() => { 
    supabase.from('schools').select('id, name').then(({data}) => {
      setSchools(data || []);
      if(data && data.length > 0) setForm(prev => ({...prev, schoolId: data[0].id}));
    }); 
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (mode === 'login') await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      else {
        const { data: { user } } = await supabase.auth.signUp({ email: form.email, password: form.password });
        if (mode === 'school_reg') {
          const { data: s } = await supabase.from('schools').insert([{ owner_id: user.id, name: form.name }]).select().single();
          await supabase.from('profiles').insert([{ id: user.id, full_name: form.name, role: 'admin', school_id: s.id }]);
        } else { await supabase.from('profiles').insert([{ id: user.id, full_name: form.name, role: 'teacher', school_id: form.schoolId }]); }
        alert("Check your email for verification.");
      }
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[50px] shadow-2xl max-w-md w-full border-t-8 border-indigo-600">
        <h1 className="text-3xl font-black text-center mb-10 text-indigo-600 tracking-tighter">SPRINGFORTH</h1>
        <div className="flex gap-4 mb-8 border-b text-[10px] font-black uppercase pb-3 overflow-x-auto">{['login', 'school_reg', 'teacher_reg'].map(m => (<button key={m} onClick={() => setMode(m)} className={mode === m ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}>{m.replace('_',' ')}</button>))}</div>
        <form onSubmit={submit} className="space-y-4">
          {mode !== 'login' && <input className="w-full border-2 p-4 rounded-3xl outline-none" placeholder="Full Name" onChange={(e)=>setForm({...form, name: e.target.value})} required />}
          <input className="w-full border-2 p-4 rounded-3xl outline-none" type="email" placeholder="Email" onChange={(e)=>setForm({...form, email: e.target.value})} required />
          <input className="w-full border-2 p-4 rounded-3xl outline-none" type="password" placeholder="Password" onChange={(e)=>setForm({...form, password: e.target.value})} required />
          {mode === 'teacher_reg' && (<select className="w-full border-2 p-4 rounded-3xl bg-white font-bold" value={form.schoolId} onChange={(e)=>setForm({...form, schoolId: e.target.value})} required><option value="">Select School</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>)}
          <button className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black shadow-lg uppercase text-xs tracking-widest">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'Enter Portal'}</button>
        </form>
        <button onClick={onParent} className="w-full bg-slate-50 py-4 rounded-3xl mt-8 font-black uppercase text-slate-400 flex justify-center items-center gap-3"><Search size={18}/> Parent Gateway</button>
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
    const { data: st } = await supabase.from('students').select('*, schools(*), classes(name), results(*, subjects(*)), comments(*)').eq('admission_no', id).maybeSingle();
    if (st && st.comments?.[0]?.submission_status === 'approved') setData(st);
    else alert("Result not approved or ID invalid.");
    setLoading(false);
  };

  if (data) return (<div className="fixed inset-0 z-50 bg-white flex flex-col"><button onClick={()=>setData(null)} className="p-6 bg-slate-900 text-white font-black flex items-center gap-3 text-xs uppercase">← Back</button><PDFViewer className="flex-1 border-none"><ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} type="full" /></PDFViewer></div>);

  return (<div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4"><div className="bg-white p-12 rounded-[60px] shadow-2xl max-w-md w-full text-center"><GraduationCap size={70} className="mx-auto text-indigo-600 mb-6"/><h2 className="text-3xl font-black mb-10 text-slate-800 uppercase tracking-widest">Parent Portal</h2><input className="w-full border-2 p-5 rounded-[30px] mb-4 text-center font-black tracking-widest text-lg uppercase outline-none" placeholder="ADM-XXXX" onChange={(e)=>setId(e.target.value)} /><button onClick={lookup} className="w-full bg-indigo-600 text-white py-6 rounded-[30px] font-black uppercase text-xs">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'Access Transcript'}</button><button onClick={onBack} className="mt-8 text-slate-400 text-xs font-black uppercase">Staff Login</button></div></div>);
};

// ==================== BOOTSTRAP ====================
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" size={50}/></div>;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  if (profile?.role === 'central_admin') return <CentralAdminDashboard onLogout={() => supabase.auth.signOut()} />;
  if (profile?.role === 'admin') return <AdminDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
  return <TeacherDashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;