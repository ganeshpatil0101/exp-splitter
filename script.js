const USERS = ["Ganesh", "Vikrant", "HiveDigiAd"];
let groups = JSON.parse(localStorage.getItem("splitGroups_v1")) || [];
let editingExpenseId = null;

document.addEventListener("DOMContentLoaded", () => {
  renderGroups();
  renderUserOptions();
});

// Create Group
function createGroup() {
  const name = document.getElementById("newGroupName").value.trim();
  if (!name) return alert("Enter group name");

  const id = Date.now();
  groups.push({ id, name, expenses: [] });
  localStorage.setItem("splitGroups_v1", JSON.stringify(groups));

  document.getElementById("newGroupName").value = "";
  renderGroups();
}

// Render Groups in Dropdown
function renderGroups() {
  const select = document.getElementById("groupSelect");
  select.innerHTML = "";
  groups.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    select.appendChild(opt);
  });
  if (groups.length > 0) renderExpenses();
}

// Render Paid By + User Checkboxes
function renderUserOptions() {
  const paidBySelect = document.getElementById("paidBy");
  const checkboxDiv = document.getElementById("userCheckboxes");
  paidBySelect.innerHTML = "";
  checkboxDiv.innerHTML = "";

  USERS.forEach(u => {
    // Paid By
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    paidBySelect.appendChild(opt);

    // Shared Between
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = u;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + u));
    checkboxDiv.appendChild(label);
  });
}

// Save / Update Expense
function saveExpense() {
  const groupId = document.getElementById("groupSelect").value;
  const name = document.getElementById("expenseName").value.trim();
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const date = document.getElementById("expenseDate").value;
  const paidBy = document.getElementById("paidBy").value;
  const desc = document.getElementById("expenseDescription").value.trim();
  const selectedUsers = Array.from(document.querySelectorAll("#userCheckboxes input:checked")).map(cb => cb.value);

  if (!groupId || !name || !amount || selectedUsers.length === 0) {
    return alert("Fill all fields and select at least one user");
  }

  const group = groups.find(g => g.id == groupId) || {expenses : []};
 
  if (editingExpenseId) {
    // Update existing
    const exp = group?.expenses?.find(e => e.id === editingExpenseId);
    Object.assign(exp, { name, amount, date, paidBy, sharedWith: selectedUsers, desc });
    editingExpenseId = null;
    document.getElementById("saveBtn").textContent = "Add Expense";
  } else {
    // New expense
    group.expenses.push({ 
      id: Date.now(), 
      name, amount, date, paidBy, sharedWith: selectedUsers, desc 
    });
  }

  localStorage.setItem("splitGroups_v1", JSON.stringify(groups));
  clearForm();
  renderExpenses();
}

// Render Expenses
function renderExpenses() {
  const groupId = document.getElementById("groupSelect").value;
  const group = groups.find(g => g.id == groupId);
  if (!group) return;

  const tbody = document.querySelector("#expenseTable tbody");
  tbody.innerHTML = "";

  let total = 0;
  group?.expenses?.forEach(exp => {
    total += exp.amount;
    const tr = document.createElement("tr");
	tr.innerHTML = `
	  <td data-label="Name">${exp.name}</td>
	  <td data-label="Amount">₹${exp.amount}</td>
	  <td data-label="Date">${exp.date || ""}</td>
	  <td data-label="Paid By">${exp.paidBy}</td>
	  <td data-label="Shared With">${exp.sharedWith.join(", ")}</td>
	  <td data-label="Description">${exp.desc}</td>
	  <td data-label="Actions">
		<button onclick="editExpense(${groupId}, ${exp.id})">Edit</button>
		<button onclick="deleteExpense(${groupId}, ${exp.id})">Delete</button>
	  </td>
	`;
    tbody.appendChild(tr);
  });

  document.getElementById("totalAmount").textContent = total;
  renderSettleUp(group);
}

// Edit Expense
function editExpense(groupId, expId) {
  const group = groups.find(g => g.id == groupId);
  const exp = group.expenses.find(e => e.id === expId);

  document.getElementById("expenseName").value = exp.name;
  document.getElementById("expenseAmount").value = exp.amount;
  document.getElementById("expenseDate").value = exp.date;
  document.getElementById("paidBy").value = exp.paidBy;
  document.getElementById("expenseDescription").value = exp.desc;

  document.querySelectorAll("#userCheckboxes input").forEach(cb => {
    cb.checked = exp.sharedWith.includes(cb.value);
  });

  editingExpenseId = expId;
  document.getElementById("saveBtn").textContent = "Update Expense";
}

// Delete Expense
function deleteExpense(groupId, expId) {
  const group = groups.find(g => g.id == groupId);
  group.expenses = group.expenses.filter(e => e.id !== expId);
  localStorage.setItem("splitGroups_v1", JSON.stringify(groups));
  renderExpenses();
}

// Clear Form
function clearForm() {
  document.getElementById("expenseName").value = "";
  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseDate").value = "";
  document.getElementById("expenseDescription").value = "";
  document.querySelectorAll("#userCheckboxes input").forEach(cb => cb.checked = false);
}

// Render Settlement
function renderSettleUp(group) {
  const balances = {};
  USERS.forEach(u => balances[u] = 0);

  group?.expenses?.forEach(exp => {
    const share = exp.amount / exp.sharedWith.length;
    exp.sharedWith.forEach(u => balances[u] -= share);
    balances[exp.paidBy] += exp.amount;
  });

  const list = document.getElementById("settleList");
  list.innerHTML = "";

  USERS.forEach(u => {
    if (balances[u] > 0) {
      list.innerHTML += `<li><strong>${u}</strong> should receive ₹${balances[u].toFixed(2)}</li>`;
    } else if (balances[u] < 0) {
      list.innerHTML += `<li><strong>${u}</strong> should pay ₹${Math.abs(balances[u]).toFixed(2)}</li>`;
    } else {
      list.innerHTML += `<li><strong>${u}</strong> is settled</li>`;
    }
  });
}
