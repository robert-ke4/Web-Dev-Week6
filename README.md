# SpendWise – Week 6: Interactive Budgeting

## What improvements were made this week
Last week SpendWise collected data with pop-up prompts and printed a report in the console. This week the dashboard is **fully interactive and shows everything on the webpage**:

- A **"Add an expense" form** (description, category, amount, date) with validation and instant feedback.
- An **expense list** built from an array, with a **category filter** and a **delete button** on every record.
- **Category cards** and the **header total** that update automatically when expenses change.
- A **Budget status panel** that shows the monthly budget, total spent, remaining balance and percentage used, plus a message and alerts that change depending on the data.
- A **form to change the monthly budget**, plus **Reset sample data** and **Clear all** buttons.
- Data is **saved in the browser (localStorage)**, so it is still there after a refresh.
- The Week 5 console report is kept as a quick debugging view.
- Visual improvements: a red "over limit" state, dark-mode friendly colours, and layouts that work on phones and tablets.

## How to run
Keep `index.html`, `style.css`, `script.js` and `Spendwise_Logo.png` in the same folder and open `index.html` in a browser. Add an expense, delete one, change the filter or change the budget and watch the dashboard update.

## How conditionals are used
Conditional statements (`if / else if / else`) make decisions in several places:
- **Form validation** (`handleAddExpense`): checks for an empty description, no category, an amount that is missing, not a number or not above 0, and a missing date. It shows a specific error and stops at the first problem.
- **Overall budget message** (`renderStatus`): chooses between "no expenses yet", "overspent", "careful – 80% or more used", "on track" and "great job" depending on how much of the budget is used.
- **Category alerts** (`renderStatus`): a category is flagged when it is over its limit, has reached its limit, or is at 80% or more.
- **Card wording and colours** (`renderCards`, `getStatus`): the bar turns gold at 80%+ and red when over the limit; the footer says "$X left", "Limit reached" or "$X over". Savings is treated as a goal, so it says "to go" or "Goal reached".
- **Feedback after adding an expense**: warns straight away if that expense pushed its category over the limit.
- **Empty states** and a red negative balance when the budget is overspent.

## How arrays are used to store data
- `expenses` is an **array of objects**, one per expense: `{ id, description, category, amount, date }`. It replaces the single variables used in Week 5.
- `categories` is an **array of objects** holding each category's name, icon, description, limit and whether it is a goal (Savings).
- `sampleExpenses` is the starting data. It is copied into `expenses` with `map()` so the original is never changed.
- Array methods used: `push()` (add an expense), `filter()` (delete an expense and apply the category filter), `sort()` (newest first) and `map()` (copy records).

## How loops are used
- `for...of` loops add up the total spent, total per category and total limits (`calculateTotalSpent`, `calculateCategoryTotals`, `calculateTotalLimits`).
- Loops create one card per category, one list item per expense, and the dropdown options.
- A loop checks every category to build the alert list, and `for...in` rounds each category total.

## How the DOM is updated
Nothing is typed into the HTML by hand for the changing parts. JavaScript builds them:
- Elements are created with `document.createElement()`, filled with `textContent` (which keeps user text safe) and added with `append()` / `appendChild()`.
- `replaceChildren()` clears a section before it is redrawn.
- `classList` and `setAttribute()` change colours and accessibility details (for example `aria-valuenow` on progress bars and `aria-invalid` on fields with errors). `style.setProperty("--pct", …)` sets each progress bar's width.
- One function, **`renderAll()`**, redraws the header, status panel, cards and expense list from the data arrays. Every action calls it, so the page can never show out-of-date numbers.

## How user interactions are handled through events
| Event | Where | What happens |
|-------|-------|--------------|
| `submit` | Add expense form | `handleAddExpense` validates, pushes a record, saves and redraws |
| `submit` | Budget form | `handleBudgetUpdate` validates the number, updates the budget and redraws |
| `click` | Expense list | **Event delegation**: one listener finds the clicked delete button with `closest()` and removes that record |
| `change` | Filter dropdown | `handleFilterChange` redraws the list for the chosen category |
| `click` | Reset / Clear buttons | Ask for confirmation, then replace or empty the `expenses` array and redraw |

**Flow:** user action → event handler → validation (conditionals) → array updated → `renderAll()` loops through the data → dashboard updates. `event.preventDefault()` stops forms from reloading the page.

## Functions used
`calculateTotalSpent`, `calculateCategoryTotals`, `calculateTotalLimits`, `calculateRemaining`, `calculatePercentUsed`, `getStatus`, `formatCurrency`, `formatDate`, `todayISO`, `findCategory`, `el`, `saveData`, `loadData`, `renderNumbers`, `renderStatus`, `renderCards`, `renderExpenses`, `renderAll` and the event handlers.

## Challenges encountered and how they were resolved
| Challenge | Solution |
|-----------|----------|
| Keeping the header, status panel, cards and list in sync after every change | Moved all drawing into one `renderAll()` function that always rebuilds from the arrays |
| Delete buttons are created by JavaScript, so listeners added at page load would not find them | Used event delegation: one listener on the list plus a `data-id` on each button |
| Typing text into `innerHTML` can break the page or run unwanted code | Built elements with `createElement` and `textContent` instead |
| Decimal maths (for example 0.1 + 0.2) giving odd totals | Rounded totals to 2 decimal places |
| `toISOString()` can give tomorrow's or yesterday's date near midnight | Corrected for the user's time zone offset in `todayISO()` |
| A narrow phone screen made the page wider than the screen | Used `minmax(0, 1fr)` grid columns so the navigation scrolls inside itself |
| Headings were hard to read in dark mode | Added a separate `--heading` colour variable for dark mode |
| Data disappearing on refresh | Saved the arrays to `localStorage` and wrapped it in `try / catch` in case storage is blocked |

## Files
| File | Purpose |
|------|---------|
| `index.html` | Page structure, forms and empty containers that JavaScript fills |
| `style.css` | Theme variables, Grid/Flexbox layout, dark mode, responsive rules, new components |
| `script.js` | Data arrays, calculations, rendering and event handling |
| `README.md` | This document |
| `Spendwise_Logo.png` | Logo used in the sidebar |

## Submitting to GitHub
1. Create a **public** repository and upload the five files above.
2. Copy the repository URL and submit it through the LMS.
