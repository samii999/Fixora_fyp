import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
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
    verified: false,
    emailVerified: false,
  });

  await sendEmailVerification(user);

  return user;
};

// Login existing user
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Refresh the user's emailVerified state in case they just verified
  try {
    if (user && typeof user.reload === 'function') {
      await user.reload();
    }
  } catch (e) {
    // Non-fatal; continue with best effort
  }

  // Allow legacy accounts that pre-date verification, but block new accounts that are explicitly unverified
  if (!user.emailVerified) {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      const explicitlyUnverified = data.emailVerified === false || data.verified === false;

      if (explicitlyUnverified) {
        await signOut(auth);
        throw new Error('Please verify your email to continue.');
      }

      // Grandfather legacy accounts by marking them verified for future logins
      await updateDoc(userRef, { emailVerified: true, verified: true });
    }
  }

  // If email is verified in Firebase, persist flags in Firestore
  if (user.emailVerified) {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { emailVerified: true, verified: true });
  }

  return user;
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
