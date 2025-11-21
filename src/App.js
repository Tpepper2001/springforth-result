import React, { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';

const classes = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

const App = () => {
  const [teachers, setTeachers] = useState([]);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', scores: {} });
  const [selectedClass, setSelectedClass] = useState('');

  // Teacher signup
  const handleSignup = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const teacherClass = e.target.teacherClass.value;
    const teacher = { name, teacherClass };
    setTeachers([...teachers, teacher]);
    setCurrentTeacher(teacher);
    setSelectedClass(teacherClass);
  };

  // Add subject manually
  const addSubject = () => {
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setNewSubject('');
    }
  };

  // Remove subject
  const removeSubject = (subject) => {
    setSubjects(subjects.filter(s => s !== subject));
    setStudents(students.map(student => {
      const updatedScores = { ...student.scores };
      delete updatedScores[subject];
      return { ...student, scores: updatedScores };
    }));
  };

  // Add student
  const addStudent = () => {
    if (!newStudent.name) return;
    setStudents([...students, { ...newStudent }]);
    setNewStudent({ name: '', scores: {} });
  };

  // Update student score
  const updateScore = (studentIndex, subject, value) => {
    const updatedStudents = [...students];
    updatedStudents[studentIndex].scores[subject] = value;
    setStudents(updatedStudents);
  };

  if (!currentTeacher) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Teacher Signup</h2>
        <form onSubmit={handleSignup}>
          <input type="text" name="name" placeholder="Your Name" className="border p-2 mb-2 w-full"/>
          <select name="teacherClass" className="border p-2 mb-2 w-full">
            <option value="">Select Class</option>
            {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">Sign Up</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">
        Welcome {currentTeacher.name} ({selectedClass})
      </h2>

      <div className="mb-6">
        <h3 className="font-semibold">Manage Subjects</h3>
        <div className="flex mb-2">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="New subject"
            className="border p-2 flex-1"
          />
          <button onClick={addSubject} className="ml-2 p-2 bg-green-500 text-white rounded">
            <Plus size={16} />
          </button>
        </div>
        <ul className="mb-4">
          {subjects.map(sub => (
            <li key={sub} className="flex justify-between border p-2 mb-1 rounded">
              {sub}
              <button onClick={() => removeSubject(sub)} className="text-red-500">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold">Add Student</h3>
        <input
          type="text"
          placeholder="Student Name"
          value={newStudent.name}
          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
          className="border p-2 mb-2 w-full"
        />
        <button onClick={addStudent} className="bg-blue-500 text-white p-2 rounded w-full">
          Add Student
        </button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Student Scores</h3>
        {students.map((student, si) => (
          <div key={si} className="border p-2 mb-2 rounded">
            <h4 className="font-semibold mb-1">{student.name}</h4>
            {subjects.map((sub) => (
              <div key={sub} className="flex items-center mb-1">
                <span className="flex-1">{sub}</span>
                <input
                  type="number"
                  value={student.scores[sub] || ''}
                  onChange={(e) => updateScore(si, sub, e.target.value)}
                  className="border p-1 w-20"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
