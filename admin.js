
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAyrVTrTAjnqLeu8Y83WNua97shgF_yEBc",
  authDomain: "iot-medicine-cabinet.firebaseapp.com",
  projectId: "iot-medicine-cabinet",
  storageBucket: "iot-medicine-cabinet.firebasestorage.app",
  messagingSenderId: "1028581134919",
  appId: "1:1028581134919:web:a910a2ea9d610a3d551762",
  measurementId: "G-RBFS89HHWH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.addMedication = async function () {
  const name = document.getElementById("medName").value;
  const notes = document.getElementById("medNotes").value;
  const dose = document.getElementById("medDose").value;

  try {
    const docRef = await addDoc(collection(db, "medications"), {
      name,
      notes,
      defaultDose: dose,
      createdAt: Timestamp.now()
    });
    alert("Medication added! ID: " + docRef.id);
  } catch (e) {
    console.error("Error adding medication:", e);
  }
};

window.addSchedule = async function () {
  const day = document.getElementById("schedDay").value;
  const time = document.getElementById("schedTime").value;
  const medId = document.getElementById("schedMedId").value;
  const dose = document.getElementById("schedDose").value;

  try {
    await addDoc(collection(db, "schedules"), {
      day,
      time,
      medicationId: medId,
      dose,
      createdAt: Timestamp.now()
    });
    alert("Schedule added!");
  } catch (e) {
    console.error("Error adding schedule:", e);
  }
};

window.logEvent = async function () {
  const type = document.getElementById("eventType").value;
  const medId = document.getElementById("eventMed").value;
  const reason = document.getElementById("eventReason").value;

  try {
    await addDoc(collection(db, "event_logs"), {
      type,
      medicationId: medId || null,
      reason,
      timestamp: Timestamp.now()
    });
    alert("Event logged!");
  } catch (e) {
    console.error("Error logging event:", e);
  }
};
