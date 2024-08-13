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
let expenses = [];
let recurringExpenses = [];
let budget = 0;

flatpickr("#expenseDate", {
    dateFormat: "Y-m-d",
    defaultDate: "today"
});

flatpickr("#dateRangeFilter", {
    mode: "range",
    dateFormat: "Y-m-d"
});

expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('expenseName').value;
    const amount = document.getElementById('expenseAmount').value;
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;
    
    if (name && amount && category && date) {
        const expense = { 
            name, 
            amount: parseFloat(amount), 
            category,
            date
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
                <span>$${expense.amount.toFixed(2)}</span>
                <span>${expense.date}</span>
                <button class="btn btn-danger btn-sm" onclick="deleteExpense(${index})">Delete</button>
            `;
            expenseList.appendChild(item);
        });
}

function updateTotalExpenses() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalExpensesDisplay.textContent = `Total: $${total.toFixed(2)}`;
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
    csvContent += "Name,Amount,Category,Date\n";
    expenses.forEach(expense => {
        csvContent += `${expense.name},${expense.amount},${expense.category},${expense.date}\n`;
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
        budget = budgetAmount;
        updateBudgetInfo();
        saveBudget();
    }
});

function updateBudgetInfo() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = budget - total;
    const percentage = (total / budget) * 100;

    budgetInfo.innerHTML = `
        <p>Budget: $${budget.toFixed(2)}</p>
        <p>Remaining: $${remaining.toFixed(2)}</p>
        <div class="budget-progress">
            <div class="budget-progress-bar bg-${percentage > 100 ? 'danger' : 'success'}" 
                 style="width: ${Math.min(percentage, 100)}%"></div>
        </div>
    `;
}

recurringExpenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('recurringExpenseName').value;
    const amount = parseFloat(document.getElementById('recurringExpenseAmount').value);
    const frequency = document.getElementById('recurringExpenseFrequency').value;

    if (name && amount && frequency) {
        const recurringExpense = { name, amount, frequency };
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
            <span>$${expense.amount.toFixed(2)}</span>
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
        let lastAppliedDate = new Date(recurringExpense.lastApplied || today);
        let nextApplicationDate = new Date(lastAppliedDate);

        switch (recurringExpense.frequency) {
            case 'daily':
                nextApplicationDate.setDate(nextApplicationDate.getDate() + 1);
                break;
            case 'weekly':
                nextApplicationDate.setDate(nextApplicationDate.getDate() + 7);
                break;
            case 'monthly':
                nextApplicationDate.setMonth(nextApplicationDate.getMonth() + 1);
                break;
        }

        if (nextApplicationDate <= today) {
            expenses.push({
                name: recurringExpense.name,
                amount: recurringExpense.amount,
                category: 'Recurring',
                date: today.toISOString().split('T')[0]
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

document.addEventListener('DOMContentLoaded', () => {
    const savedExpenses = localStorage.getItem('expenses');
    const savedRecurringExpenses = localStorage.getItem('recurringExpenses');
    const savedBudget = localStorage.getItem('budget');

    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
    if (savedRecurringExpenses) {
        recurringExpenses = JSON.parse(savedRecurringExpenses);
    }
    if (savedBudget) {
        budget = parseFloat(savedBudget);
    }

    applyRecurringExpenses();
    updateExpenseList();
    updateTotalExpenses();
    updateCharts();
    updateBudgetInfo();
    updateRecurringExpensesList();

    setInterval(applyRecurringExpenses, 24 * 60 * 60 * 1000);
});

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function saveBudget() {
    localStorage.setItem('budget', budget.toString());
}

const categoryForm = document.getElementById('categoryForm');
const categoryList = document.getElementById('categoryList');
let categories = ['food', 'transport', 'utilities', 'entertainment', 'other'];

categoryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const newCategory = document.getElementById('newCategory').value.toLowerCase();
    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        updateCategoryList();
        updateCategoryDropdowns();
        saveCategories();
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

function deleteCategory(index) {
    categories.splice(index, 1);
    updateCategoryList();
    updateCategoryDropdowns();
    saveCategories();
}

function updateCategoryDropdowns() {
    const categoryDropdowns = document.querySelectorAll('#expenseCategory, #categoryFilter');
    categoryDropdowns.forEach(dropdown => {
        const currentValue = dropdown.value;
        dropdown.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            dropdown.appendChild(option);
        });
        dropdown.value = currentValue;
    });
}

function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

document.addEventListener('DOMContentLoaded', () => {
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    }
    updateCategoryList();
    updateCategoryDropdowns();
});

const backupBtn = document.getElementById('backupBtn');
const restoreInput = document.getElementById('restoreInput');

backupBtn.addEventListener('click', function() {
    const data = {
        expenses,
        recurringExpenses,
        budget,
        categories
    };
    const jsonData = JSON.stringify(data);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expense_tracker_backup.json';
    link.click();
});

restoreInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                expenses = data.expenses || [];
                recurringExpenses = data.recurringExpenses || [];
                budget = data.budget || 0;
                categories = data.categories || ['food', 'transport', 'utilities', 'entertainment', 'other'];
                
                updateExpenseList();
                updateTotalExpenses();
                updateCharts();
                updateBudgetInfo();
                updateRecurringExpensesList();
                updateCategoryList();
                updateCategoryDropdowns();
                
                saveExpenses();
                saveRecurringExpenses();
                saveBudget();
                saveCategories();
                
                alert('Data restored successfully!');
            } catch (error) {
                alert('Error restoring data. Please make sure the file is valid.');
            }
        };
        reader.readAsText(file);
    }
});