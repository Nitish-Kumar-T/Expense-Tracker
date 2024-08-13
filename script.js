const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const categoryFilter = document.getElementById('categoryFilter');
const dateRangeFilter = document.getElementById('dateRangeFilter');
const applyFilterBtn = document.getElementById('applyFilter');
const totalExpensesDisplay = document.getElementById('totalExpenses');
const exportBtn = document.getElementById('exportBtn');
const budgetForm = document.getElementById('budgetForm');
const budgetInfo = document.getElementById('budgetInfo');
const recurringExpenseForm = document.getElementById('recurringExpenseForm');
const recurringExpensesList = document.getElementById('recurringExpensesList');
const preferredCurrencySelect = document.getElementById('preferredCurrency');

let expenses = [];
let recurringExpenses = [];
let budget = { amount: 0, currency: 'USD' };
let preferredCurrency = 'USD';

const currencies = {
    USD: { symbol: '$', rate: 0.012 },
    EUR: { symbol: '€', rate: 0.011 },
    GBP: { symbol: '£', rate: 0.0093 },
    INR: { symbol: '₹', rate: 1 }
};

flatpickr("#expenseDate", { dateFormat: "Y-m-d", defaultDate: "today" });
flatpickr("#dateRangeFilter", { mode: "range", dateFormat: "Y-m-d" });

function convertCurrency(amount, fromCurrency, toCurrency) {
    return (amount / currencies[fromCurrency].rate) * currencies[toCurrency].rate;
}

function setPreferredCurrency(currency) {
    preferredCurrency = currency;
    localStorage.setItem('preferredCurrency', currency);
    updateExpenseList();
    updateTotalExpenses();
    updateCharts();
    updateBudgetInfo();
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
    updateCharts();
    updateBudgetInfo();
    saveExpenses();
}

function updateCharts() {
    updateCategoryChart();
    updateTrendChart();
    updateTagChart();
}

function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categoryTotals = expenses.reduce((totals, expense) => {
        const convertedAmount = convertCurrency(expense.amount, expense.currency, preferredCurrency);
        totals[expense.category] = (totals[expense.category] || 0) + convertedAmount;
        return totals;
    }, {});

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: ['#ffd700', '#90ee90', '#add8e6', '#ffa07a', '#d3d3d3']
            }]
        },
        options: {
            responsive: true,
            title: { display: true, text: 'Expenses by Category' }
        }
    });
}

function updateTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const sortedExpenses = expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
    const dates = sortedExpenses.map(expense => expense.date);
    const amounts = sortedExpenses.map(expense => 
        convertCurrency(expense.amount, expense.currency, preferredCurrency)
    );

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Expense Trend',
                data: amounts,
                borderColor: '#007bff',
                fill: false
            }]
        },
        options: {
            responsive: true,
            title: { display: true, text: 'Expense Trend Over Time' },
            scales: {
                xAxes: [{ type: 'time', time: { unit: 'day' } }]
            }
        }
    });
}

function updateTagChart() {
    const ctx = document.getElementById('tagChart').getContext('2d');
    const tagTotals = expenses.reduce((totals, expense) => {
        const convertedAmount = convertCurrency(expense.amount, expense.currency, preferredCurrency);
        expense.tags.forEach(tag => {
            totals[tag] = (totals[tag] || 0) + convertedAmount;
        });
        return totals;
    }, {});

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(tagTotals),
            datasets: [{
                label: 'Expenses by Tag',
                data: Object.values(tagTotals),
                backgroundColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true,
            title: { display: true, text: 'Expenses by Tag' },
            scales: {
                yAxes: [{ ticks: { beginAtZero: true } }]
            }
        }
    });
}

exportBtn.addEventListener('click', function() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Amount,Currency,Category,Date,Tags\n";
    expenses.forEach(expense => {
        csvContent += `${expense.name},${expense.amount},${expense.currency},${expense.category},${expense.date},${expense.tags.join(';')}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
});

budgetForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const budgetAmount = parseFloat(document.getElementById('budgetAmount').value);
    const budgetCurrency = document.getElementById('budgetCurrency').value;
    if (!isNaN(budgetAmount)) {
        budget = { amount: budgetAmount, currency: budgetCurrency };
        updateBudgetInfo();
        saveBudget();
    }
});

function updateBudgetInfo() {
    const totalExpenses = expenses.reduce((sum, expense) => {
        return sum + convertCurrency(expense.amount, expense.currency, budget.currency);
    }, 0);
    const remaining = budget.amount - totalExpenses;
    const percentage = (totalExpenses / budget.amount) * 100;

    budgetInfo.innerHTML = `
        <p>Budget: ${currencies[budget.currency].symbol}${budget.amount.toFixed(2)}</p>
        <p>Remaining: ${currencies[budget.currency].symbol}${remaining.toFixed(2)}</p>
        <div class="progress">
            <div class="progress-bar ${percentage > 100 ? 'bg-danger' : 'bg-success'}" 
                 role="progressbar" style="width: ${Math.min(percentage, 100)}%" 
                 aria-valuenow="${Math.min(percentage, 100)}" aria-valuemin="0" aria-valuemax="100">
                ${percentage.toFixed(2)}%
            </div>
        </div>
    `;
}

recurringExpenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('recurringExpenseName').value;
    const amount = parseFloat(document.getElementById('recurringExpenseAmount').value);
    const currency = document.getElementById('recurringExpenseCurrency').value;
    const category = document.getElementById('recurringExpenseCategory').value;
    const frequency = document.getElementById('recurringExpenseFrequency').value;

    if (name && amount && currency && category && frequency) {
        const recurringExpense = { name, amount, currency, category, frequency };
        recurringExpenses.push(recurringExpense);
        updateRecurringExpensesList();
        saveRecurringExpenses();
        recurringExpenseForm.reset();
    }
});

function updateRecurringExpensesList() {
    recurringExpensesList.innerHTML = '';
    recurringExpenses.forEach((expense, index) => {
        const item = document.createElement('div');
        item.classList.add('recurring-expense-item');
        item.innerHTML = `
            <span>${expense.name}</span>
            <span>${currencies[expense.currency].symbol}${expense.amount.toFixed(2)}</span>
            <span>${expense.category}</span>
            <span>${expense.frequency}</span>
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

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function saveBudget() {
    localStorage.setItem('budget', JSON.stringify(budget));
}

function saveRecurringExpenses() {
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
}

function loadData() {
    const savedExpenses = localStorage.getItem('expenses');
    const savedBudget = localStorage.getItem('budget');
    const savedRecurringExpenses = localStorage.getItem('recurringExpenses');
    const savedPreferredCurrency = localStorage.getItem('preferredCurrency');

    if (savedExpenses) expenses = JSON.parse(savedExpenses);
    if (savedBudget) budget = JSON.parse(savedBudget);
    if (savedRecurringExpenses) recurringExpenses = JSON.parse(savedRecurringExpenses);
    if (savedPreferredCurrency) {
        preferredCurrency = savedPreferredCurrency;
        preferredCurrencySelect.value = preferredCurrency;
    }

    updateExpenseList();
    updateTotalExpenses();
    updateCharts();
    updateBudgetInfo();
    updateRecurringExpensesList();
}

document.addEventListener('DOMContentLoaded', loadData);

preferredCurrencySelect.addEventListener('change', function() {
    setPreferredCurrency(this.value);
});

function applyRecurringExpenses() {
    const today = new Date();
    recurringExpenses.forEach(recurringExpense => {
        if (shouldApplyRecurringExpense(recurringExpense, today)) {
            expenses.push({
                name: recurringExpense.name,
                amount: recurringExpense.amount,
                currency: recurringExpense.currency,
                category: recurringExpense.category,
                date: today.toISOString().split('T')[0],
                tags: ['recurring']
            });
            recurringExpense.lastApplied = today.toISOString().split('T')[0];
        }
    });
    updateExpenseList();
    updateTotalExpenses();
    updateCharts();
    updateBudgetInfo();
    saveExpenses();
    saveRecurringExpenses();
}

function shouldApplyRecurringExpense(recurringExpense, today) {
    if (!recurringExpense.lastApplied) return true;
    const lastApplied = new Date(recurringExpense.lastApplied);
    const diffDays = Math.floor((today - lastApplied) / (1000 * 60 * 60 * 24));
    switch (recurringExpense.frequency) {
        case 'daily': return diffDays >= 1;
        case 'weekly': return diffDays >= 7;
        case 'monthly': return today.getMonth() !== lastApplied.getMonth() || today.getFullYear() !== lastApplied.getFullYear();
        case 'yearly': return today.getFullYear() !== lastApplied.getFullYear();
        default: return false;
    }
}

setInterval(applyRecurringExpenses, 24 * 60 * 60 * 1000);