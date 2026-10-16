// ==========================================
// CAMPUSLOST - MAIN JAVASCRIPT
// ==========================================


// ------------------------------------------
// SAMPLE DATA
// ------------------------------------------

 import { app } from "./firebase-config.js";
 import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const db = getFirestore(app);
const auth = getAuth(app);

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);

        reader.readAsDataURL(file);
    });
}

const defaultItems = [

    {
        id: 1,
        name: "Black Boat Earphones",
        type: "lost",
        category: "electronics",
        description: "Black wireless earphones in a small black case.",
        location: "Central Library",
        date: "2026-09-28"
    },

    {
        id: 2,
        name: "Blue College ID Card",
        type: "found",
        category: "documents",
        description: "Blue college ID card found near the cafeteria.",
        location: "Cafeteria",
        date: "2026-09-27"
    },

    {
        id: 3,
        name: "Casio Calculator",
        type: "lost",
        category: "electronics",
        description: "Scientific calculator with the name Rahul written on it.",
        location: "CSE Block",
        date: "2026-09-26"
    },

    {
        id: 4,
        name: "Black Wallet",
        type: "found",
        category: "accessories",
        description: "Black leather wallet found near the auditorium.",
        location: "Auditorium",
        date: "2026-09-28"
    }

];


// ------------------------------------------
// LOAD DATA
// ------------------------------------------

let items = [];

async function loadItems() {
    try {
        const snapshot = await getDocs(collection(db, "items"));

        items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log("Firebase items loaded:", items);

        displayItems();

    } catch (error) {
        console.error("Firebase load error:", error);

        items = defaultItems;
        displayItems();
    }
}


// Current report type
let currentReportType = "lost";


// ------------------------------------------
// SAVE DATA
// ------------------------------------------




// ------------------------------------------
// DISPLAY ITEMS
// ------------------------------------------

function displayItems() {

    const container =
        document.getElementById("itemsContainer");

    const searchInput =
        document.getElementById("searchInput");

    const typeFilter =
        document.getElementById("typeFilter");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const search =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const type =
        typeFilter
            ? typeFilter.value
            : "all";

    const selectedCategory =
        categoryFilter
            ? categoryFilter.value
            : "all";


    const filteredItems = items.filter(item => {

        const name =
            String(item.name || "").toLowerCase();

        const description =
            String(item.description || "").toLowerCase();

        const location =
            String(item.location || "").toLowerCase();

        const itemCategory =
            String(item.category || "").toLowerCase();

        const matchesSearch =
            search === "" ||
            name.includes(search) ||
            description.includes(search) ||
            location.includes(search) ||
            itemCategory.includes(search);

        const matchesType =
            type === "all" ||
            item.type === type;

        const matchesCategory =
            selectedCategory === "all" ||
            itemCategory === selectedCategory;

        return (
            matchesSearch &&
            matchesType &&
            matchesCategory
        );
    });


    container.innerHTML = "";


    if (filteredItems.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No items found 🔍</h3>
                <p>
                    Try changing your search or filters.
                </p>
            </div>
        `;

        return;
    }


    filteredItems.forEach(item => {

        const card =
            document.createElement("div");

        card.className = "item-card";

        card.onclick = () =>
            showDetails(item.id);

        const icon =
            getCategoryIcon(item.category);

        card.innerHTML = `

            <div class="item-icon">
                ${icon}
            </div>

            ${item.photo ? `
                <img
                    src="${item.photo}"
                    alt="${item.name || "Item"}"
                    style="width:100%; height:180px; object-fit:cover; border-radius:10px; margin-bottom:10px;"
                >
            ` : ""}

            <span class="status ${item.type}">
                ${(item.type || "").toUpperCase()}
            </span>

            <h3>
                ${item.name || "Unnamed item"}
            </h3>

            <p>
                📍 ${item.location || "Unknown location"}
            </p>

            <p>
                📅 ${formatDate(item.date)}
            </p>

        `;

        container.appendChild(card);

    });

}


// ------------------------------------------
// CATEGORY ICON
// ------------------------------------------

function getCategoryIcon(category) {

    const icons = {

        electronics: "🎧",

        documents: "🪪",

        accessories: "👛",

        books: "📚",

        others: "📦"

    };

    return icons[category] || "📦";

}


// ------------------------------------------
// FORMAT DATE
// ------------------------------------------

function formatDate(date) {

    if (!date) return "";

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// ------------------------------------------
// OPEN REPORT MODAL
// ------------------------------------------

function openReport(type) {
    if (!auth.currentUser) {
    alert("Please login first to report an item.");
    showLogin();
    return;
}

    currentReportType = type;



    const modal =
        document.getElementById("reportModal");


    const title =
        document.getElementById("modalTitle");


    if (type === "lost") {

        title.textContent =
            "😢 Report Lost Item";

    } else {

        title.textContent =
            "🎉 Report Found Item";

    }


    modal.classList.add("active");

}


// ------------------------------------------
// CLOSE REPORT
// ------------------------------------------

function closeReport() {

    document
        .getElementById("reportModal")
        .classList.remove("active");

}


// ------------------------------------------
// SUBMIT REPORT
// ------------------------------------------

document
    .getElementById("reportForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const newItem = {

            id: Date.now(),

            name:
                document
                    .getElementById("itemName")
                    .value,

            type:
                currentReportType,

            category:
                document
                    .getElementById("itemCategory")
                    .value,

            description:
                document
                    .getElementById("itemDescription")
                    .value,

            location:
                document
                    .getElementById("itemLocation")
                    .value,

            date:
                document
                    .getElementById("itemDate")
                    .value,
                    
            reportedBy: auth.currentUser
            ? auth.currentUser.email
                  : "Anonymous",

                  photo: document.getElementById("itemPhoto").files[0]
    ? await fileToBase64(document.getElementById("itemPhoto").files[0])
    : "",
        };


        const docRef = await addDoc(
    collection(db, "items"),
    newItem
);

items.unshift({
    id: docRef.id,
    ...newItem
});


        alert(
            currentReportType === "lost"
                ? "Lost item reported successfully! 🎉"
                : "Found item reported successfully! 🎉"
        );


        document
            .getElementById("reportForm")
            .reset();


        closeReport();


        displayItems();


        document
            .getElementById("browse")
            .scrollIntoView();

    });


// ------------------------------------------
// SHOW DETAILS
// ------------------------------------------

function showDetails(id) {

    const item =
        items.find(item => item.id === id);


    if (!item) return;


    const details =
        document.getElementById("detailsContent");


    const matches =
        findMatches(item);


    let matchHTML = "";


    if (matches.length > 0) {

        matchHTML = `

            <div class="match-box">

                <strong>
                    🔔 Possible Match Found!
                </strong>

                <p>
                    We found ${matches.length}
                    similar item(s) reported
                    on campus.
                </p>

            </div>

        `;

    }


    details.innerHTML = `

        <div class="detail-status ${item.type}">

            ${item.type === "lost"
                ? "🔴 LOST ITEM"
                : "🟢 FOUND ITEM"}

        </div>


        <h2 class="detail-title">
            ${item.name}
        </h2>


        ${matchHTML}


        <div class="detail-info">

            <strong>Category</strong>

            <p>
                ${item.category}
            </p>

        </div>


        <div class="detail-info">

            <strong>Description</strong>

            <p>
                ${item.description}
            </p>

        </div>


        <div class="detail-info">

            <strong>Location</strong>

            <p>
                📍 ${item.location}
            </p>

        </div>


        <div class="detail-info">

            <strong>Date</strong>

            <p>
                📅 ${formatDate(item.date)}
            </p>

        </div>


        <br>


        <button
            class="primary-btn full-btn"
            onclick="claimItem(${item.id})">

            ${item.type === "lost"
                ? "I Found This Item"
                : "This Might Be Mine"}

        </button>

    `;


    document
        .getElementById("detailsModal")
        .classList.add("active");

}


// ------------------------------------------
// CLOSE DETAILS
// ------------------------------------------

function closeDetails() {

    document
        .getElementById("detailsModal")
        .classList.remove("active");

}


// ------------------------------------------
// SMART MATCHING
// ------------------------------------------

function findMatches(item) {

    return items.filter(other => {

        // Don't match the item with itself
        if (other.id === item.id) {
            return false;
        }


        // Must be opposite type
        if (other.type === item.type) {
            return false;
        }


        let score = 0;


        // Same category
        if (
            other.category === item.category
        ) {

            score += 30;

        }


        // Similar words
        const itemWords =
            item.name
                .toLowerCase()
                .split(" ");

        const otherWords =
            other.name
                .toLowerCase()
                .split(" ");


        const commonWords =
            itemWords.filter(word =>
                otherWords.includes(word)
            );


        if (commonWords.length > 0) {

            score += 30;

        }


        // Same location
        if (
            other.location.toLowerCase() ===
            item.location.toLowerCase()
        ) {

            score += 25;

        }


        // Similar date
        const date1 =
            new Date(item.date);

        const date2 =
            new Date(other.date);


        const difference =
            Math.abs(
                date1 - date2
            ) /
            (1000 * 60 * 60 * 24);


        if (difference <= 2) {

            score += 15;

        }


        return score >= 60;

    });

}


// ------------------------------------------
// CLAIM ITEM
// ------------------------------------------

async function claimItem(id) {

    const user = auth.currentUser;

    if (!user) {
        alert("Please login first.");
        showLogin();
        return;
    }

    const item =
        items.find(item => item.id === id);

    if (!item) {
        alert("Item not found.");
        return;
    }

    const message =
        prompt(
            "Why do you think this is your item?"
        );

    if (!message) {
        alert("Please enter a message.");
        return;
    }

    try {

        await addDoc(
            collection(db, "claims"),
            {
                itemId: item.id,
                itemName: item.name,
                reportedBy: item.reportedBy || "Unknown",
                claimedBy: user.email,
                message: message,
                status: "pending",
                createdAt: new Date().toISOString()
            }
        );

        alert(
            "Claim submitted successfully! 🎉\n\n" +
            "The student who reported this item can now review your claim."
        );

        closeDetails();

    } catch (error) {

        console.error("Claim error:", error);

        alert(
            "Could not submit claim: " +
            error.message
        );

    }
}


// ------------------------------------------
// LOGIN
// ------------------------------------------
function showMyReports() {

    const user = auth.currentUser;

    if (!user) {
        alert("Please login first.");
        showLogin();
        return;
    }

    const myItems = items.filter(
        item => item.reportedBy === user.email
    );

    if (myItems.length === 0) {
        alert("You haven't reported any items yet.");
        return;
    }

    const container =
        document.getElementById("itemsContainer");

    container.innerHTML = "";

    myItems.forEach(item => {

        const card =
            document.createElement("div");

        card.className = "item-card";

        card.onclick = () =>
            showDetails(item.id);

        const icon =
            getCategoryIcon(item.category);

        card.innerHTML = `

            ${item.photo ? `
                <img
                    src="${item.photo}"
                    alt="${item.name}"
                    style="width:100%; height:180px; object-fit:cover; border-radius:10px; margin-bottom:10px;"
                >
            ` : ""}

            <div class="item-icon">
                ${icon}
            </div>

            <span class="status ${item.type}">
                ${item.type.toUpperCase()}
            </span>

            <h3>
                ${item.name}
            </h3>

            <p>
                📍 ${item.location}
            </p>

            <p>
                📅 ${formatDate(item.date)}
            </p>

        `;

        container.appendChild(card);

    });

    document
        .getElementById("browse")
        .scrollIntoView();
}
function showAllItems() {

    // Clear any previous search
    document.getElementById("searchInput").value = "";

    // Reset filters
    document.getElementById("typeFilter").value = "all";
    document.getElementById("categoryFilter").value = "all";

    // Show all items again
    displayItems();

    // Scroll to Browse Items
    document
        .getElementById("browse")
        .scrollIntoView();
}


async function showClaims() {

    const user = auth.currentUser;

    if (!user) {
        alert("Please login first.");
        showLogin();
        return;
    }

    try {

        const snapshot =
            await getDocs(collection(db, "claims"));

        const claims = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(
                claim => claim.reportedBy === user.email
            );

        const container =
            document.getElementById("itemsContainer");

        container.innerHTML = "";

        if (claims.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>No claims yet 📭</h3>
                    <p>
                        Nobody has claimed your reported items yet.
                    </p>
                </div>
            `;

        } else {

            claims.forEach(claim => {

                const card =
                    document.createElement("div");

                card.className = "item-card";

                card.innerHTML = `

                    <div class="item-icon">
                        🔔
                    </div>

                    <span class="status ${claim.status}">
                        ${claim.status.toUpperCase()}
                    </span>

                    <h3>
                        ${claim.itemName}
                    </h3>

                    <p>
                        👤 Claimed by: ${claim.claimedBy}
                    </p>

                    <p>
                        💬 ${claim.message}
                    </p>

                    ${claim.status === "pending" ? `
    <div style="margin-top:15px; display:flex; gap:10px;">

        <button
            class="primary-btn"
            onclick="updateClaimStatus('${claim.id}', 'approved')"
        >
            ✅ Approve
        </button>

        <button
            class="secondary-btn"
            onclick="updateClaimStatus('${claim.id}', 'rejected')"
        >
            ❌ Reject
        </button>

    </div>
` : ""}

                `;

                container.appendChild(card);

            });

        }

        document
            .getElementById("browse")
            .scrollIntoView();

    } catch (error) {

        console.error("Claims error:", error);

        alert(
            "Could not load claims: " +
            error.message
        );

    }
}


async function updateDashboardStats() {
    try {
        // Total lost/found items
        const itemsSnapshot = await getDocs(
            collection(db, "items")
        );

        let lostCount = 0;
        let foundCount = 0;

        itemsSnapshot.forEach((docSnap) => {
            const item = docSnap.data();

            if (item.type === "lost") {
                lostCount++;
            }

            if (item.type === "found") {
                foundCount++;
            }
        });

        // Claims
        const claimsSnapshot = await getDocs(
            collection(db, "claims")
        );

        const totalItems = lostCount + foundCount;

        document.getElementById("totalItemsCount").textContent =
            totalItems;

        document.getElementById("lostItemsCount").textContent =
            lostCount;

        document.getElementById("foundItemsCount").textContent =
            foundCount;

        document.getElementById("claimsCount").textContent =
            claimsSnapshot.size;

    } catch (error) {
        console.error(
            "Dashboard stats error:",
            error
        );
    }
}

async function updateClaimStatus(claimId, newStatus) {

    try {

        await updateDoc(
            doc(db, "claims", claimId),
            {
                status: newStatus
            }
        );

        alert(
            newStatus === "approved"
                ? "Claim approved! 🎉"
                : "Claim rejected."
        );

        showClaims();

    } catch (error) {

        console.error(
            "Claim update error:",
            error
        );

        alert(
            "Could not update claim: " +
            error.message
        );

    }
}
function showLogin() {

    document
        .getElementById("loginModal")
        .classList.add("active");

}


function closeLogin() {

    document
        .getElementById("loginModal")
        .classList.remove("active");

}


async function loginUser() {

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        alert("Login successful! 🎉");

        closeLogin();

    } catch (error) {

        console.error("Login error:", error);

        alert(
            "Login failed: " +
            error.message
        );

    }

    
}

async function logoutUser() {

    try {

        await signOut(auth);

        alert("You have been logged out.");

    } catch (error) {

        console.error("Logout error:", error);

        alert(
            "Logout failed: " +
            error.message
        );

    }
}

// ------------------------------------------
// INITIAL LOAD
// ------------------------------------------

loadItems();

window.openReport = openReport;
window.closeReport = closeReport;
window.showDetails = showDetails;
window.closeDetails = closeDetails;
window.claimItem = claimItem;
window.showLogin = showLogin;
window.closeLogin = closeLogin;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.showMyReports = showMyReports;
window.showClaims = showClaims;
window.showAllItems = showAllItems;
window.displayItems = displayItems;

window.updateClaimStatus = updateClaimStatus;

updateDashboardStats();


onAuthStateChanged(auth, (user) => {

    const authButton =
        document.getElementById("authButton");

    const userIndicator =
        document.getElementById("userIndicator");

    if (user) {

        console.log("Logged in user:", user.email);

        if (authButton) {
            authButton.textContent = "Logout";
            authButton.onclick = logoutUser;
        }

        if (userIndicator) {
            userIndicator.textContent =
                "👤 " + user.email;
        }

    } else {

        console.log("No user logged in");

        if (authButton) {
            authButton.textContent = "Login";
            authButton.onclick = showLogin;
        }

        if (userIndicator) {
            userIndicator.textContent = "";
        }

    }

});