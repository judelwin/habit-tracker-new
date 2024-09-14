import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { auth, db } from '../configuration';
import { signOut } from 'firebase/auth';
import { collection, orderBy, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { format } from 'date-fns';
import './Home.css';

interface Habit {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  progress: string[];
}

interface HomeProps {
  user: any;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  const [showList, setShowList] = useState<boolean>(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState({ name: '', description: '' });

  // Fetch habits and update showList
  useEffect(() => {
    const fetchHabits = async () => {
      if (user) {
        try {
          const q = query(collection(db, 'habits'), 
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          const habitsData = snapshot.docs.map(doc => {
            const data = doc.data();
            // Handle Firestore Timestamp and ensure createdAt is a Date object
            const createdAt = data.createdAt instanceof Date 
              ? data.createdAt 
              : new Date(data.createdAt); // Convert Timestamp to Date if needed
            return {
              id: doc.id,
              name: data.name,
              description: data.description,
              createdAt,
              progress: data.progress || []
            } as Habit;
          });
          setHabits(habitsData);
        } catch (err) {
          console.error("Error fetching habits: ", err);
        }
      }
    };
  
    fetchHabits();
  }, [user]);
  

  // Update showList when habits change
  useEffect(() => {
    setShowList(habits.length > 0);
    console.log('Habits updated:', habits); // Debugging
  }, [habits]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewHabit({ ...newHabit, [name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user) {
      try {
        await addDoc(collection(db, 'habits'), {
          name: newHabit.name,
          description: newHabit.description,
          userId: user.uid,
          progress: [],
          createdAt: new Date()
        });
        setNewHabit({ name: '', description: '' });
        // Refresh habits
        const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const habitsData = snapshot.docs.map(doc => {
          return {
            id: doc.id,
            ...doc.data()
          } as Habit;
        });
        setHabits(habitsData);
      } catch (err) {
        console.error("Error adding habit: ", err);
      }
    }
  };

  const handleCheckIn = async (habitId: string) => {
    if (user) {
      try {
        const date = new Date();
        const isoString = date.toISOString(); // Store ISO string in Firestore
        const habitRef = doc(db, 'habits', habitId);
        await updateDoc(habitRef, {
          progress: arrayUnion(isoString)
        });
        setHabits(habits.map(habit =>
          habit.id === habitId
            ? { ...habit, progress: [...habit.progress, isoString] }
            : habit
        ));
      } catch (err) {
        console.error("Error checking in: ", err);
      }
    }
  };
  
  const handleDeleteCheckIn = async (habitId: string, date: string) => {
    if (user) {
      try {
        const habitRef = doc(db, 'habits', habitId);
        await updateDoc(habitRef, {
          progress: arrayRemove(date)
        });
        setHabits(habits.map(habit =>
          habit.id === habitId
            ? { ...habit, progress: habit.progress.filter(d => d !== date) }
            : habit
        ));
      } catch (err) {
        console.error("Error deleting check-in: ", err);
      }
    }
  };
  

  const handleDeleteHabit = async (habitId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'habits', habitId));
        setHabits(habits.filter(habit => habit.id !== habitId));
      } catch (err) {
        console.error("Error deleting habit: ", err);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };
  const formatCheckInDate = (dateString: string) => {
    // Log the dateString for debugging
    console.log("Received date string:", dateString);
    
    // Convert ISO string to Date object
    const date = new Date(dateString);
  
    // Log the resulting Date object for debugging
    console.log("Converted date object:", date);
  
    if (isNaN(date.getTime())) {
      console.error("Invalid date value:", dateString);
      return "Invalid date";
    }
  
    // Return formatted date string
    return format(date, "MMMM dd, yyyy hh:mm a");
  };
  
  
  return (
    <div className="container">
      <div className="form-container">
        <h1>Habit Tracker</h1>
        <button onClick={handleLogout} className="habit-button">Log Out</button>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={newHabit.name}
            onChange={handleChange}
            placeholder="Habit Name"
            required
          />
          <textarea
            name="description"
            value={newHabit.description}
            onChange={handleChange}
            placeholder="Habit Description"
            required
          />
          <button type="submit" className="habit-button">Add Habit</button>
        </form>
      </div>
      <div className="list-container" style={{ display: showList ? 'block' : 'none' }}>
        <ul>
          {habits
            // .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(habit => (
              <li key={habit.id} className="habit-item">
                <div className="habit-details">
                  <h2>{habit.name}</h2>
                  <p>{habit.description}</p>
                </div>
                <div className="habit-buttons">
                  <button onClick={() => handleCheckIn(habit.id)} className="habit-button checkin-button">Check In</button>
                  <button onClick={() => handleDeleteHabit(habit.id)} className="habit-button delete-habit">Delete Habit</button>
                </div>
                <ul>
                  {habit.progress.map((date, index) => (
                    <li key={index} className="progress-item">
                      {formatCheckInDate(date)}
                      <button 
                        className="delete-checkin" 
                        onClick={() => handleDeleteCheckIn(habit.id, date)}
                      >
                        X
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
