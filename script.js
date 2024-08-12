const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
let expenses = [];

expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('expenseName').value;
    const amount = document.getElementById('expenseAmount').value;
    
    if (name && amount) {
        const expense = { name, amount: parseFloat(amount) };
        expenses.push(expense);
        updateExpenseList();
        expenseForm.reset();
    }
});

function updateExpenseList() {
    expenseList.innerHTML = '';
    expenses.forEach((expense, index) => {
        const item = document.createElement('div');
        item.classList.add('expense-item');
        item.innerHTML = `
            <span>${expense.name}</span>
            <span>$${expense.amount.toFixed(2)}</span>
        `;
        expenseList.appendChild(item);
    });
}