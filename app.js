// =========================
// 🔹 Firebase Initialization
// =========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  orderBy, 
  query,
  serverTimestamp,
  Timestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_z4sfdgMGXjrKaGkUN4312Gw6gV10DKk",
  authDomain: "campus-pulse-6934d.firebaseapp.com",
  projectId: "campus-pulse-6934d",
  storageBucket: "campus-pulse-6934d.firebasestorage.app",
  messagingSenderId: "31365095682",
  appId: "1:31365095682:web:a0a7dbd07282860cc8e21b",
  measurementId: "G-GB03XWJEST"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Auto sign in anonymously
signInAnonymously(auth)
  .then(() => {
    console.log("✅ Signed in anonymously");
  })
  .catch((error) => {
    console.error("❌ Auth error:", error);
  });

// =========================
// 🚍 Local Backup Array
let requests = [];

// =========================
// 🎓 STUDENT: Add Event function
window.addEvent = function() {
  const title = document.getElementById("eventTitle")?.value.trim();
  const start = document.getElementById("eventStart")?.value;
  const end = document.getElementById("eventEnd")?.value;
  const msg = document.getElementById("eventMsg");

  if (!title || !start || !end) {
    if (msg) {
      msg.innerText = "❌ Please fill all fields!";
      msg.style.color = "red";
    }
    return;
  }

  // Get current logged-in user
  const user = auth.currentUser;
  if (!user) {
    if (msg) {
      msg.innerText = "⏳ Authenticating... Please wait and try again in a moment.";
      msg.style.color = "orange";
    }
    // Don't retry automatically - let user click again
    return;
  }

  if (msg) {
    msg.innerText = "💾 Saving event...";
    msg.style.color = "blue";
  }

  addDoc(collection(db, "events"), {
    studentId: user.uid,
    title: title,
    startTime: serverTimestampFromDate(start),
    endTime: serverTimestampFromDate(end),
    createdAt: serverTimestamp()
  })
    .then(() => {
      if (msg) {
        msg.innerText = "✅ Event added successfully!";
        msg.style.color = "green";
      }
      document.getElementById("eventTitle").value = "";
      document.getElementById("eventStart").value = "";
      document.getElementById("eventEnd").value = "";
      
      // Reload events list
      setTimeout(() => {
        loadEvents();
      }, 500);
    })
    .catch((err) => {
      if (msg) {
        if (err.code === 'permission-denied') {
          msg.innerHTML = "❌ <strong>Permission Error!</strong><br>" +
            "Fix Firestore Rules in Firebase Console.<br>" +
            "See FIX_PERMISSIONS.md for instructions!";
        } else {
          msg.innerText = "❌ Error: " + err.message;
        }
        msg.style.color = "red";
      }
      console.error(err);
    });
}

// Helper to convert datetime-local string to Firestore Timestamp
function serverTimestampFromDate(dateStr) {
  const date = new Date(dateStr);
  return Timestamp.fromDate(date);
}

// =========================
// 🎓 STUDENT: Load Events
function loadEvents() {
  const eventMsg = document.getElementById("eventMsg");
  if (!eventMsg) return;

  console.log("📅 Loading student events...");

  const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
  
  onSnapshot(q, (snapshot) => {
    console.log(`📦 Received ${snapshot.size} events`);

    if (snapshot.empty) {
      eventMsg.innerHTML = `
        <p style="color: #666; text-align: center; padding: 1rem;">
          📭 No events added yet<br>
          <small>Add your first event using the form above!</small>
        </p>
      `;
      return;
    }

    let eventsHtml = "<div style='max-height: 300px; overflow-y: auto;'>";
    let eventCount = 0;
    
    snapshot.forEach((docSnap) => {
      const event = docSnap.data();
      const startDate = event.startTime?.toDate();
      const endDate = event.endTime?.toDate();
      
      eventCount++;
      
      // Determine if event is upcoming, today, or past
      const now = new Date();
      let statusBadge = "";
      let bgColor = "#f9f9f9";
      
      if (startDate) {
        if (startDate > now) {
          statusBadge = "<span style='background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;'>📅 Upcoming</span>";
          bgColor = "rgba(52, 152, 219, 0.05)";
        } else if (startDate.toDateString() === now.toDateString()) {
          statusBadge = "<span style='background: #27ae60; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;'>⭐ Today</span>";
          bgColor = "rgba(39, 174, 96, 0.05)";
        } else {
          statusBadge = "<span style='background: #95a5a6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;'>✓ Past</span>";
          bgColor = "rgba(149, 165, 166, 0.05)";
        }
      }
      
      eventsHtml += `
        <div style='background: ${bgColor}; padding: 1rem; margin-bottom: 0.5rem; border-radius: 8px; border-left: 4px solid #667eea;'>
          <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;'>
            <strong style='color: #667eea; font-size: 1.1rem;'>${event.title}</strong>
            ${statusBadge}
          </div>
          <div style='color: #666; font-size: 0.9rem;'>
            <div>🕐 <strong>Start:</strong> ${startDate ? startDate.toLocaleString() : 'N/A'}</div>
            <div>🕐 <strong>End:</strong> ${endDate ? endDate.toLocaleString() : 'N/A'}</div>
          </div>
        </div>
      `;
    });
    
    eventsHtml += "</div>";
    eventsHtml += `<p style='text-align: center; color: #667eea; font-weight: 600; margin-top: 0.5rem;'>Total Events: ${eventCount}</p>`;
    
    eventMsg.innerHTML = eventsHtml;
    eventMsg.style.color = "#333";
  }, (error) => {
    console.error("❌ Error loading events:", error);
    eventMsg.innerHTML = `
      <p style="color: red; text-align: center;">
        ❌ Error loading events: ${error.message}
      </p>
    `;
  });
}

// =========================
// 🎓 STUDENT: Request Pickup
window.requestPickup = function() {
  const stopElement = document.getElementById("pickupStop");
  const statusElement = document.getElementById("requestStatus");
  
  if (!stopElement) {
    console.error("pickupStop element not found");
    return;
  }
  
  const stop = stopElement.value;
  
  if (statusElement) {
    statusElement.innerText = "Sending request...";
    statusElement.style.color = "orange";
  }

  addDoc(collection(db, "pickupRequests"), {
    stop: stop,
    status: "Pending",
    timestamp: serverTimestamp()
  })
    .then(() => {
      if (statusElement) {
        statusElement.innerText = "✅ Pending: Pickup requested at " + stop;
        statusElement.style.color = "green";
      }
      alert("Pickup Request Sent!");
    })
    .catch(err => {
      console.error("Error requesting pickup:", err);
      if (statusElement) {
        if (err.code === 'permission-denied') {
          statusElement.innerHTML = "❌ <strong>Permission Error!</strong><br>" +
            "Go to Firebase Console → Firestore Database → Rules<br>" +
            "Change to: <code>allow read, write: if true;</code><br>" +
            "Then click Publish. See FIX_PERMISSIONS.md for help!";
        } else {
          statusElement.innerText = "❌ Error: " + err.message;
        }
        statusElement.style.color = "red";
      }
    });
}

// =========================
// 🎓 STUDENT: Load Transport Alerts
function loadTransportAlerts() {
  const alertsList = document.getElementById("alertsList");
  if (!alertsList) return;

  console.log("🚨 Loading transport alerts...");

  const q = query(collection(db, "transportReports"), orderBy("timestamp", "desc"));
  
  onSnapshot(q, (snapshot) => {
    alertsList.innerHTML = "";

    if (snapshot.empty) {
      alertsList.innerHTML = `
        <li style="text-align: center; color: #666; padding: 1rem;">
          ✅ No alerts - All systems running smoothly!
        </li>
      `;
      return;
    }

    let alertCount = 0;
    const maxAlerts = 10; // Show only recent 10 alerts

    snapshot.forEach((docSnap) => {
      if (alertCount >= maxAlerts) return;
      
      const report = docSnap.data();
      const timestamp = report.timestamp?.toDate();
      const li = document.createElement("li");
      
      let statusEmoji = "🟢";
      let statusColor = "#27ae60";
      let statusBg = "rgba(39, 174, 96, 0.1)";
      
      if (report.status === "delayed") {
        statusEmoji = "🟡";
        statusColor = "#f39c12";
        statusBg = "rgba(243, 156, 18, 0.1)";
      } else if (report.status === "cancelled") {
        statusEmoji = "🔴";
        statusColor = "#e74c3c";
        statusBg = "rgba(231, 76, 60, 0.1)";
      }
      
      li.style.background = statusBg;
      li.style.borderLeft = `4px solid ${statusColor}`;
      li.style.padding = "0.8rem";
      li.style.marginBottom = "0.5rem";
      li.style.borderRadius = "8px";
      
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="font-weight: bold; color: ${statusColor}; margin-bottom: 0.3rem;">
              ${statusEmoji} ${report.type.toUpperCase()}
            </div>
            <div style="color: #666; font-size: 0.9rem; margin-bottom: 0.3rem;">
              <strong>Route:</strong> ${report.route}
            </div>
            <div style="color: ${statusColor}; font-weight: 600; text-transform: uppercase; font-size: 0.85rem;">
              Status: ${report.status}
            </div>
          </div>
          <div style="color: #999; font-size: 0.75rem; text-align: right;">
            ${timestamp ? timestamp.toLocaleTimeString() : 'N/A'}
          </div>
        </div>
      `;
      
      alertsList.appendChild(li);
      alertCount++;
    });

    // Add a summary at the bottom
    if (snapshot.size > maxAlerts) {
      const moreLi = document.createElement("li");
      moreLi.style.textAlign = "center";
      moreLi.style.color = "#667eea";
      moreLi.style.fontWeight = "600";
      moreLi.innerHTML = `+ ${snapshot.size - maxAlerts} more alerts`;
      alertsList.appendChild(moreLi);
    }
  }, (error) => {
    console.error("❌ Error loading alerts:", error);
    alertsList.innerHTML = `
      <li style="color: red; text-align: center;">
        ❌ Error loading alerts: ${error.message}
      </li>
    `;
  });
}

// =========================
// 🎓 STUDENT: Monitor Own Requests
function monitorStudentRequests() {
  const requestStatusElement = document.getElementById("requestStatus");
  if (!requestStatusElement) return;

  console.log("👀 Monitoring student requests...");

  const q = query(collection(db, "pickupRequests"), orderBy("timestamp", "desc"));
  
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      requestStatusElement.innerHTML = `
        <p style="color: #666; text-align: center;">
          📭 No request yet<br>
          <small>Request a pickup to see status here</small>
        </p>
      `;
      return;
    }

    // Get the most recent request
    const latestRequest = snapshot.docs[0].data();
    const timestamp = snapshot.docs[0].data().timestamp?.toDate();
    
    let statusIcon = "⏳";
    let statusColor = "#f39c12";
    let statusText = "Pending";
    let actionText = "Waiting for driver...";
    
    if (latestRequest.status === "Accepted") {
      statusIcon = "🚗";
      statusColor = "#3498db";
      statusText = "Accepted";
      actionText = "Driver is on the way!";
    } else if (latestRequest.status === "Completed") {
      statusIcon = "✅";
      statusColor = "#27ae60";
      statusText = "Completed";
      actionText = "Pickup completed successfully!";
    }
    
    requestStatusElement.innerHTML = `
      <div style="text-align: center; padding: 1rem;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">${statusIcon}</div>
        <div style="font-size: 1.3rem; font-weight: bold; color: ${statusColor}; margin-bottom: 0.5rem;">
          ${statusText}
        </div>
        <div style="color: #666; margin-bottom: 0.5rem;">
          <strong>Stop:</strong> ${latestRequest.stop}
        </div>
        <div style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">
          ${actionText}
        </div>
        <div style="color: #999; font-size: 0.8rem;">
          Requested: ${timestamp ? timestamp.toLocaleTimeString() : 'N/A'}
        </div>
      </div>
    `;
  }, (error) => {
    console.error("❌ Error monitoring requests:", error);
    requestStatusElement.innerHTML = `
      <p style="color: red;">Error: ${error.message}</p>
    `;
  });
}

// =========================
// 🧑‍✈️ DRIVER: Update Route Status
window.updateRoute = function(status) {
  const routeStatusElement = document.getElementById("routeStatus");
  if (routeStatusElement) {
    routeStatusElement.innerText = status;
  }
}

// =========================
// 🧑‍✈️ DRIVER: Submit Transport Report
window.submitReport = function() {
  const reportType = document.getElementById("reportType")?.value;
  const reportRoute = document.getElementById("reportRoute")?.value.trim();
  const reportStatus = document.getElementById("reportStatus")?.value;
  const msg = document.getElementById("reportMsg");

  if (!reportRoute) {
    if (msg) {
      msg.innerText = "Please enter route/location!";
      msg.style.color = "red";
    }
    return;
  }

  const user = auth.currentUser;
  const driverId = user ? user.uid : "anonymous";

  if (msg) {
    msg.innerText = "Submitting report...";
    msg.style.color = "orange";
  }

  addDoc(collection(db, "transportReports"), {
    type: reportType,
    route: reportRoute,
    status: reportStatus,
    driverId: driverId,
    timestamp: serverTimestamp()
  })
    .then(() => {
      if (msg) {
        msg.innerText = "✅ Report submitted successfully!";
        msg.style.color = "green";
      }
      document.getElementById("reportRoute").value = "";
    })
    .catch((err) => {
      if (msg) {
        if (err.code === 'permission-denied') {
          msg.innerHTML = "❌ <strong>Permission Denied!</strong><br>" +
            "Update Firestore Rules: <code>allow read, write: if true;</code><br>" +
            "See FIX_PERMISSIONS.md guide!";
        } else {
          msg.innerText = "❌ Error: " + err.message;
        }
        msg.style.color = "red";
      }
      console.error(err);
    });
}

// =========================
// 🧑‍✈️ DRIVER: Show Pickup Requests Realtime
function loadDriverRequests() {
  const requestListElement = document.getElementById("requestList");
  if (!requestListElement) {
    console.log("❌ requestList element not found");
    return;
  }

  console.log("📋 Loading pickup requests for driver...");
  
  const q = query(collection(db, "pickupRequests"), orderBy("timestamp"));
  
  onSnapshot(q, (snapshot) => {
    console.log(`📦 Received ${snapshot.size} pickup requests`);
    const list = document.getElementById("requestList");
    list.innerHTML = "";
    requests = [];

    if (snapshot.empty) {
      list.innerHTML = "<li>No requests yet</li>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const req = docSnap.data();
      req.id = docSnap.id;
      requests.push(req);

      const li = document.createElement("li");
      
      let statusColor = "#ffa500";
      if (req.status === "Accepted") statusColor = "#3498db";
      if (req.status === "Completed") statusColor = "#27ae60";
      
      li.innerHTML = `
        <span style="color: ${statusColor}; font-weight: bold;">${req.stop}</span> → 
        <span style="color: ${statusColor};">${req.status}</span>
        ${req.status === "Pending" ? `<button onclick="acceptRequest('${req.id}')">Accept</button>` : ''}
        ${req.status === "Accepted" ? `<button onclick="completeRequest('${req.id}')">Complete</button>` : ''}
      `;
      list.appendChild(li);
    });
  }, (error) => {
    console.error("❌ Error loading requests:", error);
    const list = document.getElementById("requestList");
    list.innerHTML = `<li style="color: red;">Error loading requests: ${error.message}</li>`;
  });
}

// =========================
// 🧑‍✈️ DRIVER: Accept / Complete Request
window.acceptRequest = function(id) {
  const requestDoc = doc(db, "pickupRequests", id);
  
  updateDoc(requestDoc, {
    status: "Accepted"
  })
    .then(() => {
      alert("✅ Request Accepted!");
      updateRoute("Reached Stop");
    })
    .catch(err => {
      console.error("Error accepting request:", err);
      alert("❌ Error: " + err.message);
    });
}

window.completeRequest = function(id) {
  const requestDoc = doc(db, "pickupRequests", id);
  
  updateDoc(requestDoc, {
    status: "Completed"
  })
    .then(() => {
      alert("✅ Pickup Completed!");
      updateRoute("Route Running");
    })
    .catch(err => {
      console.error("Error completing request:", err);
      alert("❌ Error: " + err.message);
    });
}

// =========================
// 🔧 ADMIN: Load All Reports
function loadAllReports() {
  const reportsList = document.getElementById("adminReportsList");
  if (!reportsList) return;

  const q = query(collection(db, "transportReports"), orderBy("timestamp", "desc"));
  
  onSnapshot(q, (snapshot) => {
    reportsList.innerHTML = "";

    if (snapshot.empty) {
      reportsList.innerHTML = "<li>No reports yet</li>";
      return;
    }

    let onTimeCount = 0;
    let delayedCount = 0;
    let cancelledCount = 0;

    snapshot.forEach((docSnap) => {
      const report = docSnap.data();
      const li = document.createElement("li");
      const timestamp = report.timestamp?.toDate();
      
      // Count statuses for statistics
      if (report.status === 'on-time') onTimeCount++;
      if (report.status === 'delayed') delayedCount++;
      if (report.status === 'cancelled') cancelledCount++;
      
      li.innerHTML = `
        <strong>${report.type.toUpperCase()}</strong>: ${report.route}<br>
        Status: <span style="color: ${getStatusColor(report.status)};">${report.status}</span><br>
        Time: ${timestamp ? timestamp.toLocaleString() : 'N/A'}
      `;
      reportsList.appendChild(li);
    });

    // Update report statistics
    updateReportStats(onTimeCount, delayedCount, cancelledCount);
  });
}

// =========================
// 🔧 ADMIN: Update Report Statistics
function updateReportStats(onTime, delayed, cancelled) {
  const onTimeElement = document.getElementById("onTimeReports");
  const delayedElement = document.getElementById("delayedReports");
  const cancelledElement = document.getElementById("cancelledReports");

  if (onTimeElement) onTimeElement.innerText = onTime;
  if (delayedElement) delayedElement.innerText = delayed;
  if (cancelledElement) cancelledElement.innerText = cancelled;
}

// =========================
// 🔧 ADMIN: Load All Pickup Requests
function loadAllPickupRequests() {
  const pickupsList = document.getElementById("adminPickupsList");
  if (!pickupsList) return;

  const q = query(collection(db, "pickupRequests"), orderBy("timestamp", "desc"));
  
  onSnapshot(q, (snapshot) => {
    pickupsList.innerHTML = "";

    if (snapshot.empty) {
      pickupsList.innerHTML = "<li>No pickup requests yet</li>";
      updatePickupStats(0, 0, 0);
      return;
    }

    let totalCount = 0;
    let pendingCount = 0;
    let acceptedCount = 0;
    let completedCount = 0;

    snapshot.forEach((docSnap) => {
      const req = docSnap.data();
      const li = document.createElement("li");
      const timestamp = req.timestamp?.toDate();
      
      totalCount++;
      
      // Count by status
      if (req.status === 'Pending') pendingCount++;
      if (req.status === 'Accepted') acceptedCount++;
      if (req.status === 'Completed') completedCount++;
      
      li.innerHTML = `
        <strong>${req.stop}</strong><br>
        Status: <span style="color: ${getStatusColor(req.status)};">${req.status}</span><br>
        Time: ${timestamp ? timestamp.toLocaleString() : 'N/A'}
      `;
      pickupsList.appendChild(li);
    });

    // Update statistics
    updatePickupStats(totalCount, pendingCount, acceptedCount, completedCount);
  });
}

// =========================
// 🔧 ADMIN: Update Pickup Statistics
function updatePickupStats(total, pending, accepted, completed) {
  const totalElement = document.getElementById("totalRequests");
  const pendingElement = document.getElementById("pendingRequests");
  const acceptedElement = document.getElementById("acceptedRequests");
  const completedElement = document.getElementById("completedRequests");

  if (totalElement) totalElement.innerText = total;
  if (pendingElement) pendingElement.innerText = pending;
  if (acceptedElement) acceptedElement.innerText = accepted;
  if (completedElement) completedElement.innerText = completed;
}

// =========================
// 🔧 ADMIN: Load All Events
function loadAllEvents() {
  const eventsList = document.getElementById("adminEventsList");
  if (!eventsList) return;

  const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
  
  onSnapshot(q, (snapshot) => {
    eventsList.innerHTML = "";

    if (snapshot.empty) {
      eventsList.innerHTML = "<li>No events scheduled yet</li>";
      updateEventStats(0, 0);
      return;
    }

    let todayCount = 0;
    let upcomingCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    snapshot.forEach((docSnap) => {
      const event = docSnap.data();
      const li = document.createElement("li");
      const startDate = event.startTime?.toDate();
      const endDate = event.endTime?.toDate();
      
      // Count today's and upcoming events
      if (startDate) {
        const eventDay = new Date(startDate);
        eventDay.setHours(0, 0, 0, 0);
        
        if (eventDay.getTime() === today.getTime()) {
          todayCount++;
        } else if (eventDay > today) {
          upcomingCount++;
        }
      }
      
      li.innerHTML = `
        <strong>${event.title}</strong><br>
        Start: ${startDate ? startDate.toLocaleString() : 'N/A'}<br>
        End: ${endDate ? endDate.toLocaleString() : 'N/A'}
      `;
      eventsList.appendChild(li);
    });

    updateEventStats(todayCount, upcomingCount);
  });
}

// =========================
// 🔧 ADMIN: Update Event Statistics
function updateEventStats(today, upcoming) {
  const todayElement = document.getElementById("todayEvents");
  const upcomingElement = document.getElementById("upcomingEvents");

  if (todayElement) todayElement.innerText = today;
  if (upcomingElement) upcomingElement.innerText = upcoming;
}

// Helper function for status colors
function getStatusColor(status) {
  switch(status?.toLowerCase()) {
    case 'pending': return '#ffa500';
    case 'accepted': return '#3498db';
    case 'completed': return '#27ae60';
    case 'on-time': return '#27ae60';
    case 'delayed': return '#ffa500';
    case 'cancelled': return '#e74c3c';
    default: return '#666';
  }
}

// =========================
// 🎓 STUDENT: Update Quick Stats
function updateStudentStats() {
  // Count events
  const eventsQuery = query(collection(db, "events"), orderBy("createdAt", "desc"));
  onSnapshot(eventsQuery, (snapshot) => {
    const myEventsCount = document.getElementById("myEventsCount");
    if (myEventsCount) {
      myEventsCount.innerText = snapshot.size;
    }
  });

  // Count requests
  const requestsQuery = query(collection(db, "pickupRequests"), orderBy("timestamp", "desc"));
  onSnapshot(requestsQuery, (snapshot) => {
    const myRequestsCount = document.getElementById("myRequestsCount");
    if (myRequestsCount) {
      myRequestsCount.innerText = snapshot.size;
    }
  });

  // Count active alerts (delayed or cancelled only)
  const alertsQuery = query(collection(db, "transportReports"), orderBy("timestamp", "desc"));
  onSnapshot(alertsQuery, (snapshot) => {
    const alertsCount = document.getElementById("alertsCount");
    if (alertsCount) {
      let activeAlerts = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'delayed' || data.status === 'cancelled') {
          activeAlerts++;
        }
      });
      alertsCount.innerText = activeAlerts;
    }
  });
}

// =========================
// 🎓 STUDENT: Load All Requests (for "All Active Requests" section)
function loadAllStudentRequests() {
  const requestList = document.getElementById("requestList");
  if (!requestList) return;

  console.log("📋 Loading all pickup requests...");

  const q = query(collection(db, "pickupRequests"), orderBy("timestamp", "desc"));
  
  onSnapshot(q, (snapshot) => {
    requestList.innerHTML = "";

    if (snapshot.empty) {
      requestList.innerHTML = `
        <li style="text-align: center; color: #666; padding: 1rem;">
          📭 No active requests yet
        </li>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const req = docSnap.data();
      const timestamp = req.timestamp?.toDate();
      const li = document.createElement("li");
      
      let statusColor = "#f39c12";
      let statusIcon = "⏳";
      let statusBg = "rgba(243, 156, 18, 0.1)";
      
      if (req.status === "Accepted") {
        statusColor = "#3498db";
        statusIcon = "🚗";
        statusBg = "rgba(52, 152, 219, 0.1)";
      } else if (req.status === "Completed") {
        statusColor = "#27ae60";
        statusIcon = "✅";
        statusBg = "rgba(39, 174, 96, 0.1)";
      }
      
      li.style.background = statusBg;
      li.style.borderLeft = `4px solid ${statusColor}`;
      li.style.padding = "0.8rem";
      li.style.marginBottom = "0.5rem";
      li.style.borderRadius = "8px";
      
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #333; margin-bottom: 0.3rem;">
              📍 ${req.stop}
            </div>
            <div style="color: ${statusColor}; font-weight: 600; font-size: 0.9rem;">
              ${statusIcon} ${req.status}
            </div>
          </div>
          <div style="color: #999; font-size: 0.75rem; text-align: right;">
            ${timestamp ? timestamp.toLocaleTimeString() : 'N/A'}
          </div>
        </div>
      `;
      
      requestList.appendChild(li);
    });
  }, (error) => {
    console.error("❌ Error loading requests:", error);
    requestList.innerHTML = `
      <li style="color: red; text-align: center;">
        ❌ Error loading requests: ${error.message}
      </li>
    `;
  });
}

// =========================
// 🎬 Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 App initialized - DOMContentLoaded fired");
  
  // Check which page we're on and initialize accordingly
  if (document.getElementById("eventMsg")) {
    console.log("📚 Student page detected");
    updateStudentStats();
    loadEvents();
    loadTransportAlerts();
    monitorStudentRequests();
    loadAllStudentRequests();
  }
  
  if (document.getElementById("reportMsg")) {
    console.log("🚗 Driver page detected");
    loadDriverRequests();
  }
  
  if (document.getElementById("adminReportsList")) {
    console.log("👔 Admin page detected");
    loadAllReports();
    loadAllPickupRequests();
    loadAllEvents();
  }
  
  console.log("✅ Page-specific initialization complete");
});

console.log("✅ Firebase initialized and app.js loaded");