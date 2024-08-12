const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const categoryFilter = document.getElementById('categoryFilter');
const startDateFilter = document.getElementById('startDate');
const endDateFilter = document.getElementById('endDate');
const applyFilterBtn = document.getElementById('applyFilter');
const totalExpensesDisplay = document.getElementById('totalExpenses');
const exportBtn = document.getElementById('exportBtn');
const budgetForm = document.getElementById('budgetForm');
const budgetInfo = document.getElementById('budgetInfo');
let expenses = [];
let budget = 0;

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
    }
});

applyFilterBtn.addEventListener('click', updateExpenseList);

function updateExpenseList() {
    const selectedCategory = categoryFilter.value;
    const startDate = startDateFilter.value;
    const endDate = endDateFilter.value;
    
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
    saveExpenses(); 
    updateCharts();
    updateBudgetInfo();
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
                borderColor: '#333',
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

document.addEventListener('DOMContentLoaded', () => {
    const savedExpenses = localStorage.getItem('expenses');
    const savedBudget = localStorage.getItem('budget');
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
        updateExpenseList();
        updateTotalExpenses();
        updateCharts();
    }
    if (savedBudget) {
        budget = parseFloat(savedBudget);
        updateBudgetInfo();
    }
});

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function saveBudget() {
    localStorage.setItem('budget', budget.toString());
}
