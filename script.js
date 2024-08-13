const expenseForm = document.getElementById('expenseForm');
const incomeForm = document.getElementById('incomeForm');
const savingsGoalForm = document.getElementById('savingsGoalForm');
const expenseList = document.getElementById('expenseList');
const incomeList = document.getElementById('incomeList');
const savingsGoalsList = document.getElementById('savingsGoalsList');
const categoryFilter = document.getElementById('categoryFilter');
const dateRangeFilter = document.getElementById('dateRangeFilter');
const totalExpensesDisplay = document.getElementById('totalExpenses');
const totalIncomeDisplay = document.getElementById('totalIncome');
const netSavingsDisplay = document.getElementById('netSavings');
const exportBtn = document.getElementById('exportBtn');
const budgetForm = document.getElementById('budgetForm');
const budgetInfo = document.getElementById('budgetInfo');
const recurringExpenseForm = document.getElementById('recurringExpenseForm');
const recurringExpensesList = document.getElementById('recurringExpensesList');
const preferredCurrencySelect = document.getElementById('preferredCurrency');

let expenses = [];
let incomes = [];
let savingsGoals = [];
let recurringExpenses = [];
let budget = { amount: 0, currency: 'USD' };
let preferredCurrency = 'USD';
let isDarkMode = false;

const currencies = {
    USD: { symbol: '$', rate: 0.012 },
    EUR: { symbol: '€', rate: 0.011 },
    GBP: { symbol: '£', rate: 0.0093 },
    INR: { symbol: '₹', rate: 1 }
};

flatpickr("#expenseDate", { dateFormat: "Y-m-d", defaultDate: "today" });
flatpickr("#dateRangeFilter", { mode: "range", dateFormat: "Y-m-d" });
flatpickr("#incomeDate", { dateFormat: "Y-m-d", defaultDate: "today" });

function convertCurrency(amount, fromCurrency, toCurrency) {
    return (amount / currencies[fromCurrency].rate) * currencies[toCurrency].rate;
}

expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('expenseName').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;
    const currency = document.getElementById('expenseCurrency').value;
    const tags = document.getElementById('expenseTags').value.split(',').map(tag => tag.trim());
    
    if (name && amount && category && date && currency) {
        const expense = { name, amount, category, date, currency, tags };
        expenses.push(expense);
        updateExpenseList();
        updateTotalExpenses();
        updateNetSavings();
        updateCharts();
        updateBudgetInfo();
        saveExpenses();
        expenseForm.reset();
        flatpickr("#expenseDate").setDate("today");
    }
});

function updateExpenseList() {
    const selectedCategory = categoryFilter.value;
    const dateRange = dateRangeFilter.value.split(" to ");
    const startDate = dateRange[0];
    const endDate = dateRange[1] || startDate;
    
    expenseList.innerHTML = '';
    expenses
        .filter(expense => {
            return (selectedCategory === '' || expense.category === selectedCategory) &&
                   (!startDate || expense.date >= startDate) &&
                   (!endDate || expense.date <= endDate);
        })
        .forEach((expense, index) => {
            const convertedAmount = convertCurrency(expense.amount, expense.currency, preferredCurrency);
            const item = document.createElement('div');
            item.classList.add('expense-item', 'mb-2', 'd-flex', 'justify-content-between', 'align-items-center');
            item.innerHTML = `
                <span>${expense.name}</span>
                <span class="category-label category-${expense.category}">${expense.category}</span>
                <span>${currencies[expense.currency].symbol}${expense.amount.toFixed(2)}</span>
                <span>(${currencies[preferredCurrency].symbol}${convertedAmount.toFixed(2)})</span>
                <span>${expense.date}</span>
                <span>${expense.tags.join(', ')}</span>
                <button class="btn btn-danger btn-sm" onclick="deleteExpense(${index})">Delete</button>
            `;
            expenseList.appendChild(item);
        });
}

function updateTotalExpenses() {
    const total = expenses.reduce((sum, expense) => {
        return sum + convertCurrency(expense.amount, expense.currency, preferredCurrency);
    }, 0);
    totalExpensesDisplay.textContent = `Total: ${currencies[preferredCurrency].symbol}${total.toFixed(2)}`;
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    updateExpenseList();
    updateTotalExpenses();
    updateNetSavings();
    updateCharts();
    updateBudgetInfo();
    saveExpenses();
}

incomeForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const source = document.getElementById('incomeSource').value;
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const currency = document.getElementById('incomeCurrency').value;
    const date = document.getElementById('incomeDate').value;

    if (source && amount && currency && date) {
        const income = { source, amount, currency, date };
        incomes.push(income);
        updateIncomeList();
        updateTotalIncome();
        updateNetSavings();
        saveIncomes();
        incomeForm.reset();
        flatpickr("#incomeDate").setDate("today");
    }
});

function updateIncomeList() {
    incomeList.innerHTML = '';
    incomes.forEach((income, index) => {
        const item = document.createElement('div');
        item.classList.add('income-item');
        item.innerHTML = `
            <span>${income.source}</span>
            <span>${currencies[income.currency].symbol}${income.amount.toFixed(2)}</span>
            <span>${income.date}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteIncome(${index})">Delete</button>
        `;
        incomeList.appendChild(item);
    });
}

function updateTotalIncome() {
    const totalIncome = incomes.reduce((sum, income) => {
        return sum + convertCurrency(income.amount, income.currency, preferredCurrency);
    }, 0);
    totalIncomeDisplay.textContent = `Total Income: ${currencies[preferredCurrency].symbol}${totalIncome.toFixed(2)}`;
}

function deleteIncome(index) {
    incomes.splice(index, 1);
    updateIncomeList();
    updateTotalIncome();
    updateNetSavings();
    saveIncomes();
}

savingsGoalForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('savingsGoalName').value;
    const targetAmount = parseFloat(document.getElementById('savingsGoalAmount').value);
    const currency = document.getElementById('savingsGoalCurrency').value;
    const deadline = document.getElementById('savingsGoalDeadline').value;

    if (name && targetAmount && currency && deadline) {
        const goal = { name, targetAmount, currency, deadline, currentAmount: 0 };
        savingsGoals.push(goal);
        updateSavingsGoalsList();
        saveSavingsGoals();
        savingsGoalForm.reset();
    }
});

function updateSavingsGoalsList() {
    savingsGoalsList.innerHTML = '';
    savingsGoals.forEach((goal, index) => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const item = document.createElement('div');
        item.classList.add('savings-goal-item');
        item.innerHTML = `
            <h4>${goal.name}</h4>
            <p>Target: ${currencies[goal.currency].symbol}${goal.targetAmount.toFixed(2)} by ${goal.deadline}</p>
            <p>Current: ${currencies[goal.currency].symbol}${goal.currentAmount.toFixed(2)}</p>
            <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: ${progress}%;" 
                     aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">${progress.toFixed(1)}%</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="addToSavingsGoal(${index})">Add Funds</button>
            <button class="btn btn-danger btn-sm" onclick="deleteSavingsGoal(${index})">Delete</button>
        `;
        savingsGoalsList.appendChild(item);
    });
}

function addToSavingsGoal(index) {
    const amount = parseFloat(prompt("Enter amount to add:"));
    if (!isNaN(amount) && amount > 0) {
        savingsGoals[index].currentAmount += amount;
        updateSavingsGoalsList();
        saveSavingsGoals();
    }
}

function deleteSavingsGoal(index) {
    savingsGoals.splice(index, 1);
    updateSavingsGoalsList();
    saveSavingsGoals();
}

function updateNetSavings() {
    const totalIncome = incomes.reduce((sum, income) => {
        return sum + convertCurrency(income.amount, income.currency, preferredCurrency);
    }, 0);

    const totalExpenses = expenses.reduce((sum, expense) => {
        return sum + convertCurrency(expense.amount, expense.currency, preferredCurrency);
    }, 0);

    const netSavings = totalIncome - totalExpenses;
    netSavingsDisplay.textContent = `Net Savings: ${currencies[preferredCurrency].symbol}${netSavings.toFixed(2)}`;
}

budgetForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    const currency = document.getElementById('budgetCurrency').value;
    
    if (!isNaN(amount) && currency) {
        budget = { amount, currency };
        updateBudgetInfo();
        saveBudget();
        budgetForm.reset();
    }
});

function updateBudgetInfo() {
    const totalExpenses = expenses.reduce((sum, expense) => {
        return sum + convertCurrency(expense.amount, expense.currency, budget.currency);
    }, 0);
    
    const remainingBudget = budget.amount - totalExpenses;
    const remainingPercentage = (remainingBudget / budget.amount) * 100;

    budgetInfo.innerHTML = `
        <p>Total Budget: ${currencies[budget.currency].symbol}${budget.amount.toFixed(2)}</p>
        <p>Total Expenses: ${currencies[budget.currency].symbol}${totalExpenses.toFixed(2)}</p>
        <p>Remaining Budget: ${currencies[budget.currency].symbol}${remainingBudget.toFixed(2)} (${remainingPercentage.toFixed(1)}%)</p>
    `;
}

recurringExpenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('recurringExpenseName').value;
    const amount = parseFloat(document.getElementById('recurringExpenseAmount').value);
    const category = document.getElementById('recurringExpenseCategory').value;
    const frequency = document.getElementById('recurringExpenseFrequency').value;
    const startDate = document.getElementById('recurringExpenseStartDate').value;
    const currency = document.getElementById('recurringExpenseCurrency').value;

    if (name && amount && category && frequency && startDate && currency) {
        const recurringExpense = { name, amount, category, frequency, startDate, currency };
        recurringExpenses.push(recurringExpense);
        updateRecurringExpensesList();
        saveRecurringExpenses();
        recurringExpenseForm.reset();
        flatpickr("#recurringExpenseStartDate").setDate("today");
    }
});

function updateRecurringExpensesList() {
    recurringExpensesList.innerHTML = '';
    recurringExpenses.forEach((expense, index) => {
        const item = document.createElement('div');
        item.classList.add('recurring-expense-item');
        item.innerHTML = `
            <span>${expense.name}</span>
            <span>${expense.category}</span>
            <span>${currencies[expense.currency].symbol}${expense.amount.toFixed(2)}</span>
            <span>${expense.frequency}</span>
            <span>${expense.startDate}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteRecurringExpense(${index})">Delete</button>
        `;
        recurringExpensesList.appendChild(item);
    });
}

function deleteRecurringExpense(index) {
    recurringExpenses.splice(index, 1);
    updateRecurringExpensesList();
    saveRecurringExpenses();
}

preferredCurrencySelect.addEventListener('change', function() {
    preferredCurrency = preferredCurrencySelect.value;
    updateExpenseList();
    updateTotalExpenses();
    updateIncomeList();
    updateTotalIncome();
    updateNetSavings();
    updateBudgetInfo();
    updateSavingsGoalsList();
    savePreferredCurrency();
});

document.getElementById('darkModeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    isDarkMode = !isDarkMode;
    saveTheme();
});

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function loadExpenses() {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
        updateExpenseList();
        updateTotalExpenses();
    }
}

function saveIncomes() {
    localStorage.setItem('incomes', JSON.stringify(incomes));
}

function loadIncomes() {
    const savedIncomes = localStorage.getItem('incomes');
    if (savedIncomes) {
        incomes = JSON.parse(savedIncomes);
        updateIncomeList();
        updateTotalIncome();
    }
}

function saveSavingsGoals() {
    localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals));
}

function loadSavingsGoals() {
    const savedGoals = localStorage.getItem('savingsGoals');
    if (savedGoals) {
        savingsGoals = JSON.parse(savedGoals);
        updateSavingsGoalsList();
    }
}

function saveRecurringExpenses() {
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
}

function loadRecurringExpenses() {
    const savedRecurringExpenses = localStorage.getItem('recurringExpenses');
    if (savedRecurringExpenses) {
        recurringExpenses = JSON.parse(savedRecurringExpenses);
        updateRecurringExpensesList();
    }
}

function saveBudget() {
    localStorage.setItem('budget', JSON.stringify(budget));
}

function loadBudget() {
    const savedBudget = localStorage.getItem('budget');
    if (savedBudget) {
        budget = JSON.parse(savedBudget);
        updateBudgetInfo();
    }
}

function savePreferredCurrency() {
    localStorage.setItem('preferredCurrency', preferredCurrency);
}

function loadPreferredCurrency() {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
        preferredCurrency = savedCurrency;
        preferredCurrencySelect.value = preferredCurrency;
    }
}

function saveTheme() {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
}

function loadTheme() {
    const savedTheme = localStorage.getItem('isDarkMode');
    if (savedTheme) {
        isDarkMode = JSON.parse(savedTheme);
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }
}

window.onload = function() {
    loadExpenses();
    loadIncomes();
    loadSavingsGoals();
    loadRecurringExpenses();
    loadBudget();
    loadPreferredCurrency();
    loadTheme();
};
