const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const categoryFilter = document.getElementById('categoryFilter');
const totalExpensesDisplay = document.getElementById('totalExpenses');
let expenses = [];

expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('expenseName').value;
    const amount = document.getElementById('expenseAmount').value;
    const category = document.getElementById('expenseCategory').value;
    
    if (name && amount && category) {
        const expense = { 
            name, 
            amount: parseFloat(amount), 
            category,
            date: new Date().toISOString() 
        };
        expenses.push(expense);
        updateExpenseList();
        updateTotalExpenses();
        expenseForm.reset();
    }
});

categoryFilter.addEventListener('change', updateExpenseList);

function updateExpenseList() {
    const selectedCategory = categoryFilter.value;
    expenseList.innerHTML = '';
    expenses
        .filter(expense => selectedCategory === '' || expense.category === selectedCategory)
        .forEach((expense, index) => {
            const item = document.createElement('div');
            item.classList.add('expense-item');
            item.innerHTML = `
                <span>${expense.name}</span>
                <span class="category-label category-${expense.category}">${expense.category}</span>
                <span>$${expense.amount.toFixed(2)}</span>
                <span>${new Date(expense.date).toLocaleDateString()}</span>
                <button onclick="deleteExpense(${index})">Delete</button>
            `;
            expenseList.appendChild(item);
        });
    saveExpenses(); 
}

function updateTotalExpenses() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalExpensesDisplay.textContent = `Total: $${total.toFixed(2)}`;
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    updateExpenseList();
    updateTotalExpenses();
    saveExpenses();
}

document.addEventListener('DOMContentLoaded', () => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
        updateExpenseList();
        updateTotalExpenses();
    }
});

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}
