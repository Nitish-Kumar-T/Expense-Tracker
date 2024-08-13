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
const categoryForm = document.getElementById('categoryForm');
const categoryList = document.getElementById('categoryList');
const backupBtn = document.getElementById('backupBtn');
const restoreInput = document.getElementById('restoreInput');
const currencySelect = document.getElementById('currencySelect');

let expenses = [];
let recurringExpenses = [];
let budget = 0;
let categories = ['food', 'transport', 'utilities', 'entertainment', 'other'];
const currencies = {
    USD: { symbol: '$', rate: 0.012 },
    EUR: { symbol: '€', rate: 0.011 },
    GBP: { symbol: '£', rate: 0.0093 },
    INR: { symbol: '₹', rate: 1 }
};
let selectedCurrency = 'INR'; 

flatpickr("#expenseDate", {
    dateFormat: "Y-m-d",
    defaultDate: "today"
});

flatpickr("#dateRangeFilter", {
    mode: "range",
    dateFormat: "Y-m-d"
});

function formatCurrency(amount) {
    return currencies[selectedCurrency].symbol + amount.toFixed(2);
}

expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('expenseName').value;
    const amount = document.getElementById('expenseAmount').value;
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;
    
    if (name && amount && category && date) {
        const expense = { 
            name, 
            amount: parseFloat(amount) * currencies[selectedCurrency].rate, 
            category,
            date,
            currency: selectedCurrency
        };
        expenses.push(expense);
        updateExpenseList();
        updateTotalExpenses();
        updateCharts();
        updateBudgetInfo();
        expenseForm.reset();
        flatpickr("#expenseDate").setDate("today");
    }
});

applyFilterBtn.addEventListener('click', updateExpenseList);

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
            const item = document.createElement('div');
            item.classList.add('expense-item', 'mb-2', 'd-flex', 'justify-content-between', 'align-items-center');
            item.innerHTML = `
                <span>${expense.name}</span>
                <span class="category-label category-${expense.category}">${expense.category}</span>
                <span>${formatCurrency(expense.amount / currencies[expense.currency].rate)}</span>
                <span>${expense.date}</span>
                <button class="btn btn-danger btn-sm" onclick="deleteExpense(${index})">Delete</button>
            `;
            expenseList.appendChild(item);
        });
}

function updateTotalExpenses() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalExpensesDisplay.textContent = `Total: ${formatCurrency(total / currencies[selectedCurrency].rate)}`;
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
}

function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categoryTotals = expenses.reduce((totals, expense) => {
        totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
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
            title: {
                display: true,
                text: 'Expenses by Category'
            }
        }
    });
}

function updateTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const sortedExpenses = expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
    const dates = sortedExpenses.map(expense => expense.date);
    const amounts = sortedExpenses.map(expense => expense.amount);

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
            title: {
                display: true,
                text: 'Expense Trend Over Time'
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }]
            }
        }
    });
}

exportBtn.addEventListener('click', function() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Amount,Category,Date,Currency\n";
    expenses.forEach(expense => {
        csvContent += `${expense.name},${expense.amount / currencies[expense.currency].rate},${expense.category},${expense.date},${expense.currency}\n`;
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
    if (!isNaN(budgetAmount)) {
        budget = budgetAmount * currencies[selectedCurrency].rate;
        updateBudgetInfo();
        saveBudget();
    }
});

function updateBudgetInfo() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = budget - total;
    const percentage = (total / budget) * 100;

    budgetInfo.innerHTML = `
        <p>Budget: ${formatCurrency(budget)}</p>
        <p>Remaining: ${formatCurrency(remaining)}</p>
        <div class="budget-progress">
            <div class="budget-progress-bar bg-${percentage > 100 ? 'danger' : 'success'}" 
                 style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
    `;
}

recurringExpenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('recurringExpenseName').value;
    const amount = parseFloat(document.getElementById('recurringExpenseAmount').value) * currencies[selectedCurrency].rate;
    const frequency = document.getElementById('recurringExpenseFrequency').value;

    if (name && amount && frequency) {
        const recurringExpense = { name, amount, frequency, currency: selectedCurrency };
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
            <span>${formatCurrency(expense.amount / currencies[expense.currency].rate)}</span>
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

function saveRecurringExpenses() {
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
}

function applyRecurringExpenses() {
    const today = new Date();
    recurringExpenses.forEach(recurringExpense => {
        if (shouldApplyRecurringExpense(recurringExpense, today)) {
            expenses.push({
                ...recurringExpense,
                date: today.toISOString().split('T')[0],
                category: 'recurring'
            });
        }
    });
    updateExpenseList();
    updateTotalExpenses();
    updateCharts();
    updateBudgetInfo();
}

function shouldApplyRecurringExpense(expense, today) {
    const lastApplied = new Date(localStorage.getItem(`lastApplied_${expense.name}`) || 0);
    const nextApplyDate = new Date(lastApplied);

    switch (expense.frequency) {
        case 'daily':
            nextApplyDate.setDate(lastApplied.getDate() + 1);
            break;
        case 'weekly':
            nextApplyDate.setDate(lastApplied.getDate() + 7);
            break;
        case 'monthly':
            nextApplyDate.setMonth(lastApplied.getMonth() + 1);
            break;
    }

    if (today >= nextApplyDate) {
        localStorage.setItem(`lastApplied_${expense.name}`, today.toISOString());
        return true;
    }
    return false;
}

categoryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const categoryName = document.getElementById('newCategory').value.trim().toLowerCase();
    if (categoryName && !categories.includes(categoryName)) {
        categories.push(categoryName);
        updateCategoryList();
        updateCategoryFilterOptions();
        categoryForm.reset();
    }
});

function updateCategoryList() {
    categoryList.innerHTML = '';
    categories.forEach((category, index) => {
        const item = document.createElement('div');
        item.classList.add('category-item');
        item.innerHTML = `
            <span>${category}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteCategory(${index})">Delete</button>
        `;
        categoryList.appendChild(item);
    });
}

function updateCategoryFilterOptions() {
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryFilter.appendChild(option);
    });
}

function deleteCategory(index) {
    const categoryToDelete = categories[index];
    categories.splice(index, 1);
    expenses = expenses.filter(expense => expense.category !== categoryToDelete);
    updateExpenseList();
    updateCategoryList();
    updateCategoryFilterOptions();
    updateCharts();
    saveCategories();
}

currencySelect.addEventListener('change', function() {
    selectedCurrency = currencySelect.value;
    updateExpenseList();
    updateTotalExpenses();
    updateBudgetInfo();
    updateCharts();
    saveCurrencyPreference();
});

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function saveBudget() {
    localStorage.setItem('budget', budget);
}

function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

function saveCurrencyPreference() {
    localStorage.setItem('selectedCurrency', selectedCurrency);
}

function loadFromLocalStorage() {
    const storedExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const storedRecurringExpenses = JSON.parse(localStorage.getItem('recurringExpenses')) || [];
    const storedBudget = parseFloat(localStorage.getItem('budget')) || 0;
    const storedCategories = JSON.parse(localStorage.getItem('categories')) || categories;
    const storedCurrency = localStorage.getItem('selectedCurrency') || 'INR';

    expenses = storedExpenses;
    recurringExpenses = storedRecurringExpenses;
    budget = storedBudget;
    categories = storedCategories;
    selectedCurrency = storedCurrency;

    currencySelect.value = selectedCurrency;
    updateExpenseList();
    updateTotalExpenses();
    updateRecurringExpensesList();
    updateBudgetInfo();
    updateCategoryList();
    updateCategoryFilterOptions();
    applyRecurringExpenses();
    updateCharts();
}

backupBtn.addEventListener('click', function() {
    const data = {
        expenses,
        recurringExpenses,
        budget,
        categories,
        selectedCurrency
    };
    const dataStr = JSON.stringify(data);
    const encodedUri = encodeURI("data:text/json;charset=utf-8," + dataStr);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "budget_backup.json");
    document.body.appendChild(link);
    link.click();
});

restoreInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = JSON.parse(e.target.result);
            expenses = data.expenses || [];
            recurringExpenses = data.recurringExpenses || [];
            budget = data.budget || 0;
            categories = data.categories || categories;
            selectedCurrency = data.selectedCurrency || 'INR';

            localStorage.setItem('expenses', JSON.stringify(expenses));
            localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
            localStorage.setItem('budget', budget);
            localStorage.setItem('categories', JSON.stringify(categories));
            localStorage.setItem('selectedCurrency', selectedCurrency);

            loadFromLocalStorage();
        };
        reader.readAsText(file);
    }
});

window.addEventListener('load', loadFromLocalStorage);
