/* ==========================================================================
   SpendWise - Week 6: Interactive Budgeting
   Concepts: conditionals, arrays, loops, DOM manipulation, event listeners.

   Flow:  user action (click / submit / change)
            -> event handler validates the input (conditionals)
            -> data array is updated (expenses)
            -> renderAll() loops through the data and redraws the page
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. DATA: variables and arrays that hold the application's information
// --------------------------------------------------------------------------
const appName = "SpendWise";
const warningThreshold = 80;              // % of a limit that triggers a warning
const STORAGE_KEY = "spendwise-week6";    // where the data is saved in the browser

// Array of category objects (limits are fixed; spending comes from expenses)
const categories = [
    { name: "Food",          icon: "🛒", description: "Groceries and dining",  limit: 600,  isGoal: false },
    { name: "Transport",     icon: "🚌", description: "Bus fare and fuel",     limit: 200,  isGoal: false },
    { name: "Rent",          icon: "🏠", description: "Accommodation",         limit: 1200, isGoal: false },
    { name: "Entertainment", icon: "🎬", description: "Streaming and outings", limit: 150,  isGoal: false },
    { name: "Savings",       icon: "💰", description: "Monthly transfer",      limit: 500,  isGoal: true  },
    { name: "Utilities",     icon: "💡", description: "Power, water, internet", limit: 220, isGoal: false }
];

// Array of expense records: this replaces individual variables per expense.
const sampleExpenses = [
    { id: 1,  description: "Groceries",         category: "Food",          amount: 150,  date: "2026-11-02" },
    { id: 2,  description: "Restaurant lunch",  category: "Food",          amount: 85,   date: "2026-11-08" },
    { id: 3,  description: "Groceries",         category: "Food",          amount: 120,  date: "2026-11-14" },
    { id: 4,  description: "Takeaway dinner",   category: "Food",          amount: 65,   date: "2026-11-17" },
    { id: 5,  description: "Bus fare",          category: "Transport",     amount: 60,   date: "2026-11-03" },
    { id: 6,  description: "Fuel",              category: "Transport",     amount: 75,   date: "2026-11-12" },
    { id: 7,  description: "November rent",     category: "Rent",          amount: 1200, date: "2026-11-01" },
    { id: 8,  description: "Streaming plan",    category: "Entertainment", amount: 35,   date: "2026-11-05" },
    { id: 9,  description: "Movie night",       category: "Entertainment", amount: 60,   date: "2026-11-15" },
    { id: 10, description: "Savings transfer",  category: "Savings",       amount: 200,  date: "2026-11-04" },
    { id: 11, description: "Savings transfer",  category: "Savings",       amount: 150,  date: "2026-11-16" },
    { id: 12, description: "Electricity",       category: "Utilities",     amount: 90,   date: "2026-11-06" },
    { id: 13, description: "Water bill",        category: "Utilities",     amount: 35,   date: "2026-11-07" },
    { id: 14, description: "Internet",          category: "Utilities",     amount: 55,   date: "2026-11-10" }
];

let expenses = [];            // the live list of expense records
let monthlyBudget = 2870;     // number: total budget for the month
let nextId = 1;               // number: id given to the next new expense
let activeFilter = "all";     // string: which category the list is showing

// --------------------------------------------------------------------------
// 2. DOM REFERENCES: elements we read from or write to
// --------------------------------------------------------------------------
const headerTotal   = document.getElementById("header-total");
const statusMessage = document.getElementById("status-message");
const alertList     = document.getElementById("alert-list");
const statBudget    = document.getElementById("stat-budget");
const statSpent     = document.getElementById("stat-spent");
const statRemaining = document.getElementById("stat-remaining");
const statPercent   = document.getElementById("stat-percent");
const budgetForm    = document.getElementById("budget-form");
const budgetInput   = document.getElementById("budget-input");
const budgetMessage = document.getElementById("budget-message");
const cardsBox      = document.getElementById("cards");
const expenseForm   = document.getElementById("expense-form");
const formMessage   = document.getElementById("form-message");
const categorySelect = document.getElementById("exp-category");
const dateInput     = document.getElementById("exp-date");
const filterSelect  = document.getElementById("filter-select");
const listSummary   = document.getElementById("list-summary");
const expenseListEl = document.getElementById("expense-list");
const resetBtn      = document.getElementById("reset-btn");
const clearBtn      = document.getElementById("clear-btn");

// --------------------------------------------------------------------------
// 3. HELPER FUNCTIONS
// --------------------------------------------------------------------------

/** Creates an element, optionally with a class and text (text is escaped safely). */
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
}

/** 1200 -> "$1,200"   |   12.5 -> "$12.50"   |   -40 -> "-$40" */
function formatCurrency(amount) {
    const sign = amount < 0 ? "-" : "";
    const digits = Number.isInteger(amount) ? 0 : 2;
    return sign + "$" + Math.abs(amount).toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
}

/** "2026-11-05" -> "Nov 5" */
function formatDate(isoDate) {
    const date = new Date(isoDate + "T00:00:00");
    if (isNaN(date)) { return isoDate; }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Today's date as YYYY-MM-DD in the user's own time zone. */
function todayISO() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Finds the category object that matches a name. */
function findCategory(name) {
    for (const category of categories) {
        if (category.name === name) { return category; }
    }
    return null;
}

// --------------------------------------------------------------------------
// 4. CALCULATION FUNCTIONS (reusable, each does one job)
// --------------------------------------------------------------------------

/** LOOP: adds up the amount of every expense in a list. */
function calculateTotalSpent(list) {
    let total = 0;
    for (const expense of list) {
        total += expense.amount;
    }
    return Math.round(total * 100) / 100;     // avoid 0.1 + 0.2 style rounding errors
}

/** LOOP: builds an object of totals per category, e.g. { Food: 420, Rent: 1200 } */
function calculateCategoryTotals(list) {
    const totals = {};
    for (const category of categories) {
        totals[category.name] = 0;
    }
    for (const expense of list) {
        totals[expense.category] += expense.amount;
    }
    for (const name in totals) {
        totals[name] = Math.round(totals[name] * 100) / 100;
    }
    return totals;
}

/** LOOP: adds up the limits of all categories. */
function calculateTotalLimits() {
    let total = 0;
    for (const category of categories) {
        total += category.limit;
    }
    return total;
}

function calculateRemaining(budget, spent) {
    return Math.round((budget - spent) * 100) / 100;
}

function calculatePercentUsed(spent, limit) {
    if (limit === 0) {
        return spent > 0 ? 100 : 0;           // avoid dividing by zero
    }
    return Math.round((spent / limit) * 100);
}

/** CONDITIONALS: turns a percentage into a status key + label. */
function getStatus(percent, isGoal) {
    if (isGoal) {
        return percent >= 100
            ? { key: "ok", label: "Goal reached" }
            : { key: "ok", label: "In progress" };
    }
    if (percent > 100) {
        return { key: "over", label: "Over limit" };
    } else if (percent >= warningThreshold) {
        return { key: "warn", label: "Nearly used up" };
    } else {
        return { key: "ok", label: "On track" };
    }
}

// --------------------------------------------------------------------------
// 5. SAVING AND LOADING (the data stays after the page is refreshed)
// --------------------------------------------------------------------------
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ expenses, monthlyBudget }));
    } catch (error) {
        console.warn(appName + ": could not save data.", error);
    }
}

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (Array.isArray(data.expenses) && typeof data.monthlyBudget === "number") {
                expenses = data.expenses;
                monthlyBudget = data.monthlyBudget;
                return true;
            }
        }
    } catch (error) {
        console.warn(appName + ": could not load saved data.", error);
    }
    return false;
}

function updateNextId() {
    nextId = 1;
    for (const expense of expenses) {
        if (expense.id >= nextId) { nextId = expense.id + 1; }
    }
}

function useSampleData() {
    // copy each record so editing the list never changes the original sample
    expenses = sampleExpenses.map(function (expense) { return { ...expense }; });
    monthlyBudget = calculateTotalLimits();
    updateNextId();
}

// --------------------------------------------------------------------------
// 6. RENDER FUNCTIONS: update the page (DOM manipulation)
// --------------------------------------------------------------------------

/** Header total + the four numbers in the budget status panel. */
function renderNumbers(totalSpent) {
    const remaining = calculateRemaining(monthlyBudget, totalSpent);
    const percent = calculatePercentUsed(totalSpent, monthlyBudget);

    headerTotal.textContent = formatCurrency(totalSpent) + " of " + formatCurrency(monthlyBudget);
    statBudget.textContent = formatCurrency(monthlyBudget);
    statSpent.textContent = formatCurrency(totalSpent);
    statRemaining.textContent = formatCurrency(remaining);
    statPercent.textContent = percent + "%";

    // CONDITIONAL: show a negative balance in red
    statRemaining.classList.toggle("negative", remaining < 0);
}

/** Overall message + alert list, chosen with if / else if / else. */
function renderStatus(totalSpent, totals) {
    const remaining = calculateRemaining(monthlyBudget, totalSpent);
    const percent = calculatePercentUsed(totalSpent, monthlyBudget);
    let message;
    let level;

    if (expenses.length === 0) {
        message = "No expenses yet. Add your first expense to see your budget status.";
        level = "ok";
    } else if (totalSpent > monthlyBudget) {
        message = "You have overspent your budget by " + formatCurrency(Math.abs(remaining)) + ". Review your expenses.";
        level = "over";
    } else if (percent >= warningThreshold) {
        message = "Careful: you have used " + percent + "% of your budget. Only " + formatCurrency(remaining) + " is left.";
        level = "warn";
    } else if (percent >= 50) {
        message = "You are on track. " + percent + "% used and " + formatCurrency(remaining) + " still available.";
        level = "ok";
    } else {
        message = "Great job! You have only used " + percent + "% of your budget so far.";
        level = "ok";
    }

    statusMessage.textContent = message;
    statusMessage.className = "status " + level;

    // LOOP + CONDITIONALS: check every category and list the ones needing attention
    alertList.replaceChildren();
    for (const category of categories) {
        if (category.isGoal) { continue; }
        const spent = totals[category.name];
        const categoryPercent = calculatePercentUsed(spent, category.limit);
        const left = calculateRemaining(category.limit, spent);

        if (categoryPercent > 100) {
            alertList.appendChild(el("li", "alert over", "🚨 " + category.name + " is over its limit by " + formatCurrency(Math.abs(left)) + "."));
        } else if (categoryPercent === 100) {
            alertList.appendChild(el("li", "alert warn", "⚠️ " + category.name + " has reached its limit."));
        } else if (categoryPercent >= warningThreshold) {
            alertList.appendChild(el("li", "alert warn", "⚠️ " + category.name + " is at " + categoryPercent + "% of its limit (" + formatCurrency(left) + " left)."));
        }
    }

    const totalLimits = calculateTotalLimits();
    if (totalLimits > monthlyBudget) {
        alertList.appendChild(el("li", "alert warn", "⚠️ Your category limits add up to " + formatCurrency(totalLimits) + ", which is more than your monthly budget."));
    }
}

/** Creates one card per category from the categories array. */
function renderCards(totals) {
    cardsBox.replaceChildren();

    for (const category of categories) {
        const spent = totals[category.name];
        const percent = calculatePercentUsed(spent, category.limit);
        const left = calculateRemaining(category.limit, spent);
        const status = getStatus(percent, category.isGoal);

        const card = el("article", "card");
        card.tabIndex = 0;
        if (status.key === "over") { card.classList.add("over"); }

        // top row: icon + name + description
        const top = el("div", "card-top");
        const icon = el("div", "card-icon", category.icon);
        icon.setAttribute("aria-hidden", "true");
        const titles = el("div");
        titles.append(el("h3", null, category.name), el("p", null, category.description));
        top.append(icon, titles);

        // amount line: "$420 of $600"
        const amount = el("p", "amount", formatCurrency(spent) + " ");
        amount.appendChild(el("small", null, "of " + formatCurrency(category.limit)));

        // progress bar (width is capped at 100%)
        const bar = el("div", "bar");
        if (status.key === "over") { bar.classList.add("over"); }
        if (status.key === "warn") { bar.classList.add("warn"); }
        bar.setAttribute("role", "progressbar");
        bar.setAttribute("aria-label", category.name + (category.isGoal ? " savings goal reached" : " budget used"));
        bar.setAttribute("aria-valuenow", String(Math.min(percent, 100)));
        bar.setAttribute("aria-valuemin", "0");
        bar.setAttribute("aria-valuemax", "100");
        const fill = el("span");
        fill.style.setProperty("--pct", Math.min(percent, 100) + "%");
        bar.appendChild(fill);

        // footer: percentage + what is left (wording depends on the situation)
        let leftText;
        if (category.isGoal) {
            leftText = left > 0 ? formatCurrency(left) + " to go" : "Goal reached 🎉";
        } else if (left < 0) {
            leftText = formatCurrency(Math.abs(left)) + " over";
        } else if (left === 0) {
            leftText = "Limit reached";
        } else {
            leftText = formatCurrency(left) + " left";
        }
        const foot = el("div", "card-foot");
        foot.append(el("span", null, percent + (category.isGoal ? "% saved" : "% used")), el("span", null, leftText));

        card.append(top, amount, bar, foot);
        cardsBox.appendChild(card);
    }
}

/** Builds the expense list (respecting the category filter). */
function renderExpenses() {
    expenseListEl.replaceChildren();

    // ARRAY METHODS: filter() keeps matching records, sort() puts newest first
    const visible = expenses
        .filter(function (expense) { return activeFilter === "all" || expense.category === activeFilter; })
        .sort(function (a, b) {
            if (a.date !== b.date) { return a.date < b.date ? 1 : -1; }
            return b.id - a.id;
        });

    const visibleTotal = calculateTotalSpent(visible);
    const label = activeFilter === "all" ? "all categories" : activeFilter;
    const noun = visible.length === 1 ? "expense" : "expenses";
    listSummary.textContent = visible.length + " " + noun + " in " + label + " · " + formatCurrency(visibleTotal);

    // CONDITIONAL: empty state
    if (visible.length === 0) {
        expenseListEl.appendChild(el("li", "empty", "No expenses to show yet."));
        return;
    }

    // LOOP: one list item per record
    for (const expense of visible) {
        const category = findCategory(expense.category);

        const item = el("li", "expense");
        const icon = el("div", "expense-icon", category ? category.icon : "🧾");
        icon.setAttribute("aria-hidden", "true");

        const info = el("div", "expense-info");
        info.append(
            el("strong", null, expense.description),
            el("span", "expense-meta", expense.category + " · " + formatDate(expense.date))
        );

        const amount = el("span", "expense-amount", formatCurrency(expense.amount));

        const del = el("button", "btn-icon", "✕");
        del.type = "button";
        del.dataset.id = String(expense.id);       // the click handler reads this
        del.setAttribute("aria-label", "Delete " + expense.description + " (" + formatCurrency(expense.amount) + ")");

        item.append(icon, info, amount, del);
        expenseListEl.appendChild(item);
    }
}

/** Console report from Week 5, kept as a quick debugging view. */
function logReport(totalSpent, totals) {
    console.log(appName + ": " + formatCurrency(totalSpent) + " spent of " + formatCurrency(monthlyBudget) +
        " (" + formatCurrency(calculateRemaining(monthlyBudget, totalSpent)) + " remaining)");
    console.table(totals);
}

/** One function redraws everything, so the page can never get out of sync. */
function renderAll() {
    const totalSpent = calculateTotalSpent(expenses);
    const totals = calculateCategoryTotals(expenses);

    renderNumbers(totalSpent);
    renderStatus(totalSpent, totals);
    renderCards(totals);
    renderExpenses();
    logReport(totalSpent, totals);
}

// --------------------------------------------------------------------------
// 7. FORM HELPERS
// --------------------------------------------------------------------------
function showMessage(node, text, type) {
    node.textContent = text;
    node.className = "form-message " + type;      // "error" or "success"
}

function clearInvalid() {
    for (const field of expenseForm.elements) { field.removeAttribute("aria-invalid"); }
    budgetInput.removeAttribute("aria-invalid");
}

function markInvalid(field, text) {
    showMessage(field === budgetInput ? budgetMessage : formMessage, text, "error");
    field.setAttribute("aria-invalid", "true");
    field.focus();
}

function fillSelects() {
    // category dropdown for the form
    categorySelect.replaceChildren();
    const placeholder = el("option", null, "Choose one");
    placeholder.value = "";
    categorySelect.appendChild(placeholder);

    // filter dropdown for the list
    filterSelect.replaceChildren();
    const all = el("option", null, "All categories");
    all.value = "all";
    filterSelect.appendChild(all);

    for (const category of categories) {
        const option = el("option", null, category.icon + " " + category.name);
        option.value = category.name;
        categorySelect.appendChild(option);

        const filterOption = el("option", null, category.name);
        filterOption.value = category.name;
        filterSelect.appendChild(filterOption);
    }
}

// --------------------------------------------------------------------------
// 8. EVENT HANDLERS: where user actions trigger the logic
// --------------------------------------------------------------------------

/** Add-expense form submitted. */
function handleAddExpense(event) {
    event.preventDefault();                       // stop the page from reloading
    clearInvalid();

    const form = expenseForm.elements;
    const description = form.description.value.trim();
    const categoryName = form.category.value;
    const amount = Number(form.amount.value);
    const date = form.date.value;

    // CONDITIONALS: validate each field and stop at the first problem
    if (description === "") {
        markInvalid(form.description, "Please enter a description.");
        return;
    } else if (categoryName === "") {
        markInvalid(form.category, "Please choose a category.");
        return;
    } else if (form.amount.value === "" || isNaN(amount) || amount <= 0) {
        markInvalid(form.amount, "Please enter an amount greater than 0.");
        return;
    } else if (date === "") {
        markInvalid(form.date, "Please pick a date.");
        return;
    }

    // update the ARRAY
    expenses.push({
        id: nextId,
        description: description,
        category: categoryName,
        amount: Math.round(amount * 100) / 100,
        date: date
    });
    nextId++;
    saveData();
    renderAll();

    // CONDITIONAL feedback about the category the user just spent in
    const category = findCategory(categoryName);
    const totals = calculateCategoryTotals(expenses);
    const percent = calculatePercentUsed(totals[categoryName], category.limit);
    const left = calculateRemaining(category.limit, totals[categoryName]);

    if (!category.isGoal && percent > 100) {
        showMessage(formMessage, "Expense added, but " + categoryName + " is now over its limit by " + formatCurrency(Math.abs(left)) + ".", "error");
    } else if (!category.isGoal && percent >= warningThreshold) {
        showMessage(formMessage, "Expense added. " + categoryName + " is at " + percent + "% of its limit.", "success");
    } else {
        showMessage(formMessage, "Expense added: " + description + " (" + formatCurrency(amount) + ").", "success");
    }

    form.description.value = "";
    form.amount.value = "";
    form.description.focus();
}

/** Budget form submitted. */
function handleBudgetUpdate(event) {
    event.preventDefault();
    clearInvalid();

    const newBudget = Number(budgetInput.value);
    if (budgetInput.value === "" || isNaN(newBudget) || newBudget <= 0) {
        markInvalid(budgetInput, "Please enter a budget greater than 0.");
        return;
    }

    monthlyBudget = Math.round(newBudget * 100) / 100;
    saveData();
    renderAll();
    budgetInput.value = "";
    showMessage(budgetMessage, "Monthly budget updated to " + formatCurrency(monthlyBudget) + ".", "success");
}

/** One listener on the whole list handles every delete button (event delegation). */
function handleListClick(event) {
    const button = event.target.closest("button[data-id]");
    if (!button) { return; }

    const id = Number(button.dataset.id);
    expenses = expenses.filter(function (expense) { return expense.id !== id; });
    saveData();
    renderAll();
    showMessage(formMessage, "Expense deleted.", "success");
}

function handleFilterChange() {
    activeFilter = filterSelect.value;
    renderExpenses();
}

function handleReset() {
    if (confirm("Replace your expenses with the sample data?")) {
        useSampleData();
        activeFilter = "all";
        filterSelect.value = "all";
        saveData();
        renderAll();
        showMessage(formMessage, "Sample data restored.", "success");
    }
}

function handleClear() {
    if (confirm("Delete ALL expenses? This cannot be undone.")) {
        expenses = [];
        saveData();
        renderAll();
        showMessage(formMessage, "All expenses cleared.", "success");
    }
}

// --------------------------------------------------------------------------
// 9. START THE APP: connect events, then draw the page for the first time
// --------------------------------------------------------------------------
expenseForm.addEventListener("submit", handleAddExpense);
budgetForm.addEventListener("submit", handleBudgetUpdate);
expenseListEl.addEventListener("click", handleListClick);
filterSelect.addEventListener("change", handleFilterChange);
resetBtn.addEventListener("click", handleReset);
clearBtn.addEventListener("click", handleClear);

fillSelects();
dateInput.value = todayISO();
if (!loadData()) {
    useSampleData();
}
updateNextId();
renderAll();
console.log(appName + " loaded. Add, delete and filter expenses to see the dashboard update.");
