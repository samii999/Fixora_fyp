import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

// Register new user
export const registerUser = async (email, password, role) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Save to Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email,
    role,
    createdAt: new Date(),
    verified: role === 'user' ? true : false // Optional: users auto-verified
  });

  return user;
};

// Login existing user
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Fetch user role
export const getUserRole = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data().role;
  }
  throw new Error('User not found in Firestore');
};

export { auth };
