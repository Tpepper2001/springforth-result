import React, { useState, useEffect, useCallback } from 'react';
import { Save, FileText, Download, X, LogOut, CheckCircle, AlertTriangle, UserPlus, LogIn } from 'lucide-react';
// NOTE: Removed 'import jsPDF from "jspdf";' to resolve compilation error.
// The code will now assume jsPDF and jspdf-autotable are loaded globally via script tags.

// Import necessary Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { getDoc, addDoc } from 'firebase/firestore';

// --- Global Firebase Configuration Setup (Mandatory) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase App and Services (must be done only once)
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

// Helper to define public collection path for shared app data
const getPublicCollectionPath = (collectionName) => {
  return `/artifacts/${appId}/public/data/${collectionName}`;
};

// Helper to define class-specific collection path
const getClassDataPath = (className, collectionName) => {
  return `${getPublicCollectionPath('classes')}/${className}/${collectionName}`;
};

// --- Custom Message Modal Component ---
const MessageBar = ({ message, type, onClose }) => {
  if (!message) return null;

  const colorClass = type === 'success' ? 'bg-green-100 text-green-800 border-green-400' : 'bg-red-100 text-red-800 border-red-400';
  const Icon = type === 'success' ? CheckCircle : AlertTriangle;

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl border-l-4 ${colorClass} transition-all duration-300 z-50`}>
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-2" />
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


// --- Main App Component ---
const App = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]); // Used for login/signup lookup only
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]); // Class subjects, array of strings
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", className: "" });
  const [newStudentName, setNewStudentName] = useState("");
  const [newSubject, setNewSubject] = useState("");

  // Message State (replaces alert)
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMessage = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // --------------------
  // FIREBASE INIT & AUTH
  // --------------------

  useEffect(() => {
    if (!auth || !db) return;

    // 1. Initial Authentication
    const authenticate = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Firebase Auth Error:", e);
      }
    };

    // 2. Set up Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // If user logs in/signs up, currentTeacher is set by those handlers
      }
      setIsAuthReady(true);
      setIsLoading(false);
    });

    authenticate();
    return () => unsubscribe();
  }, []);

  // --------------------
  // FIREBASE DATA LISTENERS
  // --------------------

  // Listener for the global teachers list (used for auth lookups)
  useEffect(() => {
    if (!db || !isAuthReady) return;

    const teachersRef = collection(db, getPublicCollectionPath('teachers'));
    const unsubscribe = onSnapshot(teachersRef, (snapshot) => {
      const teacherList = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
      setTeachers(teacherList);

      // If a user is logged in via Firebase Auth, check if they exist in the teachers list
      if (auth?.currentUser) {
        const loggedInTeacher = teacherList.find(t => t.uid === auth.currentUser.uid);
        if (loggedInTeacher) {
          setCurrentTeacher(loggedInTeacher);
        } else {
          // Fallback if auth is ready but teacher data is missing (e.g., initial anonymous sign-in)
          setCurrentTeacher(null);
        }
      }
    }, (error) => console.error("Error fetching teachers:", error));

    return () => unsubscribe();
  }, [isAuthReady]);

  // Listener for Class-specific Students and Subjects
  useEffect(() => {
    if (!db || !currentTeacher || !currentTeacher.className) {
      setStudents([]);
      setSubjects([]);
      return;
    }

    const cls = currentTeacher.className;

    // A. Students Listener
    const studentsRef = collection(db, getClassDataPath(cls, 'students'));
    const studentsUnsubscribe = onSnapshot(studentsRef, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => console.error("Error fetching students:", error));

    // B. Subjects Listener (Subjects are stored in a single document)
    const subjectsDocRef = doc(db, getClassDataPath(cls, 'subjects'), 'list');
    const subjectsUnsubscribe = onSnapshot(subjectsDocRef, (docSnap) => {
      setSubjects(docSnap.exists() ? docSnap.data().names || [] : []);
    }, (error) => console.error("Error fetching subjects:", error));

    return () => {
      studentsUnsubscribe();
      subjectsUnsubscribe();
    };
  }, [currentTeacher]);


  // --------------------
  // AUTH HANDLERS
  // --------------------

  const handleLogin = async () => {
    const teacher = teachers.find(
      (t) => t.email === loginData.email && t.password === loginData.password
    );

    if (teacher) {
      // In a real app, this would use email/password auth.
      // Here, we simulate linking the found teacher to the current authenticated user (if anonymous)
      // or simply rely on the teachers array lookup.
      setCurrentTeacher(teacher);
      showMessage(`Welcome back, ${teacher.name}!`, 'success');
    } else {
      showMessage("Invalid credentials. Please check email and password.", 'error');
    }
  };

  const handleSignup = async () => {
    if (!signupData.name || !signupData.email || !signupData.password || !signupData.className) {
      showMessage("All fields are required for sign-up.", 'error');
      return;
    }

    const existingTeacher = teachers.find((t) => t.email === signupData.email);
    if (existingTeacher) {
      showMessage("This email is already registered.", 'error');
      return;
    }

    try {
      const newUser = await signInAnonymously(auth); // Sign up a new user via anonymous auth for UID
      const newTeacherData = {
        name: signupData.name,
        email: signupData.email,
        password: signupData.password, // WARNING: Plain text storage for demo ONLY
        className: signupData.className,
        uid: newUser.user.uid,
      };

      // Store teacher data in the public teachers collection
      const teacherDocRef = doc(db, getPublicCollectionPath('teachers'), newUser.user.uid);
      await setDoc(teacherDocRef, newTeacherData);

      setCurrentTeacher(newTeacherData);
      showMessage(`Account created for ${newTeacherData.name}. Welcome!`, 'success');
    } catch (e) {
      console.error("Signup failed:", e);
      showMessage("Signup failed. Please try again.", 'error');
    }
  };

  const handleLogout = async () => {
    if (auth && auth.currentUser) {
      await signOut(auth); // Clear Firebase session
      // Re-sign in anonymously so the next session can still save data
      await signInAnonymously(auth);
    }
    setCurrentTeacher(null);
    setStudents([]);
    setSubjects([]);
    showMessage("Logged out successfully.", 'success');
  };

  // --------------------
  // SUBJECT HANDLERS
  // --------------------
  const addSubject = async () => {
    if (!newSubject.trim()) return;
    const cls = currentTeacher.className;
    const newSubTrimmed = newSubject.trim();

    if (subjects.includes(newSubTrimmed)) {
      showMessage("Subject already exists in this class.", 'error');
      return;
    }

    try {
      const subjectsDocRef = doc(db, getClassDataPath(cls, 'subjects'), 'list');
      await setDoc(subjectsDocRef, { names: [...subjects, newSubTrimmed] }, { merge: true });
      setNewSubject("");
      showMessage(`Subject "${newSubTrimmed}" added.`, 'success');

      // Add the new subject field to existing students (with initial score of 0)
      const studentsToUpdate = students.map(st => ({
        id: st.id,
        scores: { ...st.scores, [newSubTrimmed]: 0 }
      }));

      for (const st of studentsToUpdate) {
        const studentDocRef = doc(db, getClassDataPath(cls, 'students'), st.id);
        await updateDoc(studentDocRef, { scores: st.scores });
      }

    } catch (e) {
      console.error("Error adding subject:", e);
      showMessage("Failed to add subject.", 'error');
    }
  };

  const removeSubject = async (sub) => {
    const cls = currentTeacher.className;
    const updatedSubjects = subjects.filter((s) => s !== sub);

    try {
      // 1. Update Subjects List
      const subjectsDocRef = doc(db, getClassDataPath(cls, 'subjects'), 'list');
      await setDoc(subjectsDocRef, { names: updatedSubjects });

      // 2. Remove score field from all students in this class
      for (const st of students) {
        // eslint-disable-next-line no-unused-vars
        const { [sub]: removedScore, ...remainingScores } = st.scores;
        const studentDocRef = doc(db, getClassDataPath(cls, 'students'), st.id);
        await updateDoc(studentDocRef, { scores: remainingScores });
      }

      showMessage(`Subject "${sub}" removed successfully.`, 'success');
    } catch (e) {
      console.error("Error removing subject:", e);
      showMessage("Failed to remove subject.", 'error');
    }
  };

  // --------------------
  // STUDENT HANDLERS
  // --------------------
  const addStudent = async () => {
    if (!newStudentName.trim()) return;
    const cls = currentTeacher.className;
    const studentNameTrimmed = newStudentName.trim();

    if (students.some(s => s.name === studentNameTrimmed)) {
      showMessage("A student with this name already exists.", 'error');
      return;
    }

    // Initialize scores for all current subjects
    const initialScores = subjects.reduce((acc, sub) => ({ ...acc, [sub]: 0 }), {});

    const studentToAdd = {
      name: studentNameTrimmed,
      className: cls,
      scores: initialScores,
    };

    try {
      const studentsRef = collection(db, getClassDataPath(cls, 'students'));
      await addDoc(studentsRef, studentToAdd);
      setNewStudentName("");
      showMessage(`Student "${studentNameTrimmed}" added.`, 'success');
    } catch (e) {
      console.error("Error adding student:", e);
      showMessage("Failed to add student.", 'error');
    }
  };

  const removeStudent = async (studentId, studentName) => {
    const cls = currentTeacher.className;
    try {
      const studentDocRef = doc(db, getClassDataPath(cls, 'students'), studentId);
      await deleteDoc(studentDocRef);
      showMessage(`Student "${studentName}" removed.`, 'success');
    } catch (e) {
      console.error("Error removing student:", e);
      showMessage("Failed to remove student.", 'error');
    }
  };

  const handleScoreChange = async (studentId, subject, value) => {
    const cls = currentTeacher.className;
    const score = Number(value);
    if (isNaN(score) || score < 0 || score > 100) return; // Basic validation (0-100)

    // Optimistic UI update (using the listener will correct if save fails)
    setStudents(prevStudents => prevStudents.map(s =>
      s.id === studentId
        ? { ...s, scores: { ...s.scores, [subject]: score } }
        : s
    ));

    try {
      const studentDocRef = doc(db, getClassDataPath(cls, 'students'), studentId);
      await updateDoc(studentDocRef, { [`scores.${subject}`]: score });
    } catch (e) {
      console.error("Error updating score:", e);
      showMessage("Failed to update score. Please try again.", 'error');
    }
  };

  // --------------------
  // REPORT HANDLERS
  // --------------------
  const calculateAverage = (scores) => {
    const definedScores = Object.values(scores).filter(s => s !== undefined && s !== null && s !== "");
    if (definedScores.length === 0) return 0;
    const sum = definedScores.reduce((acc, score) => acc + Number(score), 0);
    return (sum / definedScores.length).toFixed(1);
  };

  const downloadPDF = () => {
    // Check for global availability of jsPDF (due to removed import)
    if (typeof window.jsPDF === 'undefined' || typeof window.jsPDF.prototype.autoTable === 'undefined') {
      showMessage("PDF generation libraries are not available. Please ensure jspdf and jspdf-autotable are loaded in the environment.", 'error');
      return;
    }
    
    const cls = currentTeacher.className;
    const doc = new window.jsPDF(); // Use global reference
    let y = 15;

    doc.setFontSize(18);
    doc.text(`Springforth School Result Sheet`, 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(14);
    doc.text(`Teacher: ${currentTeacher.name} | Class: ${cls}`, 105, y, { align: 'center' });
    y += 12;

    const headers = ["Name", ...subjects, "Avg."];
    const data = students.map(st => {
      const studentScores = subjects.map(sub => st.scores[sub] || 0);
      const avg = calculateAverage(st.scores);
      return [st.name, ...studentScores, avg];
    });

    doc.autoTable({
      startY: y,
      head: [headers],
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
      margin: { top: 10, left: 10, right: 10, bottom: 10 },
    });

    doc.save(`Springforth_Class_${cls}_Results.pdf`);
  };

  const downloadCSV = () => {
    const cls = currentTeacher.className;
    const headers = ["Name", ...subjects, "Average"];
    let csv = headers.join(",") + "\n";

    students.forEach((st) => {
      const studentScores = subjects.map((sub) => st.scores[sub] || 0);
      const avg = calculateAverage(st.scores);
      csv += [st.name, ...studentScores, avg].join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Springforth_Class_${cls}_Results.csv`;
    a.click();
  };

  // --------------------
  // RENDER UI
  // --------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-600">Loading Application...</div>
      </div>
    );
  }

  // --- Auth Screens ---
  if (!currentTeacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <MessageBar message={message.text} type={message.type} onClose={() => setMessage({ text: '', type: '' })} />
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl space-y-8">
          <h1 className="text-3xl font-extrabold text-center text-indigo-700">Springforth Management</h1>
          <p className="text-center text-gray-500">
            Use the same credentials across sessions.
          </p>

          {/* Login Form */}
          <div className="space-y-4 border-b pb-6">
            <h2 className="text-2xl font-bold text-gray-700 flex items-center"><LogIn className="w-6 h-6 mr-2 text-indigo-500" />Teacher Login</h2>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 shadow-lg"
            >
              Login
            </button>
          </div>

          {/* Sign Up Form */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-gray-700 flex items-center"><UserPlus className="w-6 h-6 mr-2 text-pink-500" />New Teacher Sign Up</h2>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Full Name"
              value={signupData.name}
              onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
            />
            <input
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Email"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
            />
            <input
              className="w-full p-3 border border-gray-300 rounded-lg"
              type="password"
              placeholder="Password"
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
            />
            <input
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Class Name (e.g., Year 10, Class 5A)"
              value={signupData.className}
              onChange={(e) => setSignupData({ ...signupData, className: e.target.value })}
            />
            <button
              onClick={handleSignup}
              className="w-full bg-pink-500 text-white p-3 rounded-lg font-semibold hover:bg-pink-600 transition duration-150 shadow-lg"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App Screen ---
  const cls = currentTeacher.className;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      <MessageBar message={message.text} type={message.type} onClose={() => setMessage({ text: '', type: '' })} />

      <header className="flex justify-between items-center mb-8 pb-4 border-b-2 border-indigo-200">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-700">Class Results Dashboard</h1>
          <p className="text-lg text-gray-600 mt-1">
            Welcome, <span className="font-semibold text-indigo-600">{currentTeacher.name}</span> (Managing Class <span className="font-bold text-indigo-600">{cls}</span>)
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center bg-red-500 text-white px-4 py-2 rounded-full font-medium hover:bg-red-600 transition shadow-md"
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </button>
      </header>

      <main className="space-y-10">

        {/* Subjects Management */}
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">1. Subjects for Class {cls}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {subjects.map((sub) => (
              <span key={sub} className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full shadow-sm">
                {sub}
                <X className="w-4 h-4 ml-2 cursor-pointer hover:text-red-600 transition" onClick={() => removeSubject(sub)} />
              </span>
            ))}
          </div>
          <div className="flex space-x-3">
            <input
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter new subject name (e.g., Physics, History)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
            />
            <button
              onClick={addSubject}
              className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-600 transition shadow-md whitespace-nowrap"
            >
              Add Subject
            </button>
          </div>
        </section>

        {/* Student Data Table */}
        <section className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
          <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">2. Student Scores</h2>

          {/* Add Student Form */}
          <div className="flex space-x-3 mb-6">
            <input
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter new student name"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStudent()}
            />
            <button
              onClick={addStudent}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition shadow-md whitespace-nowrap"
            >
              Add Student
            </button>
          </div>

          <table className="min-w-full bg-white border-collapse rounded-lg overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Name</th>
                {subjects.map((sub) => (
                  <th key={sub} className="p-3 text-center text-sm font-semibold text-gray-600">{sub}</th>
                ))}
                <th className="p-3 text-center text-sm font-semibold text-gray-600">Average</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={subjects.length + 3} className="p-4 text-center text-gray-500">
                    No students found. Add one above!
                  </td>
                </tr>
              ) : (
                students.map((st, index) => (
                  <tr key={st.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition duration-150`}>
                    <td className="p-3 font-medium text-gray-900 border-t">{st.name}</td>
                    {subjects.map((sub) => (
                      <td key={sub} className="p-3 text-center border-t">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-20 p-1 border border-gray-300 rounded-md text-center focus:ring-indigo-500 focus:border-indigo-500"
                          value={st.scores[sub] === undefined ? "" : st.scores[sub]}
                          onChange={(e) => handleScoreChange(st.id, sub, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="p-3 text-center font-bold text-indigo-600 border-t">
                      {calculateAverage(st.scores)}
                    </td>
                    <td className="p-3 text-center border-t">
                      <button
                        onClick={() => removeStudent(st.id, st.name)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full transition"
                        title="Delete Student"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Reports */}
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">3. Generate Reports</h2>
          <p className="text-gray-600 mb-4">Export the current class results into PDF or CSV format.</p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={downloadPDF}
              className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
            >
              <FileText className="w-5 h-5 mr-2" /> Download PDF Report
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center bg-yellow-500 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition shadow-lg"
            >
              <Download className="w-5 h-5 mr-2" /> Download CSV Data
            </button>
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;
