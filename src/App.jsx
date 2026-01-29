import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { Loader2, School, LogOut, Users, Settings, CheckCircle, Search, Menu, X } from 'lucide-react';

const supabaseUrl = 'https://ghlnenmfwlpwlqdrbean.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobG5lbm1md2xwd2xxZHJiZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTE0MDQsImV4cCI6MjA3OTk4NzQwNH0.rNILUdI035c4wl4kFkZFP4OcIM_t7bNMqktKm25d5Gg'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const BEHAVIORS = ['Cooperation', 'Honesty', 'Self-Control', 'Neatness', 'Punctuality'];
const RATINGS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];

// ==================== LOGIC HELPERS ====================
const getGrade = (obtained, max) => {
  const percent = (obtained / max) * 100;
  if (percent >= 90) return { g: 'A', r: 'Excellent', c: 'An outstanding performance. Keep it up!' };
  if (percent >= 70) return { g: 'B', r: 'Very Good', c: 'A very good result. Room for more improvement.' };
  if (percent >= 60) return { g: 'C', r: 'Good', c: 'Good performance. Put in more effort.' };
  if (percent >= 40) return { g: 'D', r: 'Pass', c: 'A fair result. You need to work harder.' };
  return { g: 'E', r: 'Fail', c: 'Poor performance. Serious improvement is required.' };
};

// ==================== PDF STYLES ====================
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 8, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 15, borderBottom: 2, paddingBottom: 5 },
  schoolName: { fontSize: 20, fontWeight: 'bold' },
  motto: { fontStyle: 'italic', fontSize: 9, marginBottom: 5 },
  table: { width: '100%', marginTop: 10, borderTop: 1 },
  row: { flexDirection: 'row', borderBottom: 1, padding: 4 },
  cell: { flex: 1, textAlign: 'center' },
  footer: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }
});

const ResultPDF = ({ school, student, results, comments, type = 'full' }) => {
  const allConfig = school?.assessment_config || [];
  const config = type === 'ca' ? allConfig.filter(c => !c.name.toLowerCase().includes('exam')) : allConfig;
  const maxPossible = config.reduce((s, f) => s + parseInt(f.max), 0);
  
  let totalObtained = 0;
  results.forEach(r => {
      totalObtained += config.reduce((acc, f) => acc + (parseFloat(r.scores[f.code]) || 0), 0);
  });
  const avg = (totalObtained / (results.length * maxPossible)) * 100;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.schoolName}>{school?.name}</Text>
          <Text style={pdfStyles.motto}>{school?.motto}</Text>
          <Text>{school?.address} | {school?.contact_info}</Text>
          <Text style={{ marginTop: 5, fontWeight: 'bold' }}>{type === 'ca' ? 'MID-TERM PROGRESS REPORT' : 'TERMINAL REPORT'}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View><Text>Student: {student?.name}</Text><Text>ID: {student?.admission_no}</Text></View>
          <View style={{ textAlign: 'right' }}><Text>Session: {school?.current_session}</Text><Text>Term: {school?.current_term}</Text></View>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, { backgroundColor: '#eee' }]}>
            <Text style={{ width: 120 }}>SUBJECT</Text>
            {config.map(c => <Text key={c.code} style={pdfStyles.cell}>{c.name}</Text>)}
            <Text style={pdfStyles.cell}>TOTAL</Text>
            <Text style={pdfStyles.cell}>GRADE</Text>
          </View>
          {results.map(r => {
            const subTotal = config.reduce((acc, f) => acc + (parseFloat(r.scores[f.code]) || 0), 0);
            return (
              <View key={r.id} style={pdfStyles.row}>
                <Text style={{ width: 120 }}>{r.subjects?.name}</Text>
                {config.map(c => <Text key={c.code} style={pdfStyles.cell}>{r.scores[c.code] || 0}</Text>)}
                <Text style={pdfStyles.cell}>{subTotal}</Text>
                <Text style={pdfStyles.cell}>{getGrade(subTotal, maxPossible).g}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 10 }}><Text>Class Average: {avg.toFixed(2)}%</Text></View>

        <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 'bold', borderBottom: 1 }}>REMARKS</Text>
            <Text style={{ marginTop: 5 }}>Teacher: {type === 'ca' ? comments?.midterm_tutor_comment : comments?.tutor_comment}</Text>
            <Text style={{ marginTop: 5 }}>Principal: {comments?.principal_comment || 'Satisfactory.'}</Text>
        </View>

        <View style={pdfStyles.footer}>
            <View style={{ borderTop: 1, width: 100, textAlign: 'center' }}><Text>Teacher's Sign</Text></View>
            <View style={{ borderTop: 1, width: 100, textAlign: 'center' }}><Text>Principal's Sign</Text></View>
        </View>
      </Page>
    </Document>
  );
};

// ==================== DASHBOARD ====================
const Dashboard = ({ profile, onLogout }) => {
  const [activeTab, setActiveTab] = useState('scores');
  const [school, setSchool] = useState(null);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scores, setScores] = useState({});
  const [commentData, setCommentData] = useState({ behaviors: {} });
  const [studentResults, setStudentResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: s } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
    setSchool(s);
    const { data: cls } = await supabase.from('classes').select('*').eq('school_id', profile.school_id).order('name');
    setClassList(cls || []);
  }, [profile.school_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadClass = async (id) => {
    setSelectedClassId(id);
    const { data: stu } = await supabase.from('students').select('*').eq('class_id', id).order('name');
    setStudents(stu || []);
    const { data: sub } = await supabase.from('subjects').select('*').eq('class_id', id).order('name');
    setSubjects(sub || []);
  };

  const loadStudent = async (stu) => {
    setSelectedStudent(stu);
    setSidebarOpen(false); // Close sidebar on mobile
    const { data: res } = await supabase.from('results').select('*, subjects(name)').eq('student_id', stu.id);
    const { data: comm } = await supabase.from('comments').select('*').eq('student_id', stu.id).maybeSingle();
    setScores(res?.reduce((acc, r) => ({ ...acc, [r.subject_id]: r.scores }), {}) || {});
    setStudentResults(res || []);
    setCommentData(comm || { behaviors: {}, submission_status: 'draft' });
  };

  const handleSave = async (status = 'draft') => {
    setSaving(true);
    const updates = subjects.map(s => ({
      student_id: selectedStudent.id, subject_id: s.id, scores: scores[s.id] || {},
      total: Object.values(scores[s.id] || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0)
    }));
    await supabase.from('results').delete().eq('student_id', selectedStudent.id);
    await supabase.from('results').insert(updates);
    
    // Auto Comment Logic
    const config = school.assessment_config || [];
    const max = config.reduce((a, b) => a + parseInt(b.max), 0);
    let stTotal = updates.reduce((a, b) => a + b.total, 0);
    const stAvg = (stTotal / (updates.length * max)) * 100;
    const suggested = getGrade(stAvg, 100).c;

    await supabase.from('comments').upsert({
      student_id: selectedStudent.id, school_id: school.id,
      tutor_comment: commentData.tutor_comment || suggested,
      midterm_tutor_comment: commentData.midterm_tutor_comment || suggested,
      principal_comment: commentData.principal_comment,
      behaviors: commentData.behaviors,
      submission_status: status
    });
    setSaving(false); alert("Success!"); loadStudent(selectedStudent);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 
        fixed lg:static 
        inset-y-0 left-0 
        w-64 
        bg-slate-900 text-white 
        flex flex-col p-4 shadow-xl 
        transition-transform duration-300 ease-in-out 
        z-40
      `}>
        <div className="font-bold text-xl mb-8 flex items-center gap-2 border-b border-slate-700 pb-4 mt-12 lg:mt-0">
          <School className="text-blue-400"/> Springforth
        </div>
        <div className="mb-6">
          <label className="text-[10px] text-slate-400 font-bold uppercase">Active Class</label>
          <select className="w-full bg-slate-800 p-2 rounded mt-1 border-none text-sm outline-none" value={selectedClassId} onChange={(e) => loadClass(e.target.value)}>
            <option value="">Select Class</option>
            {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-auto">
          {students.map(s => (
            <div key={s.id} onClick={() => loadStudent(s)} className={`p-2 cursor-pointer rounded text-sm mb-1 flex justify-between items-center ${selectedStudent?.id === s.id ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
              <span className="truncate">{s.name}</span>
              {commentData?.submission_status === 'approved' && <CheckCircle size={14} className="text-green-400" />}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-700 pt-4 space-y-2">
          {profile.role === 'admin' && <button onClick={() => setActiveTab('settings')} className="w-full text-left p-2 text-sm flex items-center gap-2 hover:bg-slate-800 rounded transition"><Settings size={16}/> School Profile</button>}
          <button onClick={onLogout} className="w-full text-left p-2 text-sm text-red-400 flex items-center gap-2 hover:bg-slate-800 rounded transition"><LogOut size={16}/> Logout</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-8 w-full">
        {activeTab === 'settings' ? (
          <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border max-w-2xl mx-auto">
            <h2 className="text-xl lg:text-2xl font-bold mb-6">School Configuration</h2>
            <form onSubmit={async(e)=>{
              e.preventDefault(); const fd=new FormData(e.target);
              await supabase.from('schools').update({
                  name: fd.get('n'), motto: fd.get('m'), address: fd.get('a'), 
                  contact_info: fd.get('c'), current_term: fd.get('t'), current_session: fd.get('s')
              }).eq('id', school.id);
              alert("School profile updated!"); fetchData();
            }} className="space-y-4">
              <input name="n" defaultValue={school?.name} placeholder="School Name" className="w-full border p-2 rounded" />
              <input name="m" defaultValue={school?.motto} placeholder="School Motto" className="w-full border p-2 rounded font-italic" />
              <input name="a" defaultValue={school?.address} placeholder="Address" className="w-full border p-2 rounded" />
              <input name="c" defaultValue={school?.contact_info} placeholder="Contact Info (Phone/Email)" className="w-full border p-2 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="t" defaultValue={school?.current_term} placeholder="Term" className="border p-2 rounded" />
                <input name="s" defaultValue={school?.current_session} placeholder="Session" className="border p-2 rounded" />
              </div>
              <button className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold w-full sm:w-auto">Update School</button>
            </form>
          </div>
        ) : !selectedStudent ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300"><Users size={60} className="lg:w-20 lg:h-20"/><p className="mt-4 font-medium text-sm lg:text-base">Select a student from the sidebar</p></div>
        ) : (
          <div className="space-y-4 lg:space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-l-8 border-l-blue-600 gap-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold">{selectedStudent.name}</h1>
                <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${commentData.submission_status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {commentData.submission_status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 lg:gap-3">
                <button onClick={() => setPreviewMode('ca')} className="bg-slate-100 px-3 lg:px-4 py-2 rounded-lg font-bold text-xs lg:text-sm hover:bg-slate-200 transition flex-1 sm:flex-none">CA Report</button>
                <button onClick={() => setPreviewMode('full')} className="bg-blue-100 text-blue-700 px-3 lg:px-4 py-2 rounded-lg font-bold text-xs lg:text-sm hover:bg-blue-200 transition flex-1 sm:flex-none">Full Report</button>
                <button onClick={() => handleSave(profile.role === 'admin' ? 'approved' : 'pending')} className="bg-green-600 text-white px-4 lg:px-6 py-2 rounded-lg font-bold text-xs lg:text-sm hover:shadow-lg transition w-full sm:w-auto">
                    {saving ? <Loader2 className="animate-spin" /> : (profile.role === 'admin' ? 'Approve & Save' : 'Submit for Approval')}
                </button>
              </div>
            </div>

            <div className="flex gap-3 lg:gap-6 border-b text-xs lg:text-sm font-bold text-slate-400 overflow-x-auto">
              {['scores', 'traits', 'remarks'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`pb-2 px-2 capitalize transition whitespace-nowrap ${activeTab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'hover:text-slate-600'}`}>{t}</button>
              ))}
            </div>

            {activeTab === 'scores' && (
              <div className="bg-white rounded-xl shadow-sm border p-3 lg:p-6 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 text-left border-b text-xs lg:text-sm">
                      <th className="p-2 lg:p-4 sticky left-0 bg-slate-50">Subject</th>
                      {school?.assessment_config?.map(c=><th key={c.code} className="p-2 lg:p-4 text-center">{c.name}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs lg:text-sm">
                    {subjects.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition">
                        <td className="p-2 lg:p-4 font-semibold sticky left-0 bg-white">{sub.name}</td>
                        {school?.assessment_config?.map(c => (
                          <td key={c.code} className="p-2 lg:p-4 text-center">
                            <input type="number" className="w-16 lg:w-20 bg-slate-100 p-1 lg:p-2 rounded text-center outline-none focus:ring-2 focus:ring-blue-400 transition text-xs lg:text-sm" value={scores[sub.id]?.[c.code] || ''} 
                              onChange={(e)=>setScores({...scores, [sub.id]: {...(scores[sub.id]||{}), [c.code]: e.target.value}})}/>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'traits' && (
              <div className="bg-white p-4 lg:p-8 rounded-xl shadow-sm border grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                <div>
                  <h3 className="font-bold mb-4 text-slate-500 text-sm lg:text-base">BEHAVIORAL RATINGS</h3>
                  {BEHAVIORS.map(b => (
                    <div key={b} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-none">
                      <span className="text-xs lg:text-sm font-medium">{b}</span>
                      <select className="bg-slate-50 border p-1 rounded text-xs" value={commentData.behaviors?.[b] || 'Good'} 
                        onChange={(e)=>setCommentData({...commentData, behaviors: {...(commentData.behaviors || {}), [b]: e.target.value}})}>
                        {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'remarks' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase">Class Teacher's Remark</label>
                  <textarea className="w-full border-2 p-3 rounded-lg h-32 focus:border-blue-500 outline-none text-sm" value={commentData.tutor_comment || ''} onChange={(e)=>setCommentData({...commentData, tutor_comment: e.target.value})} />
                </div>
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase">Headmistress's Remark</label>
                  <textarea className="w-full border-2 p-3 rounded-lg h-32 focus:border-blue-500 outline-none text-sm" disabled={profile.role !== 'admin'} value={commentData.principal_comment || ''} onChange={(e)=>setCommentData({...commentData, principal_comment: e.target.value})} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {previewMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col p-2 lg:p-4">
          <div className="bg-white p-3 lg:p-4 rounded-t-xl flex flex-col sm:flex-row justify-between items-center shadow-2xl gap-3">
            <button onClick={() => setPreviewMode(null)} className="font-bold text-slate-600 hover:text-red-500 transition text-sm lg:text-base order-2 sm:order-1">✕ Close Preview</button>
            <PDFDownloadLink document={<ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} type={previewMode} />} fileName={`${selectedStudent.name}.pdf`}>
              <button className="bg-blue-600 text-white px-4 lg:px-6 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm lg:text-base w-full sm:w-auto order-1 sm:order-2">Download Result</button>
            </PDFDownloadLink>
          </div>
          <PDFViewer className="flex-1 w-full rounded-b-xl overflow-hidden"><ResultPDF school={school} student={selectedStudent} results={studentResults} comments={commentData} type={previewMode} /></PDFViewer>
        </div>
      )}
    </div>
  );
};

// ==================== AUTH & PORTALS ====================
const ParentPortal = ({ onBack }) => {
    const [id, setId] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const check = async () => {
        setLoading(true);
        const { data: stu, error } = await supabase.from('students').select('*, schools(*), classes(*), results(*, subjects(*)), comments(*)').eq('admission_no', id).maybeSingle();
        if (stu && stu.comments?.[0]?.submission_status === 'approved') {
            setData(stu);
        } else {
            alert(error ? "Error connecting" : "Result not yet published/Approved by Admin.");
        }
        setLoading(false);
    };

    if (data) return (
        <div className="fixed inset-0 z-50 bg-white"><div className="p-4 border-b"><button onClick={()=>setData(null)} className="font-bold">← Back</button></div>
        <PDFViewer className="w-full h-screen"><ResultPDF school={data.schools} student={data} results={data.results} comments={data.comments[0]} /></PDFViewer></div>
    );

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><Search size={32}/></div>
                <h2 className="text-2xl font-bold text-slate-800">Parent Access</h2>
                <p className="text-slate-500 text-sm mb-6">Enter Admission Number to view approved result</p>
                <input placeholder="ADM-XXXXX" className="w-full border-2 p-3 rounded-xl mb-4 text-center font-bold tracking-widest outline-none focus:border-green-500" onChange={e=>setId(e.target.value)} />
                <button onClick={check} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg">{loading ? 'Checking...' : 'View Report Card'}</button>
                <button onClick={onBack} className="mt-6 text-slate-400 text-sm hover:underline">Back to Staff Login</button>
            </div>
        </div>
    );
};

const Auth = ({ onParent }) => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', schoolId: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { 
    supabase.from('schools').select('id, name').then(({data}) => setSchools(data || [])); 
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      if (mode === 'school_reg') {
        const { data: auth, error: ae } = await supabase.auth.signUp({ 
          email: form.email, 
          password: form.password 
        });
        if (ae) throw ae;
        
        const { data: s, error: se } = await supabase
          .from('schools')
          .insert({ owner_id: auth.user.id, name: form.name })
          .select()
          .single();
        if (se) throw se;
        
        await supabase.from('profiles').insert({ 
          id: auth.user.id, 
          full_name: form.name, 
          role: 'admin', 
          school_id: s.id 
        });
        
        setMessage({ type: 'success', text: 'School registered successfully! Please login.' });
        setTimeout(() => setMode('login'), 2000);
        
      } else if (mode === 'teacher_reg') {
        if (!form.schoolId) {
          throw new Error('Please select a school');
        }
        
        const { data: auth, error: ae } = await supabase.auth.signUp({ 
          email: form.email, 
          password: form.password 
        });
        if (ae) throw ae;
        
        await supabase.from('profiles').insert({ 
          id: auth.user.id, 
          full_name: form.name, 
          role: 'teacher', 
          school_id: form.schoolId 
        });
        
        setMessage({ type: 'success', text: 'Teacher account created! Please login.' });
        setTimeout(() => setMode('login'), 2000);
        
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: form.email, 
          password: form.password 
        });
        if (error) throw error;
      }
    } catch (err) { 
      console.error('Auth error:', err);
      setMessage({ type: 'error', text: err.message || 'An error occurred. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-600">
        <h1 className="text-2xl lg:text-3xl font-black text-center mb-6 lg:mb-8 text-slate-800">Springforth</h1>
        
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="flex gap-2 lg:gap-4 mb-6 lg:mb-8 text-[9px] lg:text-[10px] font-black uppercase tracking-widest border-b pb-2 overflow-x-auto">
          {['login', 'school_reg', 'teacher_reg'].map(m => (
            <button 
              key={m} 
              onClick={() => {
                setMode(m);
                setMessage({ type: '', text: '' });
              }} 
              className={`whitespace-nowrap ${mode === m ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
            >
              {m.replace('_',' ')}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {mode !== 'login' && (
            <input 
              placeholder="Full Name" 
              className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500 transition text-sm lg:text-base" 
              onChange={e => setForm({...form, name: e.target.value})} 
              value={form.name}
              required 
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500 transition text-sm lg:text-base" 
            onChange={e => setForm({...form, email: e.target.value})} 
            value={form.email}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border-2 rounded-xl outline-none focus:border-blue-500 transition text-sm lg:text-base" 
            onChange={e => setForm({...form, password: e.target.value})} 
            value={form.password}
            required 
          />
          {mode === 'teacher_reg' && (
            <select 
              className="w-full p-3 border-2 rounded-xl bg-white outline-none text-sm lg:text-base" 
              onChange={e => setForm({...form, schoolId: e.target.value})} 
              value={form.schoolId}
              required
            >
              <option value="">Select School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Processing...</span>
              </>
            ) : (
              'Access Portal'
            )}
          </button>
        </form>
        <div className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-slate-100">
            <button onClick={onParent} className="w-full bg-green-50 text-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition text-sm lg:text-base"><Search size={18}/> Parent/Student Access</button>
        </div>
      </div>
    </div>
  );
};

// ==================== APP ROOT ====================
const App = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState('auth');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    try {
      setError(null);
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Profile load error:', profileError);
        setError(profileError.message);
        setProfile(null);
      } else if (!data) {
        console.error('No profile found for user');
        setError('Profile not found. Please contact administrator.');
        setProfile(null);
      } else {
        setProfile(data);
        setError(null);
      }
    } catch (err) {
      console.error('Profile load exception:', err);
      setError(err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { 
      setSession(s); 
      if (!s) {
        setLoading(false);
      } else {
        loadProfile(s.user.id);
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => { 
      setSession(s); 
      if (!s) { 
        setProfile(null); 
        setView('auth');
        setLoading(false);
      } else {
        loadProfile(s.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;
  if (view === 'parent') return <ParentPortal onBack={() => setView('auth')} />;
  if (!session) return <Auth onParent={() => setView('parent')} />;
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
          <p className="text-slate-600 text-sm">
            {error || 'Unable to load profile. Please try again.'}
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={() => {
                setLoading(true);
                loadProfile(session.user.id);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition"
            >
              Sign Out & Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard profile={profile} onLogout={() => supabase.auth.signOut()} />;
};

export default App;
