
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

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

async function loadLogs() {
  const logList = document.getElementById("logList");
  logList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "event_logs"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = `[${data.timestamp.toDate().toLocaleString()}] ${data.type} - ${data.medicationId || "No Med"} - ${data.reason || ""}`;
    logList.appendChild(li);
  });
}

document.getElementById("clearLogs").addEventListener("click", async () => {
  const querySnapshot = await getDocs(collection(db, "event_logs"));
  for (const log of querySnapshot.docs) {
    await deleteDoc(doc(db, "event_logs", log.id));
  }
  alert("All logs deleted!");
  loadLogs();
});

loadLogs();
